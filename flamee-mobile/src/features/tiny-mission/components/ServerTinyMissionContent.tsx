import { CalendarDays } from "@tamagui/lucide-icons-2/icons/CalendarDays";
import { Gift } from "@tamagui/lucide-icons-2/icons/Gift";
import { Trophy } from "@tamagui/lucide-icons-2/icons/Trophy";
import { useRef, useState, useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { XStack, YStack } from "tamagui";
import { AppButton, AppFilterChip, AppSkeleton, AppTextButton, appToast } from "../../../shared/components";
import { connectionOptions, inviteService } from "../../invites";
import { formatMessage } from "../../../shared/localization/messages";
import { MissionApiError, type MissionAssignment, type MissionReward, type MissionRedemption } from "../missionApi";
import { missionKey, type MissionScope } from "../missionServiceCore";
import { missionScopeCurrent, missionService } from "../missionService";
import { LiveMissionAchievements, LiveMissionDetail, LiveMissionRewards, LiveMissionRow, LiveMissionWallet, LiveRewardMilestone, MissionBody, MissionReadError, MissionTitle, missionCopy as copy, missionDate } from "./ServerMissionViews";
import { ServerMissionOverlays, type ServerMissionOverlay } from "./ServerMissionOverlays";

const tabs = ["missionToday", "missionAchievements", "missionRewards"] as const;
const icons = [CalendarDays, Trophy, Gift];
export function ServerTinyMissionContent({ scope, missionId, active, onDetails }: { scope: MissionScope; missionId?: string; active: boolean; onDetails: (id: string) => void }) {
  const client = useQueryClient();
  const [tab, setTab] = useState<typeof tabs[number]>("missionToday");
  const [overlay, setOverlay] = useState<ServerMissionOverlay | null>(null);
  const [busy, setBusy] = useState(false);
  const [walletNeedsRefresh, setWalletNeedsRefresh] = useState(false);
  const pending = useRef(false);
  const requestKeys = useRef(new Map<string, string>());
  const visible = useRef(active);
  visible.current = active;
  const base = missionKey(scope);
  const enabled = active && Boolean(scope.accountId && scope.coupleId);
  const defaults = { retry: false, staleTime: 30_000, refetchInterval: false as const, refetchOnReconnect: false };
  const today = useQuery({ ...defaults, queryKey: [...base, "today"], queryFn: ({ signal }) => missionService.today(scope, signal), enabled });
  const wallet = useQuery({ ...defaults, queryKey: [...base, "wallet"], queryFn: ({ signal }) => missionService.wallet(scope, signal), enabled });
  const connection = useQuery({ ...connectionOptions(scope, inviteService.connection), enabled });
  const achievements = useQuery({ ...defaults, queryKey: [...base, "achievements"], queryFn: ({ signal }) => missionService.achievements(scope, signal), enabled: enabled && !missionId && tab === "missionAchievements" });
  const rewards = useInfiniteQuery({ ...defaults, queryKey: [...base, "rewards"], initialPageParam: 0,
    queryFn: ({ signal, pageParam }) => missionService.rewards(scope, pageParam, signal),
    getNextPageParam: (last, _pages, offset) => last.length === 20 ? offset + 20 : undefined, enabled: enabled && !missionId && tab === "missionRewards" });
  const ledger = useInfiniteQuery({ ...defaults, queryKey: [...base, "ledger"], initialPageParam: 0,
    queryFn: ({ signal, pageParam }) => missionService.ledger(scope, pageParam, signal),
    getNextPageParam: (last, _pages, offset) => last.length === 20 ? offset + 20 : undefined, enabled: enabled && overlay?.kind === "ledger" });
  const orders = useInfiniteQuery({ ...defaults, queryKey: [...base, "orders"], initialPageParam: 0,
    queryFn: ({ signal, pageParam }) => missionService.redemptions(scope, pageParam, signal),
    getNextPageParam: (last, _pages, offset) => last.length === 20 ? offset + 20 : undefined, enabled: enabled && overlay?.kind === "orders" });
  useEffect(() => { if (!active) setOverlay(null); }, [active]);
  async function refresh(read: () => Promise<{ isError: boolean }>) {
    const feedback = appToast.operation();
    try { const result = await read(); if (!missionScopeCurrent(scope)) return; if (result.isError) feedback.error(copy("missionLiveReadError")); else feedback.success(copy("missionLiveRefreshed")); }
    catch { if (missionScopeCurrent(scope)) feedback.error(copy("missionLiveReadError")); }
  }
  async function mutate<T>(signature: string, success: Parameters<typeof copy>[0], operation: (key: string) => Promise<T>, confirmed: (result: T) => void) {
    if (pending.current || !missionScopeCurrent(scope)) return;
    pending.current = true; setBusy(true);
    if (!requestKeys.current.has(signature)) requestKeys.current.set(signature, randomUUID());
    const feedback = appToast.operation(); feedback.loading(copy("missionLiveSaving"));
    try {
      const result = await operation(requestKeys.current.get(signature)!);
      if (!missionScopeCurrent(scope)) return;
      requestKeys.current.delete(signature);
      confirmed(result);
      await client.invalidateQueries({ queryKey: base });
      if (!missionScopeCurrent(scope)) return;
      if (signature.startsWith("redeem:")) setWalletNeedsRefresh(client.getQueryState([...base, "wallet"])?.status !== "success");
      feedback.success(copy(success));
    } catch (error) {
      if (!missionScopeCurrent(scope)) return;
      feedback.error(copy(error instanceof MissionApiError && error.code === "conflict" ? "missionLiveConflict" : error instanceof MissionApiError && error.code === "forbidden" ? "missionLiveForbidden" : "missionLiveWriteError"));
      // Keep the key after an uncertain response: repeating the same action cannot double credit/debit.
      void client.invalidateQueries({ queryKey: base });
    } finally { feedback.dismiss(); pending.current = false; if (missionScopeCurrent(scope)) setBusy(false); }
  }
  const change = (row: MissionAssignment, action: "complete" | "swap") => { void mutate(`${action}:${row.id}:${row.version}`, action === "complete" ? "missionLiveCompleted" : "missionLiveSwapped",
    (key) => missionService.change(scope, row, action, key), (result) => {
      client.setQueryData([...base, "today"], today.data ? { ...today.data, assignments: today.data.assignments.map((item) => item.id === result.id ? result : item) } : undefined);
      if (visible.current) setOverlay(null);
    }); };
  const redeem = (reward: MissionReward) => { void mutate(`redeem:${reward.id}:${reward.price_points}`, "missionLiveRedeemed", (key) => missionService.redeem(scope, reward, key), (order) => { setWalletNeedsRefresh(true); if (visible.current) setOverlay({ kind: "code", order, justRedeemed: true }); }); };
  const openOrder = async (row: MissionRedemption) => {
    if (pending.current) return;
    pending.current = true; setBusy(true);
    try { const order = await missionService.redemption(scope, row.id); if (missionScopeCurrent(scope) && visible.current) setOverlay({ kind: "code", order }); }
    catch { if (missionScopeCurrent(scope)) appToast.error(copy("missionLiveReadError")); }
    finally { pending.current = false; if (missionScopeCurrent(scope)) setBusy(false); }
  };
  const members = connection.data?.id === scope.coupleId ? [connection.data.partner1, connection.data.partner2] : [];
  const ownerName = (row: MissionAssignment) => row.kind === "shared" ? copy("missionBoth") : members.find((member) => member.id === row.assignee_id)?.full_name || copy(row.assignee_id === scope.accountId ? "missionLiveYou" : "missionLivePartner");
  const canSwap = (row: MissionAssignment) => (!row.assignee_id || row.assignee_id === scope.accountId) && row.version === 0 && row.completed_by.length === 0 && !row.awarded_at && (today.data?.assignments.reduce((sum, item) => sum + item.version, 0) ?? 2) < 2;
  const selected = today.data?.assignments.find((row) => row.id === missionId);
  const history = overlay?.kind === "ledger" ? ledger : orders;
  if (!scope.accountId || !scope.coupleId) return <MissionBody muted>{copy("missionLivePairRequired")}</MissionBody>;
  return <>
    {missionId ? <>
      {today.isError ? <MissionReadError error={today.error} onRetry={() => { void refresh(() => today.refetch()); }} busy={today.isFetching} />
        : !today.data ? <AppSkeleton height={160} />
        : selected ? <LiveMissionDetail row={selected} participants={members} accountId={scope.accountId} canSwap={canSwap(selected)} busy={busy}
          onComplete={() => change(selected, "complete")} onSwap={() => setOverlay({ kind: "swap", row: selected })} />
        : <MissionBody muted>{copy("missionLiveNotFound")}</MissionBody>}
    </> : <YStack gap="$lg">
      <XStack gap="$xs">{tabs.map((key, index) => { const Icon = icons[index]; return <YStack key={key} flex={1} minWidth={0}><AppFilterChip fill presentation="tab" selectionMode="single" showCheck={false} selected={tab === key} label={copy(key)} icon={<Icon size={16} color={tab === key ? "$primary" : "$textSecondary"} />} onPress={() => setTab(key)} /></YStack>; })}</XStack>
      {wallet.data && !walletNeedsRefresh ? tab === "missionRewards" ? <LiveRewardMilestone wallet={wallet.data} rewards={rewards.data?.pages.flat() ?? []} onHistory={() => setOverlay({ kind: "orders" })} /> : <LiveMissionWallet wallet={wallet.data} onHistory={() => setOverlay({ kind: "ledger" })} /> : wallet.isFetching ? <AppSkeleton height={80} /> : wallet.isError || walletNeedsRefresh ? <MissionReadError error={wallet.error} busy={wallet.isFetching} onRetry={() => { void refresh(async () => { const result = await wallet.refetch(); if (missionScopeCurrent(scope) && !result.isError) setWalletNeedsRefresh(false); return result; }); }} /> : <AppSkeleton height={80} />}
      {tab === "missionToday" ? <>
        <MissionTitle>{copy("missionDaily")}</MissionTitle>
        {today.isError ? <MissionReadError error={today.error} busy={today.isFetching} onRetry={() => { void refresh(() => today.refetch()); }} /> : today.data ? <>
          <MissionBody muted>{missionDate(today.data.local_date)} · {formatMessage("vi", "missionProgress", { done: today.data.assignments.filter((row) => row.awarded_at).length, total: today.data.assignments.length })}</MissionBody>
          {today.data.assignments.map((row) => <LiveMissionRow key={row.id} row={row} ownerName={ownerName(row)} canSwap={canSwap(row)} busy={busy} onOpen={() => onDetails(row.id)} onSwap={() => setOverlay({ kind: "swap", row })} />)}
          <AppTextButton onPress={() => setOverlay({ kind: "rules" })}>{copy("missionRules")}</AppTextButton>
        </> : <AppSkeleton height={160} />}
      </> : tab === "missionAchievements" ? achievements.isError ? <MissionReadError error={achievements.error} onRetry={() => { void refresh(() => achievements.refetch()); }} /> : achievements.data ? <>
        <LiveMissionAchievements periods={achievements.data} /><AppTextButton onPress={() => setOverlay({ kind: "ledger" })}>{copy("missionHistory")}</AppTextButton>
      </> : <AppSkeleton height={160} /> : <>
        {rewards.isError ? <MissionReadError error={rewards.error} onRetry={() => { void refresh(() => rewards.refetch()); }} /> : rewards.data ? <LiveMissionRewards rewards={rewards.data.pages.flat()} wallet={walletNeedsRefresh ? undefined : wallet.data} busy={busy} onRedeem={(reward) => setOverlay({ kind: "redeem", reward })} /> : <AppSkeleton height={160} />}
        {rewards.hasNextPage ? <AppButton fill variant="secondary" loading={rewards.isFetching} onPress={() => { void refresh(() => rewards.fetchNextPage()); }}>{copy("missionLiveMore")}</AppButton> : null}
      </>}
    </YStack>}
    <ServerMissionOverlays overlay={overlay} scope={scope} wallet={walletNeedsRefresh ? undefined : wallet.data} busy={busy} close={() => { if (!pending.current) setOverlay(null); }} swap={(row) => change(row, "swap")} redeem={redeem}
      ledger={ledger.data?.pages.flat() ?? []} orders={orders.data?.pages.flat() ?? []} loading={history.isFetching || busy} error={history.error} retry={() => { void refresh(() => history.refetch()); }} more={() => { void refresh(() => history.fetchNextPage()); }} hasMore={Boolean(history.hasNextPage)} onOrder={(order) => { void openOrder(order); }} />
  </>;
}
