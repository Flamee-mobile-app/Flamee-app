import { Linking } from "react-native";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Copy } from "@tamagui/lucide-icons-2/icons/Copy";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppDialog, AppIconButton, AppSheet, AppSkeleton, SectionCard, appToast } from "../../../shared/components";
import type { MissionAssignment, MissionLedgerEntry, MissionRedemption, MissionReward, MissionWallet } from "../missionApi";
import { missionCopy as copy, MissionBody, MissionReadError, missionPoints } from "./ServerMissionViews";
import { missionScopeCurrent } from "../missionService";
import type { MissionScope } from "../missionServiceCore";
import { RewardArtwork } from "./RewardArtwork";
import { missionTokens } from "../../../shared/constants/tokens";
import { formatMessage } from "../../../shared/localization/messages";
import { rewardContactUrl } from "../rewardContact";
import { TikTokContactIcon } from "./TikTokContactIcon";

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
  if (overlay.kind === "redeem") return <AppDialog open title={copy("missionLiveConfirmReward")} description={overlay.reward.title_vi} hideDescription dismissible={!busy} onOpenChange={onOpenChange}>
    <XStack alignItems="center" gap="$md">
      <RewardArtwork id={overlay.reward.id} title={overlay.reward.title_vi} size={missionTokens.confirmArtworkSize} rounded />
      <YStack flex={1} minWidth={0} gap="$xs">
        <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{overlay.reward.title_vi}</Text>
        {overlay.reward.description_vi ? <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" numberOfLines={2}>{overlay.reward.description_vi}</Text> : null}
      </YStack>
    </XStack>
    <SectionCard tone="peach" emphasis="flat">
      <XStack flexWrap="wrap" gap="$lg" alignItems="flex-end">
        <YStack flex={1} minWidth={missionTokens.confirmPointsMinWidth} gap="$xs">
          <MissionBody muted>{copy("missionCost")}</MissionBody>
          <Text fontFamily="$heading" fontSize="$h2" lineHeight="$h2" fontWeight="$bold" color="$accentText">{overlay.reward.price_points.toLocaleString("vi-VN")}</Text>
          <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$accentText">{copy("missionPointUnit")}</Text>
        </YStack>
        <YStack flex={1} minWidth={missionTokens.confirmPointsMinWidth} gap="$xs">
          <MissionBody muted>{copy("missionCurrentPoints")}</MissionBody>
          <Text fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary">{wallet ? wallet.balance.toLocaleString("vi-VN") : "—"}</Text>
          <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{copy("missionPointUnit")}</Text>
        </YStack>
      </XStack>
      {wallet && wallet.balance >= overlay.reward.price_points ? <XStack flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="$sm">
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{copy("missionBalanceAfterPreview")}</Text>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$accentText">{missionPoints(wallet.balance - overlay.reward.price_points)}</Text>
      </XStack> : null}
    </SectionCard>
    <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{copy(wallet ? "missionDeductNotice" : "missionLiveReadError")}</Text>
    <AppButton fill loading={busy} disabled={busy || !wallet || wallet.balance < overlay.reward.price_points} onPress={() => redeem(overlay.reward)}>{formatMessage("vi", "missionConfirm", { points: overlay.reward.price_points.toLocaleString("vi-VN") })}</AppButton>
    <AppButton fill variant="ghost" disabled={busy} onPress={close}>{copy("missionLater")}</AppButton>
  </AppDialog>;
  if (overlay.kind === "code") {
    const order = overlay.order;
    const valid = !["cancelled", "expired"].includes(order.status);
    const copyValue = async (value: string) => {
      if (!missionScopeCurrent(scope)) return;
      const feedback = appToast.operation();
      try { const clipboard = await import("expo-clipboard"); if (!missionScopeCurrent(scope)) return; await clipboard.setStringAsync(value); if (missionScopeCurrent(scope)) feedback.success(copy("missionLiveCopied")); }
      catch { if (missionScopeCurrent(scope)) feedback.error(copy("missionCopyFailed")); }
    };
    const openContact = async () => {
      if (!missionScopeCurrent(scope) || !valid) return;
      try { await Linking.openURL(rewardContactUrl); }
      catch { if (missionScopeCurrent(scope)) appToast.error(copy("missionTikTokLinkError")); }
    };
    return <AppDialog open title={copy(overlay.justRedeemed ? "missionRewardSuccess" : "missionCodeLabel")} description={order.reward_snapshot.title_vi} hideDescription onOpenChange={onOpenChange}>
      <XStack alignItems="center" gap="$md">
        <RewardArtwork id={order.reward_id} title={order.reward_snapshot.title_vi} size={missionTokens.confirmArtworkSize} rounded />
        <YStack flex={1} minWidth={0} gap="$sm">
          <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{order.reward_snapshot.title_vi}</Text>
          <XStack alignItems="center" gap="$xs">
            {overlay.justRedeemed ? <Check size={16} color="$accentText" aria-hidden /> : null}
            <Text flexShrink={1} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" fontWeight="$semibold" color={valid ? "$accentText" : "$textSecondary"}>{copy(`missionLiveOrder_${order.status}`)}</Text>
          </XStack>
        </YStack>
      </XStack>
      <XStack flexWrap="wrap" gap="$lg">
        <YStack flex={1} minWidth={missionTokens.confirmPointsMinWidth} gap="$xs">
          <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{copy("missionCost")}</Text>
          <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$accentText">{missionPoints(order.price_points)}</Text>
        </YStack>
        <YStack flex={1} minWidth={missionTokens.confirmPointsMinWidth} gap="$xs">
          <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{copy("missionLiveExpires")}</Text>
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{new Date(order.expires_at).toLocaleDateString("vi-VN")}</Text>
        </YStack>
      </XStack>
      <SectionCard tone="peach" emphasis="flat">
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" fontWeight="$semibold" color="$accentText">{copy("missionCodeLabel")}</Text>
        <Text selectable fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyL" fontWeight="$semibold" color="$textPrimary">{order.code}</Text>
        <AppButton fill depth="flat" disabled={!valid} icon={<Copy size={18} color="$white" aria-hidden />} onPress={() => { void copyValue(order.code); }}>{copy("missionCopyCode")}</AppButton>
      </SectionCard>
      <XStack alignItems="center" gap="$md">
        <Text flex={1} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{copy("missionCodeHelp")}</Text>
        <AppIconButton tone="plain" disabled={!valid} icon={<TikTokContactIcon />} accessibilityLabel={copy("missionOpenTikTok")} onPress={() => { void openContact(); }} />
      </XStack>
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
