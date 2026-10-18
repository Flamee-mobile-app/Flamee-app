import { ArrowLeft } from "@tamagui/lucide-icons-2/icons/ArrowLeft";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Pencil } from "@tamagui/lucide-icons-2/icons/Pencil";
import { UserRound } from "@tamagui/lucide-icons-2/icons/UserRound";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { AppButton, AppField, AppIconButton, AppScreen, appToast } from "../../../shared/components";
import { colors, featureTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { authService, type AuthSession } from "../../auth";
import { localMediaAdapter, type LocalMediaResult } from "../../media";
import { hasProfileTextChanged, saveProfileChanges } from "../profileSaveFlow";
import { createProfileDraftCleanup } from "../profileDraftCleanup";

const avatarSize = 104;
const fullNameLimit = 120;
const usernameLimit = 40;

function countCharacters(value: string) {
  return Array.from(value.trim()).length;
}

type AvatarDraft = Extract<LocalMediaResult, { kind: "selected" }>;

export function ProfileEditScreen() {
  const router = useRouter();
  const accountId = useSessionStore((session) => session.activeAccountId);
  const cached = authService.getSessionSnapshot();
  const initialProfile = cached?.accountId === accountId ? cached : null;
  const [profile, setProfile] = useState<AuthSession | null>(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile?.user.full_name ?? "");
  const [username, setUsername] = useState(initialProfile?.user.username ?? "");
  const [avatarDraft, setAvatarDraft] = useState<AvatarDraft | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const revision = useRef(0);
  const editRevision = useRef(0);
  const savePending = useRef(false);
  const avatarPending = useRef(false);
  const avatarDraftRef = useRef<AvatarDraft | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draftCleanup] = useState(() => createProfileDraftCleanup(localMediaAdapter.cleanup));
  const avatarPreview = avatarDraft?.uri ?? profile?.user.avatar_url ?? null;

  useEffect(() => { avatarDraftRef.current = avatarDraft; }, [avatarDraft]);
  useEffect(() => setAvatarLoadFailed(false), [avatarPreview]);
  useEffect(() => {
    draftCleanup.cancel();
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
      const draft = avatarDraftRef.current;
      if (draft && !savePending.current) draftCleanup.schedule(draft.uri);
    };
  }, [draftCleanup]);

  const applySession = useCallback((session: AuthSession, applyFields: boolean) => {
    setProfile(session);
    useSessionStore.getState().setActiveAvatar(session.user.avatar_url ?? null);
    if (applyFields) {
      setDisplayName(session.user.full_name);
      setUsername(session.user.username ?? "");
    }
  }, []);

  const refresh = useCallback(async () => {
    const request = ++revision.current;
    const editAtStart = editRevision.current;
    try {
      const session = await authService.refreshCurrentSession();
      if (request !== revision.current || useSessionStore.getState().activeAccountId !== accountId) return;
      if (!session || session.accountId !== accountId) throw new Error("Session unavailable");
      applySession(session, editRevision.current === editAtStart);
    } catch {
      if (request === revision.current) appToast.error(getMessage("vi", "settingsLoadError"));
    }
  }, [accountId, applySession]);

  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { revision.current += 1; };
  }, [refresh]));

  const displayNameCount = countCharacters(displayName);
  const usernameCount = countCharacters(username);
  const displayNameError = displayNameCount === 0
    ? getMessage("vi", "profileDisplayNameRequired")
    : displayNameCount > fullNameLimit
      ? getMessage("vi", "profileDisplayNameTooLong")
      : undefined;
  const usernameError = usernameCount > usernameLimit
    ? getMessage("vi", "profileUsernameTooLong")
    : undefined;
  const invalid = Boolean(displayNameError || usernameError);
  const unavailable = profile?.accountId !== accountId;
  const profileChanged = profile ? hasProfileTextChanged(
    { fullName: displayName, username },
    { fullName: profile.user.full_name, username: profile.user.username ?? "" },
  ) : false;
  const hasChanges = profileChanged || Boolean(avatarDraft);

  const clearSavedState = () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = null;
    setSaved(false);
  };

  const showSavedState = () => {
    clearSavedState();
    setSaved(true);
    savedTimer.current = setTimeout(() => {
      savedTimer.current = null;
      setSaved(false);
    }, 1600);
  };

  const save = async () => {
    if (savePending.current || avatarPending.current || invalid || unavailable || !hasChanges) return;
    savePending.current = true;
    clearSavedState();
    setSaving(true);
    const loadingToastId = appToast.loading(getMessage("vi", "profileSaving"));
    const request = revision.current;
    const draft = avatarDraft;
    try {
      const result = await saveProfileChanges({
        currentSession: profile!,
        profileChanged,
        fullName: displayName.trim(),
        username: username.trim(),
        avatarUri: draft?.uri ?? null,
      }, {
        updateProfile: authService.updateProfile,
        updateAvatar: authService.updateAvatar,
      });
      if (request !== revision.current || useSessionStore.getState().activeAccountId !== accountId) return;
      if (result.kind === "profile_error") {
        appToast.dismiss(loadingToastId);
        appToast.error(getMessage("vi", "profileSaveFailed"));
        return;
      }
      applySession(result.session, true);
      if (result.kind === "avatar_error") {
        appToast.dismiss(loadingToastId);
        appToast.error(getMessage("vi", "profileAvatarUploadFailed"), { description: getMessage("vi", "profileTextSavedAvatarFailed") });
        return;
      }
      if (draft) {
        if (avatarDraftRef.current?.uri === draft.uri) avatarDraftRef.current = null;
        setAvatarDraft((current) => current?.uri === draft.uri ? null : current);
      }
      appToast.dismiss(loadingToastId);
      appToast.success(getMessage("vi", "settingsSaved"));
      showSavedState();
      if (draft) void localMediaAdapter.cleanup(draft.uri);
    } catch {
      if (request === revision.current) {
        appToast.dismiss(loadingToastId);
        appToast.error(getMessage("vi", "profileSaveFailed"));
      }
    } finally {
      appToast.dismiss(loadingToastId);
      if (request !== revision.current && draft) void localMediaAdapter.cleanup(draft.uri);
      savePending.current = false;
      if (request === revision.current) setSaving(false);
    }
  };

  const pickAvatar = async () => {
    if (avatarPending.current || savePending.current || unavailable) return;
    avatarPending.current = true;
    setAvatarBusy(true);
    const request = revision.current;
    const selected = await localMediaAdapter.selectPhoto("library");
    if (request !== revision.current || useSessionStore.getState().activeAccountId !== accountId) {
      if (selected.kind === "selected") await localMediaAdapter.cleanup(selected.uri);
      avatarPending.current = false;
      return;
    }
    if (selected.kind !== "selected") {
      avatarPending.current = false;
      setAvatarBusy(false);
      if (selected.kind === "denied") appToast.warning(getMessage("vi", "profileAvatarPermissionDenied"));
      else if (selected.kind === "unavailable") appToast.error(getMessage("vi", "profileAvatarUnavailable"));
      return;
    }
    const previous = avatarDraftRef.current;
    avatarDraftRef.current = selected;
    setAvatarDraft(selected);
    clearSavedState();
    if (previous && previous.uri !== selected.uri) await localMediaAdapter.cleanup(previous.uri);
    avatarPending.current = false;
    setAvatarBusy(false);
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppScreen scroll={false} contentProps={{ width: "100%", maxWidth: featureTokens.maxWidth, alignSelf: "center", flex: 1, paddingBottom: "$lg" }}>
        <XStack minHeight={44} alignItems="center" justifyContent="space-between" position="relative">
          <AppIconButton tone="neutral" accessibilityLabel={getMessage("vi", "back")} icon={<ArrowLeft size={20} color="$textPrimary" aria-hidden={true} />} onPress={router.back} />
          <Text position="absolute" left={52} right={52} textAlign="center" pointerEvents="none" fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary">
            {getMessage("vi", "profileEditTitle")}
          </Text>
          <YStack width={44} height={44} aria-hidden={true} />
        </XStack>
        <ScrollView flex={1} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <YStack flexGrow={1} gap="$xl">
            <YStack alignItems="center" paddingTop="$lg" paddingBottom="$sm">
              <YStack width={avatarSize} height={avatarSize} borderRadius={avatarSize / 2} backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center" overflow="visible">
                {avatarPreview && !avatarLoadFailed ? (
                  <Image
                    source={{ uri: avatarPreview }}
                    resizeMode="cover"
                    fadeDuration={160}
                    onError={() => setAvatarLoadFailed(true)}
                    accessibilityLabel={getMessage("vi", "profileAvatarLabel")}
                    style={styles.avatar}
                  />
                ) : <UserRound size={46} color="$textSecondary" aria-hidden={true} />}
                <YStack position="absolute" right={-8} bottom={-8}>
                  <AppIconButton
                    testID="profile-avatar-edit"
                    tone="avatar"
                    disabled={avatarBusy || saving || unavailable}
                    accessibilityLabel={getMessage("vi", "profileAvatarEdit")}
                    icon={avatarBusy ? <ActivityIndicator size="small" color={colors.accentText} /> : <Pencil size={19} color="$accentText" aria-hidden={true} />}
                    onPress={() => void pickAvatar()}
                  />
                </YStack>
              </YStack>
            </YStack>

            <YStack gap="$lg">
              <YStack gap="$sm">
                <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$xs">
                  <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "displayNameLabel")}</Text>
                  <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{displayNameCount}/{fullNameLimit}</Text>
                </XStack>
                <AppField showLabel={false} label={getMessage("vi", "displayNameLabel")} value={displayName} error={displayNameError} onChangeText={(value) => { editRevision.current += 1; clearSavedState(); setDisplayName(value); }} maxLength={fullNameLimit * 2} editable={!saving && !avatarBusy && !unavailable} />
              </YStack>
              <YStack gap="$sm">
                <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$xs">
                  <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "profileUsernameLabel")}</Text>
                  <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{usernameCount}/{usernameLimit}</Text>
                </XStack>
                <AppField showLabel={false} label={getMessage("vi", "profileUsernameLabel")} value={username} error={usernameError} onChangeText={(value) => { editRevision.current += 1; clearSavedState(); setUsername(value); }} maxLength={usernameLimit * 2} autoCapitalize="none" editable={!saving && !avatarBusy && !unavailable} />
              </YStack>
            </YStack>
          </YStack>
        </ScrollView>
        <AppButton disabled={invalid || unavailable || avatarBusy || !hasChanges} loading={saving} icon={saved ? <Check size={18} aria-hidden={true} /> : undefined} onPress={() => void save()}>
          {getMessage("vi", saving ? "profileSaving" : saved ? "profileSavedAction" : "save")}
        </AppButton>
      </AppScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  avatar: { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
});
