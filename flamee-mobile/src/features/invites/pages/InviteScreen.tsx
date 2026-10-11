import { HeartHandshake } from "@tamagui/lucide-icons-2/icons/HeartHandshake";
import { KeyRound } from "@tamagui/lucide-icons-2/icons/KeyRound";
import { Send } from "@tamagui/lucide-icons-2/icons/Send";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Share } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AppButton, AppField, AppHeader, AppScreen, AsyncStateView, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage, type MessageKey } from "../../../shared/localization/messages";
import { localCoupleService, type CoupleMembership, type LocalPartnerSummary } from "../../couple";
import { localOnboardingService } from "../../onboarding";
import { localMomentService } from "../../moments";
import { localMediaAdapter } from "../../media";
import { InviteCodeCard } from "../components/InviteCodeCard";
import { InviteGiftComposer } from "../components/InviteGiftComposer";
import { InviteGiftPreview } from "../components/InviteGiftPreview";
import { inviteIntent, invitationURL } from "../inviteIntent";
import { localInviteService } from "../localInviteService";
import { inviteCodeSchema } from "../schemas";
import type { LocalInvite } from "../types";

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

export function InviteScreen() {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const setActiveCouple = useSessionStore((state) => state.setActiveCouple);
  const [mode, setMode] = useState<InviteMode>("choose");
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [failure, setFailure] = useState<InviteFailure>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [replyGreeting, setReplyGreeting] = useState("");
  const [shareFailed, setShareFailed] = useState(false);
  const [profile, setProfile] = useState<LocalPartnerSummary | null>(null);
  const [invite, setInvite] = useState<LocalInvite | null>(null);
  const [confirmedInvite, setConfirmedInvite] = useState<LocalInvite | null>(null);
  const [membership, setMembership] = useState<CoupleMembership | null>(null);
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
    setFailure(undefined); setConfirmedInvite(null); setReplyGreeting("");
    setMode("choose"); setCode("");
    try {
      const [account, currentMembership, openInvite] = await Promise.all([
        localOnboardingService.getAccountSnapshot(accountId),
        localCoupleService.getMembership(accountId),
        localInviteService.getOpenInvite(accountId),
      ]);
      if (useSessionStore.getState().activeAccountId !== accountId) return;
      setProfile({
        id: accountId,
        displayName: account.profile.displayName,
        nickname: account.profile.partnerNickname,
        avatarUri: account.profile.avatarUri,
        timezone: account.profile.timezone,
      });
      setMembership(currentMembership);
      setInvite(openInvite);
      if (currentMembership.status === "paired") setActiveCouple(currentMembership.coupleId);
      const pendingCode = inviteIntent.getCode();
      if (pendingCode) {
        const validation = await localInviteService.validateInvite(accountId, pendingCode);
        if (useSessionStore.getState().activeAccountId !== accountId) return;
        setCode(pendingCode);
        if (validation.kind === "valid") { setConfirmedInvite(validation.invite); setMode("confirm"); }
        else setFailure(validation.kind);
      } else if (currentMembership.status === "paired") setFailure("already_paired");
      else if (openInvite) setMode("create");
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [accountId]);

  const shareInvite = async () => {
    try {
      if (!invite) return;
      await Share.share({ message: `${getMessage("vi", "inviteShareMessage")} ${invite.code}\n${invitationURL(invite.code)}` });
      setShareFailed(false);
    } catch {
      setShareFailed(true);
    }
  };

  const createInvite = async () => {
    if (!accountId || !profile || pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailure(undefined);
    try {
      const created = await localInviteService.createInvite(accountId, profile);
      setInvite(created);
      setMembership(await localCoupleService.getMembership(accountId));
      setMode("create");
    } catch {
      setLoadFailed(true);
    } finally {
      pending.current = false;
      setBusy(false);
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
      const result = await localInviteService.validateInvite(accountId, parsed.data.code);
      if (useSessionStore.getState().activeAccountId !== accountId) return;
      if (result.kind !== "valid") {
        setFailure(result.kind);
        return;
      }
      setCode(parsed.data.code);
      setConfirmedInvite(result.invite);
      setMode("confirm");
    } catch {
      setLoadFailed(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!accountId || !profile || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const result = await localInviteService.acceptInvite(accountId, code, profile, replyGreeting);
      if (useSessionStore.getState().activeAccountId !== accountId) return;
      if (result.kind !== "accepted") {
        setFailure(result.kind);
        return;
      }
      await localMomentService.deliverAcceptedInviteGift(result).catch(() => null);
      setActiveCouple(result.coupleId);
      await localOnboardingService.finishSetup(accountId);
      inviteIntent.clear();
      router.replace("/(main)");
    } catch {
      setLoadFailed(true);
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

  if (loading || (!loadFailed && profile?.id !== accountId)) return <AppScreen><AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /></AppScreen>;
  if (loadFailed && !profile) {
    return <AppScreen><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => void load()} />{skipButton}</AppScreen>;
  }

  if (membership?.status === "paired" && !failure) {
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
        <StatusBanner tone="info" title={getMessage("vi", "inviteLocalOnlyTitle")} description={getMessage("vi", "inviteLocalOnlyBody")} />
        <AppButton alignSelf="stretch" onPress={() => router.replace("/(main)")}>
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

  if (loadFailed) {
    return <AppScreen><AppHeader title={getMessage("vi", "inviteTitle")} /><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => void load()} />{skipButton}</AppScreen>;
  }

  if (mode === "choose") {
    return (
      <AppScreen>
        <AppHeader eyebrow={getMessage("vi", "onboardingEyebrow")} title={getMessage("vi", "inviteHeroTitle")} subtitle={getMessage("vi", "inviteHeroBody")} />
        <YStack height={180} borderRadius="$xl" backgroundColor="$supportPeachLight" alignItems="center" justifyContent="center">
          <HeartHandshake size={72} color="$primary" />
        </YStack>
        <AppButton icon={<Send size={19} />} disabled={busy} onPress={() => void createInvite()}>
          {getMessage("vi", "createInvite")}
        </AppButton>
        <AppButton variant="ghost" disabled={busy} icon={<KeyRound size={19} />} onPress={() => setMode("join")}>
          {getMessage("vi", "enterInviteCode")}
        </AppButton>
        {skipButton}
      </AppScreen>
    );
  }

  if (mode === "create") {
    return (
      <AppScreen>
        <AppHeader title={getMessage("vi", "inviteHeroTitle")} subtitle={getMessage("vi", "inviteHeroBody")} showBack onBack={() => setMode("choose")} />
        <InviteCodeCard
          code={invite?.code ?? ""}
          expiresLabel={getMessage("vi", "inviteExpires")}
          onShare={() => void shareInvite()}
          onRecreate={() => void createInvite()}
        />
        {shareFailed ? <StatusBanner tone="warning" title={getMessage("vi", "shareInviteError")} /> : null}
        {invite ? <InviteGiftComposer key={invite.id} initialGift={invite.gift} initialMessage={invite.message} onSave={async (gift, message) => {
          const previous = invite.gift;
          const updated = await localInviteService.attachGift(invite.id, gift, message);
          setInvite(updated);
          const previousUri = previous && "uri" in previous ? previous.uri : null;
          const nextUri = gift && "uri" in gift ? gift.uri : null;
          if (previousUri && previousUri !== nextUri) await localMediaAdapter.cleanup(previousUri);
        }} /> : null}
        <StatusBanner tone="info" title={getMessage("vi", "inviteLocalOnlyTitle")} description={getMessage("vi", "inviteLocalOnlyBody")} />
        <AppButton onPress={() => router.replace("/(waiting)")}>
          {getMessage("vi", "viewWaitingInvite")}
        </AppButton>
        {skipButton}
      </AppScreen>
    );
  }

  if (mode === "confirm") {
    return (
      <AppScreen>
        <AppHeader title={getMessage("vi", "inviteConfirmTitle")} subtitle={formatMessage("vi", "inviteConfirmBody", { name: confirmedInvite?.inviter.displayName || getMessage("vi", "partnerGenericName") })} showBack onBack={() => setMode("join")} />
        <SectionCard tone="peach">
          <YStack alignItems="center" gap="$md" padding="$lg">
            <YStack width={72} height={72} borderRadius="$xl" backgroundColor="$supportCoral" alignItems="center" justifyContent="center">
              <Text fontFamily="$heading" fontSize="$h2" fontWeight="$bold" color="$white">{(confirmedInvite?.inviter.displayName || "?").slice(0, 1).toUpperCase()}</Text>
            </YStack>
            <Text fontFamily="$heading" fontSize="$h4" fontWeight="$bold">{confirmedInvite?.inviter.displayName || getMessage("vi", "partnerGenericName")}</Text>
            {confirmedInvite?.message ? <Text fontFamily="$body" fontSize="$bodyL">{confirmedInvite.message}</Text> : null}
            <InviteGiftPreview gift={confirmedInvite?.gift ?? null} />
          </YStack>
        </SectionCard>
        <AppField multiline label={getMessage("vi", "replyGreetingLabel")} placeholder={getMessage("vi", "replyGreetingPlaceholder")} value={replyGreeting} maxLength={200} onChangeText={setReplyGreeting} editable={!busy} characterCount={`${replyGreeting.length}/200`} />
        <AppButton disabled={busy} onPress={() => void accept()}>{formatMessage("vi", "connectNow", { name: confirmedInvite?.inviter.displayName || getMessage("vi", "partnerGenericName") })}</AppButton>
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
      <XStack justifyContent="center"><Text color="$textSecondary">{getMessage("vi", "inviteLocalOnlyBody")}</Text></XStack>
    </AppScreen>
  );
}
