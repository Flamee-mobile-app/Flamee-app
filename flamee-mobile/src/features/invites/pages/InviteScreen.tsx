import { ArrowRight } from "@tamagui/lucide-icons-2/icons/ArrowRight";
import { HeartHandshake } from "@tamagui/lucide-icons-2/icons/HeartHandshake";
import { KeyRound } from "@tamagui/lucide-icons-2/icons/KeyRound";
import { Send } from "@tamagui/lucide-icons-2/icons/Send";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Share } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { featureTokens } from "../../../shared/constants/tokens";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AppButton, AppField, AppHeader, AppScreen, appToast, AsyncStateView, ContentSurface, SectionCard } from "../../../shared/components";
import { formatMessage, getMessage, type MessageKey } from "../../../shared/localization/messages";
import { authService } from "../../auth/authRuntime";
import { localOnboardingService } from "../../onboarding";
import { InviteCodeCard } from "../components/InviteCodeCard";
import { inviteIntent, invitationURL } from "../inviteIntent";
import { InviteApiError, inviteService, type InviteApiErrorCode, type InvitePreview, type ServerInvite } from "../index";
import { inviteCodeSchema } from "../schemas";

type InviteMode = "choose" | "create" | "join" | "confirm";
type InviteFailure = "not_found" | "expired" | "revoked" | "used" | "already_paired" | "self_invite";

const failureCopy: Record<InviteFailure, { title: MessageKey; description: MessageKey }> = {
  not_found: { title: "inviteNotFoundTitle", description: "inviteNotFoundBody" },
  expired: { title: "inviteExpiredTitle", description: "inviteExpiredBody" },
  revoked: { title: "inviteRevokedTitle", description: "inviteRevokedBody" },
  used: { title: "inviteUsedTitle", description: "inviteUsedBody" },
  already_paired: { title: "alreadyPairedTitle", description: "alreadyPairedBody" },
  self_invite: { title: "inviteSelfTitle", description: "inviteSelfBody" },
};

const mapFailure = (code: InviteApiErrorCode): InviteFailure | null => ({
  invite_not_found: "not_found",
  invite_expired: "expired",
  invite_cancelled: "revoked",
  invite_used: "used",
  already_paired: "already_paired",
  inviter_already_paired: "already_paired",
  self_invite: "self_invite",
} as Partial<Record<InviteApiErrorCode, InviteFailure>>)[code] ?? null;

export function InviteScreen({ initialMode = "choose" }: { initialMode?: "choose" | "join" }) {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const activeCoupleId = useSessionStore((state) => state.activeCoupleId);
  const setActiveCouple = useSessionStore((state) => state.setActiveCouple);
  const [mode, setMode] = useState<InviteMode>("choose");
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [failure, setFailure] = useState<InviteFailure>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [inviteAction, setInviteAction] = useState<"share" | "copy" | "recreate" | null>(null);
  const [invite, setInvite] = useState<ServerInvite | null>(null);
  const [confirmedInvite, setConfirmedInvite] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = async () => {
    if (!accountId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    setFailure(undefined); setConfirmedInvite(null);
    setMode(initialMode); setCode("");
    try {
      const openInvite = await inviteService.current();
      if (useSessionStore.getState().activeAccountId !== accountId) return;
      setInvite(openInvite);
      if (openInvite?.status === "accepted") {
        const session = await authService.refreshCurrentSession();
        if (session?.user.couple_id) setActiveCouple(session.user.couple_id);
      }
      const pendingCode = inviteIntent.getCode();
      if (pendingCode) {
        const validation = await inviteService.preview(pendingCode);
        if (useSessionStore.getState().activeAccountId !== accountId) return;
        setCode(pendingCode);
        setConfirmedInvite(validation); setMode("confirm");
      } else if (openInvite?.status === "pending") setMode("create");
    } catch (error) {
      const mapped = error instanceof InviteApiError ? mapFailure(error.code) : null;
      if (mapped) setFailure(mapped);
      else setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [accountId, initialMode]);

  useEffect(() => {
    if (mode !== "create" || invite?.status !== "pending") return;
    const refresh = async () => {
      try {
        const current = await inviteService.current();
        if (!current) return;
        setInvite(current);
        if (current.status === "accepted") {
          const session = await authService.refreshCurrentSession();
          if (session?.user.couple_id) {
            setActiveCouple(session.user.couple_id);
            router.replace("/(main)");
          }
        }
      } catch { /* transient polling failures keep the current screen stable */ }
    };
    const timer = setInterval(() => { void refresh(); }, 5_000);
    return () => clearInterval(timer);
  }, [invite?.status, mode, router, setActiveCouple]);

  const shareInvite = async () => {
    if (!invite || inviteAction) return;
    setInviteAction("share");
    try {
      const result = await Share.share({ message: `${getMessage("vi", "inviteShareMessage")} ${invite.code}\n${invitationURL(invite.code)}` });
      if (result.action === Share.dismissedAction) {
        appToast.info(getMessage("vi", "inviteShareDismissedTitle"), { description: getMessage("vi", "inviteShareDismissedBody") });
      } else {
        appToast.success(getMessage("vi", "inviteShareSuccessTitle"), { description: getMessage("vi", "inviteShareSuccessBody") });
      }
    } catch {
      appToast.error(getMessage("vi", "inviteActionErrorTitle"), { description: getMessage("vi", "shareInviteError") });
    } finally {
      setInviteAction(null);
    }
  };

  const copyInvite = async () => {
    if (!invite || inviteAction) return;
    setInviteAction("copy");
    try {
      await Clipboard.setStringAsync(invite.code);
      appToast.success(getMessage("vi", "inviteCopiedTitle"), { description: getMessage("vi", "inviteCopiedBody") });
    } catch {
      appToast.error(getMessage("vi", "inviteActionErrorTitle"), { description: getMessage("vi", "inviteCopyErrorBody") });
    } finally {
      setInviteAction(null);
    }
  };

  const createInvite = async (announce = false) => {
    if (!accountId || pending.current) return;
    pending.current = true;
    setBusy(true);
    if (announce) setInviteAction("recreate");
    setFailure(undefined);
    try {
      const created = await inviteService.create();
      setInvite(created);
      setMode("create");
      if (announce) {
        appToast.success(getMessage("vi", "inviteRegeneratedTitle"), { description: getMessage("vi", "inviteRegeneratedBody") });
      }
    } catch {
      if (announce) {
        appToast.error(getMessage("vi", "inviteActionErrorTitle"), { description: getMessage("vi", "inviteRegenerateErrorBody") });
      } else {
        setLoadFailed(true);
      }
    } finally {
      pending.current = false;
      setBusy(false);
      if (announce) setInviteAction(null);
    }
  };

  const checkCode = async () => {
    if (!accountId || pending.current) return;
    const parsed = inviteCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const result = await inviteService.preview(parsed.data.code);
      if (useSessionStore.getState().activeAccountId !== accountId) return;
      setCode(parsed.data.code);
      setConfirmedInvite(result);
      setMode("confirm");
    } catch (error) {
      const mapped = error instanceof InviteApiError ? mapFailure(error.code) : null;
      if (mapped) setFailure(mapped);
      else setLoadFailed(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!accountId || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const result = await inviteService.accept(code);
      if (useSessionStore.getState().activeAccountId !== accountId) return;
      setActiveCouple(result.id);
      await localOnboardingService.finishSetup(accountId);
      inviteIntent.clear();
      router.replace("/(main)");
    } catch (error) {
      const mapped = error instanceof InviteApiError ? mapFailure(error.code) : null;
      if (mapped) setFailure(mapped);
      else setLoadFailed(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const skip = async () => {
    if (!accountId || pending.current) return;
    pending.current = true; setBusy(true);
    try {
      await localOnboardingService.finishSetup(accountId, true);
      inviteIntent.clear();
      router.replace("/(main)");
    } catch { setLoadFailed(true); }
    finally { pending.current = false; setBusy(false); }
  };
  const skipButton = <AppButton variant="ghost" disabled={busy} onPress={() => void skip()}>{getMessage("vi", "skipToHome")}</AppButton>;

  if (!accountId) {
    return <AppScreen><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => router.replace("/(auth)")} /></AppScreen>;
  }

  if (loading) return <AppScreen><AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /></AppScreen>;
  if (loadFailed) {
    return <AppScreen><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => void load()} />{skipButton}</AppScreen>;
  }

  if (activeCoupleId && !failure) {
    return (
      <AppScreen scroll={false} contentProps={{ justifyContent: "center", alignItems: "center" }}>
        <YStack width={96} height={96} borderRadius="$xl" backgroundColor="$supportPeachLight" alignItems="center" justifyContent="center">
          <HeartHandshake size={48} color="$primary" />
        </YStack>
        <Text textAlign="center" fontFamily="$heading" fontSize="$h1" lineHeight="$h1" fontWeight="$bold" color="$textPrimary">
          {getMessage("vi", "alreadyPairedTitle")}
        </Text>
        <Text textAlign="center" fontFamily="$body" fontSize="$bodyL" color="$textSecondary">
          {getMessage("vi", "alreadyPairedBody")}
        </Text>
        <AppButton fill onPress={() => router.replace("/(main)")}>
          {getMessage("vi", "openGift")}
        </AppButton>
      </AppScreen>
    );
  }

  if (failure) {
    const copy = failureCopy[failure];
    return (
      <AppScreen>
        <AppHeader title={getMessage("vi", "inviteTitle")} showBack onBack={() => { setFailure(undefined); setMode("join"); }} />
        <AsyncStateView variant={failure === "expired" ? "expired" : "error"} title={copy.title} description={copy.description} actionLabel="tryAnotherCode" onAction={() => { setFailure(undefined); setCode(""); setMode("join"); }} />
        {skipButton}
      </AppScreen>
    );
  }

  if (mode === "choose") {
    return (
      <AppScreen
        scroll={false}
        contentProps={{
          width: "100%",
          maxWidth: featureTokens.maxWidth,
          alignSelf: "center",
          flex: 1,
          gap: 0,
        }}
      >
        <XStack justifyContent="flex-end">
          <AppButton
            variant="secondary"
            loading={busy}
            iconAfter={<ArrowRight size={18} />}
            onPress={() => void skip()}
          >
            {getMessage("vi", "skipInvite")}
          </AppButton>
        </XStack>

        <YStack flex={1} justifyContent="center" paddingTop="$xxl" paddingBottom="$xxl">
          <ContentSurface
            backgroundColor="$white"
            alignItems="center"
            padding="$xl"
            gap="$lg"
          >
            <YStack width="100%" alignItems="center" gap="$xs">
              <YStack
                width="100%"
                maxWidth={288}
                backgroundColor="$supportPeachLight"
                borderWidth={1}
                borderColor="$supportPeach"
                borderRadius="$xl"
                paddingHorizontal="$lg"
                paddingVertical="$md"
              >
                <Text
                  fontFamily="$heading"
                  fontSize="$h5"
                  lineHeight="$h5"
                  fontWeight="$semibold"
                  color="$textPrimary"
                  textAlign="center"
                >
                  {getMessage("vi", "inviteMascotMessage")}
                </Text>
              </YStack>

              <YStack alignItems="center" gap={3}>
                <YStack width={11} height={11} borderRadius={6} backgroundColor="$supportPeach" />
                <YStack width={6} height={6} borderRadius={3} backgroundColor="$supportPeach" />
              </YStack>

              <Image
                accessibilityIgnoresInvertColors
                accessible={false}
                resizeMode="contain"
                source={require("../../../public/mascot-sticker/image(3).png")}
                style={{ width: 104, height: 142 }}
              />
            </YStack>

            <Text
              maxWidth={360}
              fontFamily="$body"
              fontSize="$bodyM"
              lineHeight="$bodyM"
              color="$textSecondary"
              textAlign="center"
            >
              {getMessage("vi", "inviteHeroBody")}
            </Text>

            <YStack width="100%" gap="$md" paddingTop="$sm">
              <AppButton fill loading={busy} icon={<Send size={19} />} onPress={() => void createInvite()}>
                {getMessage("vi", "createInvite")}
              </AppButton>
              <AppButton fill variant="secondary" disabled={busy} icon={<KeyRound size={19} />} onPress={() => setMode("join")}>
                {getMessage("vi", "enterInviteCode")}
              </AppButton>
            </YStack>
          </ContentSurface>
        </YStack>
      </AppScreen>
    );
  }

  if (mode === "create") {
    return (
      <AppScreen
        scroll={false}
        contentProps={{
          width: "100%",
          maxWidth: featureTokens.maxWidth,
          alignSelf: "center",
          flex: 1,
        }}
      >
        <AppHeader title={getMessage("vi", "inviteReadyTitle")} showBack onBack={() => setMode("choose")} />
        {invite ? (
          <InviteCodeCard
            code={invite.code}
            expiresAt={invite.expires_at}
            action={inviteAction}
            onShare={() => void shareInvite()}
            onCopy={() => void copyInvite()}
            onRecreate={() => void createInvite(true)}
            onExpired={() => appToast.warning(getMessage("vi", "inviteExpiredToastTitle"), { description: getMessage("vi", "inviteExpiredToastBody") })}
          />
        ) : null}
      </AppScreen>
    );
  }

  if (mode === "confirm") {
    return (
      <AppScreen>
        <AppHeader title={getMessage("vi", "inviteConfirmTitle")} subtitle={formatMessage("vi", "inviteConfirmBody", { name: confirmedInvite?.inviter.full_name || getMessage("vi", "partnerGenericName") })} showBack onBack={() => setMode("join")} />
        <SectionCard tone="peach">
          <YStack alignItems="center" gap="$md" padding="$lg">
            <YStack width={72} height={72} borderRadius="$xl" backgroundColor="$supportCoral" alignItems="center" justifyContent="center">
              <Text fontFamily="$heading" fontSize="$h2" fontWeight="$bold" color="$white">{(confirmedInvite?.inviter.full_name || "?").slice(0, 1).toUpperCase()}</Text>
            </YStack>
            <Text fontFamily="$heading" fontSize="$h4" fontWeight="$bold">{confirmedInvite?.inviter.full_name || getMessage("vi", "partnerGenericName")}</Text>
          </YStack>
        </SectionCard>
        <AppButton disabled={busy} onPress={() => void accept()}>{formatMessage("vi", "connectNow", { name: confirmedInvite?.inviter.full_name || getMessage("vi", "partnerGenericName") })}</AppButton>
        {skipButton}
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader title={getMessage("vi", "manualInviteTitle")} subtitle={getMessage("vi", "manualInviteBody")} showBack onBack={() => setMode("choose")} />
      <AppField
        label={getMessage("vi", "inviteCodeLabel")}
        placeholder={getMessage("vi", "inviteCodePlaceholder")}
        autoCapitalize="characters"
        maxLength={6}
        value={code}
        onChangeText={(value) => { setCode(value); setFieldError(undefined); }}
        error={fieldError}
      />
      <AppButton disabled={busy} onPress={() => void checkCode()}>{getMessage("vi", "checkInvite")}</AppButton>
      {skipButton}
    </AppScreen>
  );
}
