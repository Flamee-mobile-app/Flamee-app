import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Pencil } from "@tamagui/lucide-icons-2/icons/Pencil";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { AppButton, AppDialog, AppField, AppIconButton, AppProfileAvatar, AppScreen, AppSkeleton, AppSkeletonGroup, AppTextButton, appToast, shouldShowInitialSkeleton, useAppHeader } from "../../../shared/components";
import { colors, featureTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { authService, type AuthSession } from "../../auth";
import { localMediaAdapter, type LocalMediaResult, type LocalPhotoAsset } from "../../media";
import { hasProfileTextChanged, saveProfileChanges } from "../profileSaveFlow";
import { createProfileDraftCleanup } from "../profileDraftCleanup";
import { createProfileSaveLifecycle } from "../profileSaveLifecycle";

const avatarSize = 104;
const fullNameLimit = 120;
const usernameLimit = 40;

function countCharacters(value: string) {
  return Array.from(value.trim()).length;
}

type AvatarDraft = Extract<LocalMediaResult, { kind: "selected" }>;

export function ProfileEditScreen() {
  useAppHeader({ title: getMessage("vi", "profileEditTitle"), showBack: true });
  const accountId = useSessionStore((session) => session.activeAccountId);
  const cached = authService.getSessionSnapshot();
  const initialProfile = cached?.accountId === accountId ? cached : null;
  const [profile, setProfile] = useState<AuthSession | null>(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile?.user.full_name ?? "");
  const [username, setUsername] = useState(initialProfile?.user.username ?? "");
  const [avatarDraft, setAvatarDraft] = useState<AvatarDraft | null>(null);
  const [preparingAvatar, setPreparingAvatar] = useState<LocalPhotoAsset | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingAvatarRemoval, setConfirmingAvatarRemoval] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!initialProfile);
  const revision = useRef(0);
  const editRevision = useRef(0);
  const [saveLifecycle] = useState(createProfileSaveLifecycle);
  const draftAccount = useRef(accountId);
  const avatarPending = useRef(false);
  const avatarDraftRef = useRef<AvatarDraft | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draftCleanup] = useState(() => createProfileDraftCleanup(localMediaAdapter.cleanup));
  const avatarPreview = profile?.accountId === accountId ? preparingAvatar?.uri ?? avatarDraft?.uri ?? profile?.user.avatar_url ?? null : null;

  useEffect(() => { avatarDraftRef.current = avatarDraft; }, [avatarDraft]);
  useEffect(() => setAvatarLoadFailed(false), [avatarPreview]);
  useEffect(() => {
    const pending = saveLifecycle.isSaving();
    saveLifecycle.retain(accountId);
    draftCleanup.cancel();
    setSaving(saveLifecycle.isSaving());
    if (draftAccount.current !== accountId) {
      setConfirmingAvatarRemoval(false);
      const previous = avatarDraftRef.current;
      draftAccount.current = accountId;
      avatarDraftRef.current = null;
      setAvatarDraft(null);
      setPreparingAvatar(null);
      if (previous && !pending) void localMediaAdapter.cleanup(previous.uri);
    }
    return () => {
      saveLifecycle.release();
      if (savedTimer.current) clearTimeout(savedTimer.current);
      const draft = avatarDraftRef.current;
      if (draft && !saveLifecycle.isSaving()) draftCleanup.schedule(draft.uri);
    };
  }, [accountId, draftCleanup, saveLifecycle]);

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
      if (request === revision.current && useSessionStore.getState().activeAccountId === accountId) appToast.error(getMessage("vi", "settingsLoadError"));
    } finally {
      if (request === revision.current && useSessionStore.getState().activeAccountId === accountId) setInitialLoading(false);
    }
  }, [accountId, applySession]);

  useFocusEffect(useCallback(() => {
    setSaving(saveLifecycle.isSaving());
    void refresh();
    return () => { revision.current += 1; setPreparingAvatar(null); setAvatarBusy(false); setConfirmingAvatarRemoval(false); };
  }, [refresh, saveLifecycle]));

  if (shouldShowInitialSkeleton({ pending: initialLoading, hasConfirmedContent: Boolean(profile) })) {
    return <ProfileLoadingView />;
  }

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
    if (saveLifecycle.isSaving() || avatarPending.current || invalid || unavailable || !hasChanges || !accountId || useSessionStore.getState().activeAccountId !== accountId) return;
    const operation = saveLifecycle.begin(accountId);
    if (!operation) return;
    clearSavedState();
    setSaving(true);
    const loadingToastId = appToast.loading(getMessage("vi", "profileSaving"));
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
      if (!saveLifecycle.canApply(operation, useSessionStore.getState().activeAccountId)) return;
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
      if (saveLifecycle.canApply(operation, useSessionStore.getState().activeAccountId)) {
        appToast.dismiss(loadingToastId);
        appToast.error(getMessage("vi", "profileSaveFailed"));
      }
    } finally {
      appToast.dismiss(loadingToastId);
      const settlement = saveLifecycle.settle(operation, useSessionStore.getState().activeAccountId);
      if (settlement.cleanup && draft) void localMediaAdapter.cleanup(draft.uri);
      if (settlement.render) setSaving(settlement.saving);
    }
  };

  const removeAvatar = async () => {
    if (saveLifecycle.isSaving() || avatarPending.current || avatarDraft || unavailable || !accountId || useSessionStore.getState().activeAccountId !== accountId) return;
    const operation = saveLifecycle.begin(accountId);
    if (!operation) return;
    clearSavedState();
    setSaving(true);
    try {
      const result = await authService.removeAvatar();
      if (!saveLifecycle.canApply(operation, useSessionStore.getState().activeAccountId)) return;
      applySession(result, false);
      setConfirmingAvatarRemoval(false);
      appToast.success(getMessage("vi", "profileAvatarRemoved"));
    } catch {
      if (saveLifecycle.canApply(operation, useSessionStore.getState().activeAccountId)) appToast.error(getMessage("vi", "profileAvatarRemoveFailed"));
    } finally {
      const settlement = saveLifecycle.settle(operation, useSessionStore.getState().activeAccountId);
      if (settlement.render) setSaving(settlement.saving);
    }
  };

  const pickAvatar = async () => {
    if (avatarPending.current || saveLifecycle.isSaving() || unavailable || useSessionStore.getState().activeAccountId !== accountId) return;
    avatarPending.current = true;
    setAvatarBusy(true);
    const request = revision.current;
    const selected = await localMediaAdapter.selectPhoto("library", { purpose: "avatar", onPreview: (asset) => {
      if (request === revision.current && useSessionStore.getState().activeAccountId === accountId) setPreparingAvatar(asset);
    } });
    if (request !== revision.current || useSessionStore.getState().activeAccountId !== accountId) {
      if (selected.kind === "selected") await localMediaAdapter.cleanup(selected.uri);
      avatarPending.current = false;
      return;
    }
    setPreparingAvatar(null);
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
    if (previous && previous.uri !== selected.uri) void localMediaAdapter.cleanup(previous.uri);
    avatarPending.current = false;
    setAvatarBusy(false);
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppScreen scroll={false} contentProps={{ width: "100%", maxWidth: featureTokens.maxWidth, alignSelf: "center", flex: 1, paddingBottom: "$lg" }}>
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
                ) : <AppProfileAvatar size={avatarSize} fallbackSeed={accountId} accessibilityLabel={getMessage("vi", "profileAvatarLabel")} />}
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
              {Boolean(profile?.user.avatar_url) && !avatarDraft && !preparingAvatar ? <AppTextButton tone="danger" disabled={avatarBusy || saving || unavailable} onPress={() => setConfirmingAvatarRemoval(true)}>{getMessage("vi", "profileAvatarRemove")}</AppTextButton> : null}
              <AppDialog open={confirmingAvatarRemoval} onOpenChange={setConfirmingAvatarRemoval} dismissible={!saving} title={getMessage("vi", "profileAvatarRemove")} description={getMessage("vi", "profileAvatarRemoveBody")}>
                <AppButton fill variant="destructive" loading={saving} onPress={() => void removeAvatar()}>{getMessage("vi", "profileAvatarRemove")}</AppButton>
                <AppButton fill variant="secondary" disabled={saving} onPress={() => setConfirmingAvatarRemoval(false)}>{getMessage("vi", "cancel")}</AppButton>
              </AppDialog>
            </YStack>

            <YStack gap="$lg">
              <YStack gap="$sm">
                <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$xs">
                  <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "displayNameLabel")}</Text>
                  <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{displayNameCount}/{fullNameLimit}</Text>
                </XStack>
                <AppField showLabel={false} surfaceTone="elevated" label={getMessage("vi", "displayNameLabel")} value={displayName} error={displayNameError} onChangeText={(value) => { editRevision.current += 1; clearSavedState(); setDisplayName(value); }} maxLength={fullNameLimit * 2} editable={!saving && !avatarBusy && !unavailable} />
              </YStack>
              <YStack gap="$sm">
                <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$xs">
                  <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "profileUsernameLabel")}</Text>
                  <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{usernameCount}/{usernameLimit}</Text>
                </XStack>
                <AppField showLabel={false} surfaceTone="elevated" label={getMessage("vi", "profileUsernameLabel")} value={username} error={usernameError} onChangeText={(value) => { editRevision.current += 1; clearSavedState(); setUsername(value); }} maxLength={usernameLimit * 2} autoCapitalize="none" editable={!saving && !avatarBusy && !unavailable} />
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

function ProfileLoadingView() {
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppScreen scroll={false} contentProps={{ width: "100%", maxWidth: featureTokens.maxWidth, alignSelf: "center", flex: 1, paddingBottom: "$lg" }}>
        <AppSkeletonGroup accessibilityLabel={getMessage("vi", "loadingDescription")} fill>
          <YStack flex={1} gap="$xl" paddingTop="$lg">
            <YStack alignItems="center" paddingBottom="$sm">
              <AppSkeleton width={avatarSize} height={avatarSize} borderRadius={avatarSize / 2} />
            </YStack>
            {[0, 1].map((key) => <YStack key={key} gap="$sm">
              <XStack justifyContent="space-between"><AppSkeleton width={112} height={14} /><AppSkeleton width={42} height={12} /></XStack>
              <AppSkeleton width="100%" height={52} borderRadius={18} />
            </YStack>)}
          </YStack>
          <AppSkeleton width="100%" height={48} borderRadius={16} />
        </AppSkeletonGroup>
      </AppScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  avatar: { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
});
