import { Linking } from "react-native";
import { Text, YStack } from "tamagui";
import { AppButton, AppDialog, AppSheet, AppSkeleton, SectionCard, appToast } from "../../../shared/components";
import type { MissionAssignment, MissionLedgerEntry, MissionRedemption, MissionReward, MissionWallet } from "../missionApi";
import { missionCopy as copy, MissionBody, MissionReadError, missionPoints } from "./ServerMissionViews";
import { missionScopeCurrent } from "../missionService";
import type { MissionScope } from "../missionServiceCore";
import { RewardArtwork } from "./RewardArtwork";
import { missionTokens } from "../../../shared/constants/tokens";

export type ServerMissionOverlay = { kind: "swap"; row: MissionAssignment } | { kind: "redeem"; reward: MissionReward } | { kind: "code"; order: MissionRedemption; justRedeemed?: boolean } | { kind: "rules" | "ledger" | "orders" };
export function ServerMissionOverlays({ overlay, scope, wallet, busy, close, swap, redeem, ledger, orders, loading, error, retry, more, hasMore, onOrder }: {
  overlay: ServerMissionOverlay | null; scope: MissionScope; wallet?: MissionWallet; busy: boolean; close: () => void;
  swap: (row: MissionAssignment) => void; redeem: (reward: MissionReward) => void;
  ledger: MissionLedgerEntry[]; orders: MissionRedemption[]; loading: boolean; error: unknown; retry: () => void; more: () => void; hasMore: boolean; onOrder: (order: MissionRedemption) => void;
}) {
  if (!overlay) return null;
  const onOpenChange = (open: boolean) => { if (!open && !busy) close(); };
  if (overlay.kind === "swap") return <AppSheet open fitContent title={copy("missionSwapTitle")} onOpenChange={onOpenChange} dismissible={!busy}>
    <MissionBody>{overlay.row.title_vi}</MissionBody><MissionBody muted>{copy("missionSwapBody")}</MissionBody>
    <MissionBody muted>{copy("missionLiveSwapRules")}</MissionBody>
    <AppButton fill loading={busy} disabled={busy} onPress={() => swap(overlay.row)}>{copy("missionSwap")}</AppButton>
    <AppButton fill variant="secondary" disabled={busy} onPress={close}>{copy("missionKeep")}</AppButton>
  </AppSheet>;
  if (overlay.kind === "redeem") return <AppDialog open title={copy("missionLiveConfirmReward")} description={overlay.reward.title_vi} dismissible={!busy} onOpenChange={onOpenChange}>
    <MissionBody>{copy("missionCost")}: {missionPoints(overlay.reward.price_points)}</MissionBody>
    <MissionBody muted>{copy("missionCurrentPoints")}: {wallet ? missionPoints(wallet.balance) : copy("missionLiveReadError")}</MissionBody>
    <MissionBody muted>{copy("missionDeductNotice")}</MissionBody>
    <AppButton fill loading={busy} disabled={busy || !wallet || wallet.balance < overlay.reward.price_points} onPress={() => redeem(overlay.reward)}>{copy("missionLiveRedeem")}</AppButton>
    <AppButton fill variant="secondary" disabled={busy} onPress={close}>{copy("missionLater")}</AppButton>
  </AppDialog>;
  if (overlay.kind === "code") {
    const order = overlay.order;
    const fanpage = order.reward_snapshot.fanpage_url;
    const valid = !["cancelled", "expired"].includes(order.status);
    const copyValue = async (value: string) => {
      if (!missionScopeCurrent(scope)) return;
      const feedback = appToast.operation();
      try { const clipboard = await import("expo-clipboard"); if (!missionScopeCurrent(scope)) return; await clipboard.setStringAsync(value); if (missionScopeCurrent(scope)) feedback.success(copy("missionLiveCopied")); }
      catch { if (missionScopeCurrent(scope)) feedback.error(copy("missionCopyFailed")); }
    };
    const openFanpage = async () => {
      if (!missionScopeCurrent(scope) || !fanpage) return;
      try { await Linking.openURL(fanpage); }
      catch { if (missionScopeCurrent(scope)) appToast.error(copy("missionLiveLinkError")); }
    };
    return <AppDialog open title={copy(overlay.justRedeemed ? "missionRewardSuccess" : "missionCodeLabel")} description={order.reward_snapshot.title_vi} onOpenChange={onOpenChange}>
      <YStack alignItems="center"><RewardArtwork id={order.reward_id} title={order.reward_snapshot.title_vi} size={missionTokens.detailArtworkSize} /></YStack>
      {order.reward_snapshot.description_vi ? <MissionBody>{order.reward_snapshot.description_vi}</MissionBody> : null}
      <MissionBody>{copy("missionCost")}: {missionPoints(order.price_points)}</MissionBody>
      {overlay.justRedeemed ? <MissionBody muted>{copy("missionRewardDeducted")}</MissionBody> : null}
      <MissionBody muted>{copy(`missionLiveOrder_${order.status}`)}</MissionBody>
      <Text selectable fontFamily="$heading" fontSize="$h5" lineHeight="$h5" color="$textPrimary">{order.code}</Text>
      <MissionBody muted>{copy("missionLiveExpires")}: {new Date(order.expires_at).toLocaleDateString("vi-VN")}</MissionBody>
      <AppButton fill disabled={!valid} onPress={() => { void copyValue(order.code); }}>{copy("missionCopyCode")}</AppButton>
      {fanpage ? <><AppButton fill variant="secondary" disabled={!valid} onPress={() => { void openFanpage(); }}>{copy("missionOpenFanpage")}</AppButton>
        <AppButton fill variant="ghost" onPress={() => { void copyValue(fanpage); }}>{copy("missionCopyLink")}</AppButton></> : <MissionBody muted>{copy("missionFanpageMissing")}</MissionBody>}
      <AppButton fill variant="ghost" onPress={close}>{copy("close")}</AppButton>
    </AppDialog>;
  }
  return <AppSheet open title={copy(overlay.kind === "rules" ? "missionRules" : overlay.kind === "ledger" ? "missionHistory" : "missionRedeemed")} onOpenChange={onOpenChange}>
    <YStack gap="$md">
      {overlay.kind === "rules" ? <MissionBody>{copy("missionLiveRules")}</MissionBody> : <>
        {loading ? <AppSkeleton height={56} /> : null}
        {error ? <MissionReadError error={error} onRetry={retry} busy={loading} /> : null}
        {!loading && !error && (overlay.kind === "ledger" ? ledger.length === 0 : orders.length === 0) ? <MissionBody muted>{copy("missionLiveEmptyHistory")}</MissionBody> : null}
        {overlay.kind === "ledger" ? ledger.map((entry) => <SectionCard key={entry.id} tone="white">
          <MissionBody>{copy(entry.source_kind === "assignment" ? "missionLiveLedgerMission" : entry.source_kind === "bonus" ? "missionLiveLedgerBonus" : entry.source_kind === "redemption" ? "missionLiveLedgerReward" : entry.source_kind === "refund" ? "missionLiveLedgerRefund" : "missionLiveLedgerOther")}</MissionBody>
          <MissionBody>{entry.delta > 0 ? "+" : ""}{missionPoints(entry.delta)}</MissionBody><MissionBody muted>{new Date(entry.created_at).toLocaleString("vi-VN")}</MissionBody>
        </SectionCard>) : orders.map((order) => <SectionCard key={order.id} tone="white" onPress={() => onOrder(order)} accessibilityLabel={order.reward_snapshot.title_vi}>
          <MissionBody>{order.reward_snapshot.title_vi}</MissionBody><MissionBody muted>{copy(`missionLiveOrder_${order.status}`)} · {missionPoints(order.price_points)}</MissionBody>
        </SectionCard>)}
        {hasMore ? <AppButton fill variant="secondary" loading={loading} onPress={more}>{copy("missionLiveMore")}</AppButton> : null}
      </>}
      <AppButton fill variant="ghost" onPress={close}>{copy("close")}</AppButton>
    </YStack>
  </AppSheet>;
}
