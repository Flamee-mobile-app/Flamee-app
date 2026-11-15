import { AppGradientText } from "../../../shared/components";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { KeyRound } from "@tamagui/lucide-icons-2/icons/KeyRound";
import { Send } from "@tamagui/lucide-icons-2/icons/Send";
import * as Clipboard from "expo-clipboard";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AppState, Keyboard, Share } from "react-native";
import { Text, YStack } from "tamagui";
import { AppButton, AppField, AppMenuRow, AppTextButton, SectionCard, appToast } from "../../../shared/components";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AuthError, authService } from "../../auth";
import { InviteCodeCard } from "../components/InviteCodeCard";
import { InviteSceneLayout } from "../components/InviteSceneLayout";
import { InviteWelcome } from "../components/InviteWelcome";
import { ConnectedUsers } from "../components/ConnectedUsers";
import { InviteApiError, type AcceptedCouple, type ServerInvite } from "../inviteApi";
import { inviteIntent, invitationURL } from "../inviteIntent";
import { initialInviteFlow, inviteFlowReducer, type InviteFlow, type InviteFlowState } from "../inviteFlowState";
import { inviteService } from "../inviteService";
import { inviteCodeSchema } from "../schemas";
import { joinInviteByCode, orderConnectedMembers } from "../joinInviteFlow";
import { openInviteCreation } from "../openInviteCreation";
import { readInviteEntrySession } from "../inviteEntrySession";
import { isInviteScopeCurrent } from "../inviteScope";
import { onboardingService } from "../../onboarding/services";

type Props = { initialMode?: "choose" | InviteFlow; initialWaiting?: boolean; showBack?: boolean };
type Action = "create" | "share" | "copy" | "recreate" | "accept" | "check" | "skip";
const errorCopy: Record<string, MessageKey> = {
  invite_not_found: "inviteNotFoundBody", invite_expired: "inviteExpiredBody", invite_cancelled: "inviteRevokedBody",
  invite_used: "inviteUsedBody", already_paired: "alreadyPairedBody", inviter_already_paired: "alreadyPairedBody", self_invite: "inviteSelfBody",
};

export function InviteFlowScreen(props: Props) {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const sessionId = useSessionStore((state) => state.sessionId);
  return <InviteFlow key={`${sessionId}:${accountId}`} {...props} />;
}

function InviteFlow({ initialMode = "choose", initialWaiting = false, showBack = false }: Props) {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const initial: InviteFlowState = initialWaiting ? { flow: "create", step: "waiting" } : initialInviteFlow(initialMode);
  const [flow, dispatch] = useReducer(inviteFlowReducer, initial);
  const [invite, setInvite] = useState<ServerInvite | null>(null);
  const [connection, setConnection] = useState<AcceptedCouple | null>(null);
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [readFailed, setReadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [action, setAction] = useState<Action | null>(null);
  const pending = useRef(false);
  const polling = useRef(false);
  const mounted = useRef(true);
  const focused = useRef(true);
  const completed = useRef(false);
  const current = () => mounted.current && isInviteScopeCurrent({ accountId, sessionId }, useSessionStore.getState());
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; };
  }, []));

  const reportError = (error: unknown, feedback: Pick<typeof appToast, "error"> = appToast) => {
    if (!current() || error instanceof AuthError && ["credentials", "cancelled"].includes(error.code)) return;
    const message = error instanceof InviteApiError ? errorCopy[error.code] : undefined;
    feedback.error(getMessage("vi", "inviteActionErrorTitle"), { description: getMessage("vi", message ?? "localInviteUnavailableBody") });
  };
  const connected = (couple: AcceptedCouple, announce = true, feedback: Pick<typeof appToast, "success"> = appToast) => {
    if (!current()) return;
    if (!accountId || !orderConnectedMembers(couple, accountId)) throw new InviteApiError("response");
    setConnection(couple);
    useSessionStore.getState().setActiveCouple(couple.id);
    dispatch({ type: "connected", coupleId: couple.id });
    inviteIntent.clear();
    if (announce && !completed.current) feedback.success(getMessage("vi", "inviteConnectedToast"));
    completed.current = true;
    if (announce) void authService.refreshCurrentSession().catch(() => undefined);
  };

  useEffect(() => {
    let active = true;
    setLoading(true); setReadFailed(false); setInvite(null); setConnection(null); completed.current = false;
    void (async () => {
      try {
        if (!accountId) return;
        // Login/bootstrap already verified this session with the backend. Do not
        // block the chooser on a second /auth/me request and an unused code read.
        const session = await readInviteEntrySession(accountId, authService, useSessionStore.getState);
        if (!active || !current()) return;
        if (!session) {
          useSessionStore.getState().reset();
          appToast.warning(getMessage("vi", "sessionExpiredTitle"));
          router.replace("/(auth)");
          return;
        }
        if (session.coupleId) {
          const couple = await inviteService.connection();
          if (active && current()) connected(couple, false);
          return;
        }
        const pendingCode = inviteIntent.getCode();
        if (pendingCode) {
          setCode(pendingCode);
          dispatch({ type: "join" });
        } else if (initialWaiting || initialMode === "create") {
          const latest = await inviteService.current();
          if (!active || !current()) return;
          setInvite(latest);
          if (initialWaiting && !latest) dispatch({ type: "back" });
        }
      } catch (error) {
        if (active && current()) { setReadFailed(true); reportError(error); }
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [accountId, sessionId, attempt, initialWaiting, initialMode]);

  const checkConnection = async () => {
    const latest = await inviteService.current();
    if (!current()) return;
    setInvite(latest?.status === "cancelled" ? null : latest);
    if (!latest || ["expired", "cancelled"].includes(latest.status)) dispatch({ type: "create" });
    if (latest?.status === "accepted") {
      const couple = await inviteService.connection();
      if (current()) connected(couple);
    }
  };
  useFocusEffect(useCallback(() => {
    if (!accountId || flow.flow !== "create" || flow.step === "complete" || !invite || !["pending", "accepted"].includes(invite.status)) return;
    let active = true;
    const poll = async () => {
      if (!active || polling.current || pending.current || AppState.currentState !== "active") return;
      polling.current = true;
      try {
        const latest = await inviteService.current();
        if (!active || !current()) return;
        setInvite(latest?.status === "cancelled" ? null : latest);
        if (!latest || ["expired", "cancelled"].includes(latest.status)) dispatch({ type: "create" });
        if (latest?.status === "accepted") {
          const couple = await inviteService.connection();
          if (active && current()) connected(couple);
        }
      } catch { /* Transient reads keep the confirmed code; unauthorized sessions are handled by auth. */ }
      finally { polling.current = false; }
    };
    const timer = setInterval(() => void poll(), 5_000);
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void poll(); });
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [accountId, sessionId, flow.flow, flow.step, invite?.status]));

  const run = async (kind: Action, operation: (feedback: ReturnType<typeof appToast.operation>) => Promise<void>) => {
    if (pending.current || loading || !current()) return;
    pending.current = true; setAction(kind);
    const feedback = appToast.operation();
    try { await operation(feedback); } catch (error) { reportError(error, feedback); }
    finally { pending.current = false; if (current()) setAction(null); }
  };
  const create = async () => {
    const result = await inviteService.create();
    if (current()) { setInvite(result); dispatch({ type: "create" }); }
  };
  const chooseCreate = () => {
    dispatch({ type: "create" }); setFieldError(undefined);
    if (!invite || invite.status !== "pending" || Date.parse(invite.expires_at) <= Date.now()) {
      setInvite(null);
      void run("create", async () => {
        const result = await openInviteCreation(inviteService, () => current() && focused.current);
        if (result.kind === "invite") setInvite(result.invite);
        else if (result.kind === "connected") connected(result.couple);
      });
    }
  };
  const chooseJoin = () => { setFieldError(undefined); dispatch({ type: "join" }); };
  const connect = () => {
    const parsed = inviteCodeSchema.safeParse({ code });
    if (!parsed.success) { setFieldError(parsed.error.issues[0]?.message); return; }
    Keyboard.dismiss();
    void run("accept", async (feedback) => {
      if (!accountId) return;
      feedback.loading(getMessage("vi", "inviteProcessingTitle"));
      try {
        const result = await joinInviteByCode(parsed.data.code, accountId, () => current() && focused.current, inviteService);
        if (result.kind === "connected") connected(result.couple, true, feedback);
      } finally { feedback.dismiss(); }
    });
  };
  const share = () => void run("share", async (feedback) => {
    if (!invite) return;
    const result = await Share.share({ message: `${getMessage("vi", "inviteShareMessage")} ${invite.code}\n${invitationURL(invite.code)}` });
    feedback.info(getMessage("vi", result.action === Share.dismissedAction ? "inviteShareDismissedTitle" : "inviteShareSuccessTitle"));
  });
  const copy = () => void run("copy", async (feedback) => {
    if (!invite) return;
    await Clipboard.setStringAsync(invite.code);
    feedback.success(getMessage("vi", "inviteCopiedTitle"));
  });
  const back = () => {
    if (pending.current) return;
    Keyboard.dismiss();
    if (flow.step === "choose" || flow.step === "complete") {
      if (showBack && router.canGoBack()) router.back();
      else if (coupleId) router.replace("/(main)");
      else skip();
    } else dispatch({ type: "back" });
  };
  const skip = () => {
    if (pending.current || loading || !current()) return;
    Keyboard.dismiss();
    pending.current = true; setAction("skip");
    const feedback = appToast.operation();
    void onboardingService.skip().then(() => {
      if (current() && focused.current) router.replace("/(main)");
    }, () => {
      if (current() && focused.current) feedback.error(getMessage("vi", "inviteActionErrorTitle"), { description: getMessage("vi", "onboardingSkipError") });
    }).finally(() => { pending.current = false; if (current()) setAction(null); });
  };
  if (!accountId) return <Redirect href="/(auth)" />;
  const done = flow.step === "complete" || Boolean(coupleId);
  const busy = action !== null;
  const disabled = loading || busy || readFailed;
  const cardAction = action === "share" || action === "copy" || action === "recreate" ? action : null;

  return <InviteSceneLayout busy={busy || loading} onBack={back} onSkip={skip} centered={!done && flow.step === "choose"} hero={done ? <ConnectedUsers couple={connection?.id === coupleId ? connection : null} accountId={accountId} /> : flow.step === "choose" ? <InviteWelcome /> : undefined}>
    {readFailed ? <AppButton variant="secondary" onPress={() => setAttempt((value) => value + 1)}>{getMessage("vi", "retry")}</AppButton> : null}
    {done ? <YStack gap="$lg">
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="center">{getMessage("vi", "inviteConnectedBody")}</Text>
      <AppButton fill icon={<Check size={18} aria-hidden={true} />} onPress={() => router.replace("/(main)")}>{getMessage("vi", "continueHome")}</AppButton>
      <AppTextButton onPress={() => router.push({ pathname: "/settings", params: { section: "account" } })}>{getMessage("vi", "connectionManage")}</AppTextButton>
    </YStack> : flow.step === "choose" ? <YStack gap="$lg">
      <SectionCard tone="white"><AppMenuRow label={getMessage("vi", "onboardingCreateTitle")} description={getMessage("vi", "onboardingCreateDescription")} icon={<YStack padding="$md" borderRadius="$md" backgroundColor="$supportPeachLight"><Send size={24} color="$accentText" aria-hidden={true} /></YStack>} disabled={disabled} onPress={chooseCreate} /></SectionCard>
      <SectionCard tone="white"><AppMenuRow label={getMessage("vi", "onboardingJoinTitle")} description={getMessage("vi", "onboardingJoinDescription")} icon={<YStack padding="$md" borderRadius="$md" backgroundColor="$supportPeachLight"><KeyRound size={24} color="$accentText" aria-hidden={true} /></YStack>} disabled={disabled} onPress={chooseJoin} /></SectionCard>
    </YStack> : flow.step === "code" ? <YStack gap="$lg">
      {invite ? <InviteCodeCard code={invite.code} expiresAt={invite.expires_at} action={cardAction} onShare={share} onCopy={copy} onRecreate={() => void run("recreate", create)} onExpired={() => appToast.warning(getMessage("vi", "inviteExpiredToastTitle"))} />
        : <AppButton fill loading={action === "create"} disabled={disabled} onPress={chooseCreate}>{getMessage("vi", "inviteCreateFlow")}</AppButton>}
      {invite?.status === "pending" ? <AppButton fill variant="ghost" disabled={disabled || Date.parse(invite.expires_at) <= Date.now()} onPress={() => dispatch({ type: "wait" })}>{getMessage("vi", "inviteWaitAction")}</AppButton> : null}
    </YStack> : flow.step === "waiting" ? <YStack gap="$lg">
      <AppGradientText fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "inviteWaitingHeading")}</AppGradientText>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage("vi", "inviteWaitingBody")}</Text>
      <AppButton loading={action === "check"} disabled={disabled} onPress={() => void run("check", checkConnection)}>{getMessage("vi", "inviteCheckConnection")}</AppButton>
      <AppTextButton disabled={busy} onPress={() => dispatch({ type: "back" })}>{getMessage("vi", "inviteReviewCode")}</AppTextButton>
    </YStack> : flow.step === "enter" ? <YStack gap="$lg">
      <AppGradientText fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary" textAlign="center">{getMessage("vi", action === "accept" ? "inviteProcessingTitle" : "inviteJoinFlow")}</AppGradientText>
      <AppField showLabel={false} label={getMessage("vi", "inviteCodeLabel")} placeholder={getMessage("vi", "inviteCodePlaceholder")} autoCapitalize="characters" autoCorrect={false} maxLength={6} value={code} editable={!disabled} error={fieldError} onChangeText={(value) => { setCode(value); setFieldError(undefined); }} returnKeyType="done" onSubmitEditing={connect} />
      <AppButton fill loading={action === "accept"} disabled={disabled || code.trim().length !== 6} onPress={connect}>{getMessage("vi", "inviteConnectAction")}</AppButton>
    </YStack> : null}
  </InviteSceneLayout>;
}
