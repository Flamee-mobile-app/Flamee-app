import { useQuery } from "@tanstack/react-query";
import { useIsFocused, useRouter } from "expo-router";
import { Text, YStack } from "tamagui";
import { AppButton, AppSkeleton, appToast } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { ConnectedUsers, InviteApiError, connectionOptions, inviteService, orderConnectedMembers } from "../../invites";

export function AccountConnectionDetails() {
  const router = useRouter();
  const focused = useIsFocused();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const membershipRevision = useSessionStore((state) => state.membershipRevision);
  const bootstrapped = useSessionStore((state) => state.isBootstrapped);
  const current = () => {
    const state = useSessionStore.getState();
    return state.activeAccountId === accountId && state.activeCoupleId === coupleId
      && state.sessionId === sessionId && state.membershipRevision === membershipRevision;
  };
  const query = useQuery({
    ...connectionOptions({ accountId, coupleId, sessionId }, async () => {
      const result = await inviteService.connection();
      if (!current() || !accountId || result.id !== coupleId || !orderConnectedMembers(result, accountId)) throw new InviteApiError("response");
      return result;
    }),
    enabled: focused && bootstrapped && Boolean(accountId && coupleId),
    refetchOnMount: "always", refetchOnReconnect: false,
  });
  const denied = query.error instanceof InviteApiError && !["network", "timeout", "server", "response"].includes(query.error.code);
  const couple = !denied && accountId && query.data?.id === coupleId && orderConnectedMembers(query.data, accountId) ? query.data : null;
  const refresh = async () => {
    if (query.isFetching) return;
    const feedback = appToast.operation();
    feedback.loading(getMessage("vi", "accountConnectionLoading"));
    try {
      const result = await query.refetch();
      if (!current()) return;
      if (result.isError) feedback.error(getMessage("vi", "accountConnectionError"));
      else feedback.success(getMessage("vi", "accountConnectionUpdated"));
    } catch { if (current()) feedback.error(getMessage("vi", "accountConnectionError")); }
    finally { feedback.dismiss(); }
  };
  if (!bootstrapped || !accountId) return <AppSkeleton height={160} />;
  if (!coupleId) return <YStack gap="$md">
    <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "connectionEmptyTitle")}</Text>
    <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage("vi", "connectionEmptyBody")}</Text>
    <AppButton fill onPress={() => router.push("/connection")}>{getMessage("vi", "connectionManage")}</AppButton>
  </YStack>;
  return <YStack alignItems="center" gap="$lg" paddingVertical="$md">
    {couple ? <ConnectedUsers couple={couple} accountId={accountId} /> : query.isPending ? <AppSkeleton height={160} />
      : <Text role="alert" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="center">{getMessage("vi", "accountConnectionError")}</Text>}
    <AppButton fill variant="secondary" loading={query.isFetching} disabled={query.isFetching} onPress={() => { void refresh(); }}>{getMessage("vi", "inviteCheckConnection")}</AppButton>
  </YStack>;
}
