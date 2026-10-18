import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { KeyRound } from "@tamagui/lucide-icons-2/icons/KeyRound";
import { Send } from "@tamagui/lucide-icons-2/icons/Send";
import * as Clipboard from "expo-clipboard";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AppState, Keyboard, Share } from "react-native";
import { Text, YStack } from "tamagui";
import { AppButton, AppField, AppTextButton, appToast } from "../../../shared/components";
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

type Props = { initialMode?: "choose" | InviteFlow; initialWaiting?: boolean; showBack?: boolean };
type Action = "create" | "share" | "copy" | "recreate" | "accept" | "check";
const errorCopy: Record<string, MessageKey> = {
  invite_not_found: "inviteNotFoundBody", invite_expired: "inviteExpiredBody", invite_cancelled: "inviteRevokedBody",
  invite_used: "inviteUsedBody", already_paired: "alreadyPairedBody", inviter_already_paired: "alreadyPairedBody", self_invite: "inviteSelfBody",
};

export function InviteFlowScreen({ initialMode = "choose", initialWaiting = false, showBack = false }: Props) {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
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
  const current = () => mounted.current && useSessionStore.getState().activeAccountId === accountId;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; };
  }, []));

  const reportError = (error: unknown) => {
    if (!current() || error instanceof AuthError && ["credentials", "cancelled"].includes(error.code)) return;
    const message = error instanceof InviteApiError ? errorCopy[error.code] : undefined;
    appToast.error(getMessage("vi", "inviteActionErrorTitle"), { description: getMessage("vi", message ?? "localInviteUnavailableBody") });
  };
  const connected = (couple: AcceptedCouple, announce = true) => {
    if (!current()) return;
    if (!accountId || !orderConnectedMembers(couple, accountId)) throw new InviteApiError("response");
    setConnection(couple);
    useSessionStore.getState().setActiveCouple(couple.id);
    dispatch({ type: "connected", coupleId: couple.id });
    inviteIntent.clear();
    if (announce && !completed.current) appToast.success(getMessage("vi", "inviteConnectedToast"));
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
        const session = authService.getSessionSnapshot() ?? await authService.getCurrentSession();
        if (!active || !current()) return;
        if (!session) {
          useSessionStore.getState().reset();
          appToast.warning(getMessage("vi", "sessionExpiredTitle"));
          router.replace("/(auth)");
          return;
        }
        useSessionStore.getState().setActiveCouple(session.user.couple_id ?? null);
        if (session.user.couple_id) {
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
  }, [accountId, attempt, initialWaiting, initialMode]);

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
  }, [accountId, flow.flow, flow.step, invite?.status]));

  const run = async (kind: Action, operation: () => Promise<void>) => {
    if (pending.current || loading || !current()) return;
    pending.current = true; setAction(kind);
    try { await operation(); } catch (error) { reportError(error); }
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
    void run("accept", async () => {
      if (!accountId) return;
      const toastId = appToast.loading(getMessage("vi", "inviteProcessingTitle"));
      try {
        const result = await joinInviteByCode(parsed.data.code, accountId, () => current() && focused.current, inviteService);
        if (result.kind === "connected") connected(result.couple);
      } finally { appToast.dismiss(toastId); }
    });
  };
  const share = () => void run("share", async () => {
    if (!invite) return;
    const result = await Share.share({ message: `${getMessage("vi", "inviteShareMessage")} ${invite.code}\n${invitationURL(invite.code)}` });
    appToast.info(getMessage("vi", result.action === Share.dismissedAction ? "inviteShareDismissedTitle" : "inviteShareSuccessTitle"));
  });
  const copy = () => void run("copy", async () => {
    if (!invite) return;
    await Clipboard.setStringAsync(invite.code);
    appToast.success(getMessage("vi", "inviteCopiedTitle"));
  });
  const back = () => {
    if (pending.current) return;
    Keyboard.dismiss();
    if (flow.step === "choose" || flow.step === "complete") {
      if (showBack && router.canGoBack()) router.back(); else router.replace("/(main)");
    } else dispatch({ type: "back" });
  };
  const skip = () => {
    if (pending.current) return;
    Keyboard.dismiss();
    router.replace("/(main)");
  };
  if (!accountId) return <Redirect href="/(auth)" />;
  const done = flow.step === "complete" || Boolean(coupleId);
  const busy = action !== null;
  const disabled = loading || busy || readFailed;
  const cardAction = action === "share" || action === "copy" || action === "recreate" ? action : null;

  return <InviteSceneLayout busy={busy} onBack={back} onSkip={skip} centered={!done && flow.step === "choose"} hero={done ? <ConnectedUsers couple={connection?.id === coupleId ? connection : null} accountId={accountId} /> : flow.step === "choose" ? <InviteWelcome /> : undefined}>
    {readFailed ? <AppButton variant="secondary" onPress={() => setAttempt((value) => value + 1)}>{getMessage("vi", "retry")}</AppButton> : null}
    {done ? <YStack gap="$lg">
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="center">{getMessage("vi", "inviteConnectedBody")}</Text>
      <AppButton fill icon={<Check size={18} aria-hidden={true} />} onPress={() => router.replace("/(main)")}>{getMessage("vi", "continueHome")}</AppButton>
      <AppTextButton onPress={() => router.push({ pathname: "/settings", params: { section: "account" } })}>{getMessage("vi", "connectionManage")}</AppTextButton>
    </YStack> : flow.step === "choose" ? <YStack gap="$lg">
      <AppButton fill size="large" disabled={disabled} icon={<Send size={20} aria-hidden={true} />} onPress={chooseCreate}>{getMessage("vi", "inviteCreateFlow")}</AppButton>
      <AppButton fill size="large" variant="secondary" disabled={disabled} icon={<KeyRound size={20} aria-hidden={true} />} onPress={chooseJoin}>{getMessage("vi", "inviteJoinFlow")}</AppButton>
    </YStack> : flow.step === "code" ? <YStack gap="$lg">
      {invite ? <InviteCodeCard code={invite.code} expiresAt={invite.expires_at} action={cardAction} onShare={share} onCopy={copy} onRecreate={() => void run("recreate", create)} onExpired={() => appToast.warning(getMessage("vi", "inviteExpiredToastTitle"))} />
        : <AppButton fill loading={action === "create"} disabled={disabled} onPress={chooseCreate}>{getMessage("vi", "inviteCreateFlow")}</AppButton>}
      {invite?.status === "pending" ? <AppButton fill variant="ghost" disabled={disabled || Date.parse(invite.expires_at) <= Date.now()} onPress={() => dispatch({ type: "wait" })}>{getMessage("vi", "inviteWaitAction")}</AppButton> : null}
    </YStack> : flow.step === "waiting" ? <YStack gap="$lg">
      <Text fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "inviteWaitingHeading")}</Text>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage("vi", "inviteWaitingBody")}</Text>
      <AppButton loading={action === "check"} disabled={disabled} onPress={() => void run("check", checkConnection)}>{getMessage("vi", "inviteCheckConnection")}</AppButton>
      <AppTextButton disabled={busy} onPress={() => dispatch({ type: "back" })}>{getMessage("vi", "inviteReviewCode")}</AppTextButton>
    </YStack> : flow.step === "enter" ? <YStack gap="$lg">
      <Text fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary" textAlign="center">{getMessage("vi", action === "accept" ? "inviteProcessingTitle" : "inviteJoinFlow")}</Text>
      <AppField showLabel={false} label={getMessage("vi", "inviteCodeLabel")} placeholder={getMessage("vi", "inviteCodePlaceholder")} autoCapitalize="characters" autoCorrect={false} maxLength={6} value={code} editable={!disabled} error={fieldError} onChangeText={(value) => { setCode(value); setFieldError(undefined); }} returnKeyType="done" onSubmitEditing={connect} />
      <AppButton fill loading={action === "accept"} disabled={disabled || code.trim().length !== 6} onPress={connect}>{getMessage("vi", "inviteConnectAction")}</AppButton>
    </YStack> : null}
  </InviteSceneLayout>;
}
