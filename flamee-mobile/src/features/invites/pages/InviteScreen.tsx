import { HeartHandshake, KeyRound, Send } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Share } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppField, AppHeader, AppScreen, AsyncStateView, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage, type MessageKey } from "../../../shared/localization/messages";
import { localCoupleService, type CoupleMembership, type LocalPartnerSummary } from "../../couple";
import { localOnboardingService } from "../../onboarding";
import { localMomentService } from "../../moments";
import { localMediaAdapter } from "../../media";
import { InviteCodeCard } from "../components/InviteCodeCard";
import { InviteGiftComposer } from "../components/InviteGiftComposer";
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
    try {
      const [account, currentMembership, openInvite] = await Promise.all([
        localOnboardingService.getAccountSnapshot(accountId),
        localCoupleService.getMembership(accountId),
        localInviteService.getOpenInvite(accountId),
      ]);
      if (account.onboardingStep !== "complete") {
        router.replace("/(onboarding)");
        return;
      }
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
      if (openInvite) setMode("create");
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
      await Share.share({ message: `${getMessage("vi", "inviteShareMessage")} ${invite.code}` });
      setShareFailed(false);
    } catch {
      setShareFailed(true);
    }
  };

  const createInvite = async () => {
    if (!accountId || !profile || busy) return;
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
      setBusy(false);
    }
  };

  const checkCode = async () => {
    if (!accountId) return;
    const parsed = inviteCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    try {
      const result = await localInviteService.validateInvite(accountId, parsed.data.code);
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
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!accountId || !profile || busy) return;
    setBusy(true);
    try {
      const result = await localInviteService.acceptInvite(accountId, code, profile);
      if (result.kind !== "accepted") {
        setFailure(result.kind);
        return;
      }
      await localMomentService.deliverAcceptedInviteGift(result);
      const nextMembership = await localCoupleService.getMembership(accountId);
      setMembership(nextMembership);
      setActiveCouple(result.coupleId);
      setInvite(result.invite);
    } catch {
      setLoadFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (!accountId) {
    return <AppScreen><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => router.replace("/(auth)")} /></AppScreen>;
  }

  if (loading) return <AppScreen><AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /></AppScreen>;
  if (loadFailed && !profile) {
    return <AppScreen><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => void load()} /></AppScreen>;
  }

  if (membership?.status === "paired") {
    return (
      <AppScreen scroll={false} contentProps={{ justifyContent: "center", alignItems: "center" }}>
        <YStack width={96} height={96} borderRadius="$xl" backgroundColor="$supportPeachLight" alignItems="center" justifyContent="center">
          <HeartHandshake size={48} color="$primary" />
        </YStack>
        <Text textAlign="center" fontFamily="$heading" fontSize="$h1" lineHeight="$h1" fontWeight="$bold" color="$textPrimary">
          {getMessage("vi", "connectedTitle")}
        </Text>
        <Text textAlign="center" fontFamily="$body" fontSize="$bodyL" color="$textSecondary">
          {getMessage("vi", "connectedBody")}
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
      </AppScreen>
    );
  }

  if (loadFailed) {
    return <AppScreen><AppHeader title={getMessage("vi", "inviteTitle")} /><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => void load()} /></AppScreen>;
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
        <AppButton variant="ghost" icon={<KeyRound size={19} />} onPress={() => setMode("join")}>
          {getMessage("vi", "enterInviteCode")}
        </AppButton>
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
        {invite ? <InviteGiftComposer onSave={async (gift) => {
          const previous = invite.gift;
          const updated = await localInviteService.attachGift(invite.id, gift);
          setInvite(updated);
          const previousUri = previous && "uri" in previous ? previous.uri : null;
          const nextUri = "uri" in gift ? gift.uri : null;
          if (previousUri && previousUri !== nextUri) await localMediaAdapter.cleanup(previousUri);
        }} /> : null}
        <StatusBanner tone="info" title={getMessage("vi", "inviteLocalOnlyTitle")} description={getMessage("vi", "inviteLocalOnlyBody")} />
        <AppButton onPress={() => router.replace("/(waiting)")}>
          {getMessage("vi", "continueFirstCheckIn")}
        </AppButton>
      </AppScreen>
    );
  }

  if (mode === "confirm") {
    return (
      <AppScreen>
        <AppHeader title={getMessage("vi", "inviteConfirmTitle")} subtitle={formatMessage("vi", "inviteConfirmBody", { name: confirmedInvite?.inviter.displayName ?? "" })} showBack onBack={() => setMode("join")} />
        <SectionCard tone="peach">
          <YStack alignItems="center" gap="$md" padding="$lg">
            <YStack width={72} height={72} borderRadius="$xl" backgroundColor="$supportCoral" alignItems="center" justifyContent="center">
              <Text fontFamily="$heading" fontSize="$h2" fontWeight="$bold" color="$white">{(confirmedInvite?.inviter.displayName || "?").slice(0, 1).toUpperCase()}</Text>
            </YStack>
            <Text fontFamily="$heading" fontSize="$h4" fontWeight="$bold">{confirmedInvite?.inviter.displayName ?? ""}</Text>
            {confirmedInvite?.gift ? <Text color="$textSecondary">{getMessage("vi", "giftSaved")}</Text> : null}
          </YStack>
        </SectionCard>
        <AppButton disabled={busy} onPress={() => void accept()}>{formatMessage("vi", "connectNow", { name: confirmedInvite?.inviter.displayName ?? "" })}</AppButton>
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
      <XStack justifyContent="center"><Text color="$textSecondary">{getMessage("vi", "inviteLocalOnlyBody")}</Text></XStack>
    </AppScreen>
  );
}
