import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Gift } from "@tamagui/lucide-icons-2/icons/Gift";
import { RefreshCw } from "@tamagui/lucide-icons-2/icons/RefreshCw";
import { Platform } from "react-native";
import { Text, XStack, YStack, type TextProps } from "tamagui";
import { AppButton, AppIconButton, AppProfileAvatar, AppTextButton, SectionCard, resolveSurfaceShadow } from "../../../shared/components";
import { missionTokens as t, missionColorTokens, cardTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import type { ConnectionMember } from "../../invites";
import type { MissionAssignment, MissionPeriod, MissionReward, MissionWallet } from "../missionApi";
import { FlameCouple, MissionIllustration } from "./MissionIllustrations";
import { availableRewardMilestones, MINIMUM_REWARD_POINTS, rewardMilestone } from "../rewardMilestones";
import { RewardArtwork } from "./RewardArtwork";

export const missionCopy = (key: Parameters<typeof getMessage>[1]) => getMessage("vi", key);
export const missionPoints = (value: number) => formatMessage("vi", "missionPointCost", { points: value.toLocaleString("vi-VN") });
export const missionDate = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function MissionBody({ children, muted = false, color }: { children: React.ReactNode; muted?: boolean; color?: TextProps["color"] }) {
  return <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color={color ?? (muted ? "$textSecondary" : "$textPrimary")}>{children}</Text>;
}
export function MissionTitle({ children, color }: { children: React.ReactNode; color?: TextProps["color"] }) {
  return <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color={color ?? "$textPrimary"}>{children}</Text>;
}
function missionGroupColor(row: MissionAssignment) {
  if (row.template_id === "shared-memory") return missionColorTokens.groups.memory;
  if (["individual-water", "individual-rest", "individual-kindness"].includes(row.template_id)) return missionColorTokens.groups.selfCare;
  return row.kind === "shared" || row.template_id === "individual-thanks" ? missionColorTokens.groups.connection : missionColorTokens.groups.selfCare;
}
function MissionState({ done, active = false, children }: { done: boolean; active?: boolean; children: React.ReactNode }) {
  const palette = missionColorTokens.states[done ? "completed" : active ? "active" : "pending"];
  return <XStack alignSelf="flex-start" alignItems="center" gap="$xs" paddingHorizontal="$sm" paddingVertical="$xs" borderRadius="$sm" backgroundColor={palette.surface}>
    {done ? <Check size={14} color={palette.text} aria-hidden /> : null}
    <Text fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" color={palette.text} fontWeight="$semibold">{children}</Text>
  </XStack>;
}
export function MissionReadError({ error, onRetry, busy = false }: { error?: unknown; onRetry: () => void; busy?: boolean }) {
  return <YStack gap="$sm"><Text role="alert" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{missionCopy(error && typeof error === "object" && "code" in error && error.code === "forbidden" ? "missionLiveForbidden" : "missionLiveReadError")}</Text><AppButton variant="ghost" loading={busy} onPress={onRetry}>{missionCopy("retry")}</AppButton></YStack>;
}
export function LiveMissionWallet({ wallet, onHistory }: { wallet: MissionWallet; onHistory: () => void }) {
  return <XStack gap="$md" alignItems="center" padding="$md" backgroundColor={t.peach} borderRadius={t.rowRadius}>
    <MissionIllustration kind="coin" size={t.walletArtworkSize} />
    <YStack flex={1} minWidth={0} gap="$xs"><MissionBody muted>{missionCopy("missionWallet")}</MissionBody><Text fontFamily="$heading" fontSize="$h2" lineHeight="$h2" fontWeight="$bold" color="$accentText">{wallet.balance.toLocaleString("vi-VN")}</Text></YStack>
    <AppIconButton tone="plain" icon={<Gift size={20} color="$accentText" />} accessibilityLabel={missionCopy("missionHistory")} onPress={onHistory} />
  </XStack>;
}
export function missionArtworkKind(row: MissionAssignment): "photo" | "message" | "plan" {
  return row.template_id.includes("memory") ? "photo" : row.template_id.includes("plan") || row.kind === "individual" ? "plan" : "message";
}
export function LiveMissionRow({ row, ownerName, canSwap, busy, onOpen, onSwap }: { row: MissionAssignment; ownerName: string; canSwap: boolean; busy: boolean; onOpen: () => void; onSwap: () => void }) {
  const color = missionGroupColor(row);
  return <XStack alignItems="center" gap="$xs">
    <YStack flex={1} minWidth={0}><SectionCard tone="paper" emphasis="flat" density="compact" showChevron={false} accessibilityLabel={row.title_vi} onPress={onOpen}>
      <XStack gap="$md" alignItems="center">
        <MissionIllustration kind={missionArtworkKind(row)} />
        <YStack flex={1} minWidth={0} gap="$xs">
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color={color}>{row.title_vi}</Text>
          <XStack flexWrap="wrap" alignItems="center" gap="$xs"><MissionBody muted>{ownerName} ·</MissionBody><Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color={color}>{missionPoints(row.points)}</Text></XStack>
          <MissionState done={Boolean(row.awarded_at)} active={row.completed_by.length > 0}>{row.awarded_at ? missionCopy("missionDone") : formatMessage("vi", "missionLiveCompletion", { done: row.completed_by.length, total: row.kind === "shared" ? 2 : 1 })}</MissionState>
        </YStack>
      </XStack>
    </SectionCard></YStack>
    {canSwap ? <AppIconButton tone="plain" disabled={busy} icon={<RefreshCw size={18} color="$textSecondary" />} accessibilityLabel={`${missionCopy("missionSwap")}: ${row.title_vi}`} onPress={onSwap} /> : null}
  </XStack>;
}
export function LiveMissionDetail({ row, participants, accountId, canSwap, busy, onComplete, onSwap }: { row: MissionAssignment; participants: ConnectionMember[]; accountId: string; canSwap: boolean; busy: boolean; onComplete: () => void; onSwap: () => void }) {
  const owners = row.assignee_id ? [row.assignee_id] : [...new Set([accountId, ...participants.map((person) => person.id)])];
  const allowed = !row.assignee_id || row.assignee_id === accountId;
  return <YStack gap="$lg">
    <YStack alignItems="center" paddingVertical="$md"><MissionIllustration kind={missionArtworkKind(row)} size={t.detailArtworkSize} /></YStack>
    <MissionTitle color={missionGroupColor(row)}>{row.title_vi}</MissionTitle>
    <XStack flexWrap="wrap" gap="$sm"><MissionBody muted>{missionCopy(row.kind === "shared" ? "missionShared" : "missionIndividual")}</MissionBody><MissionBody color={missionGroupColor(row)}>{missionPoints(row.points)}</MissionBody></XStack>
    <MissionBody muted>{missionDate(row.local_date)}</MissionBody>
    <MissionBody>{row.description_vi}</MissionBody>
    {owners.map((id) => { const member = participants.find((person) => person.id === id); const done = row.completed_by.includes(id); return <XStack key={id} gap="$md" alignItems="center">
      <AppProfileAvatar uri={member?.avatar_url} fallbackSeed={id} size={t.avatarSize} accessibilityLabel={member?.full_name || missionCopy(id === accountId ? "missionLiveYou" : "missionLivePartner")} />
      <YStack flex={1}><MissionBody>{member?.full_name || missionCopy(id === accountId ? "missionLiveYou" : "missionLivePartner")}</MissionBody></YStack>
      <MissionState done={done}>{missionCopy(done ? "missionDone" : "missionNotDone")}</MissionState>
    </XStack>; })}
    {row.kind === "shared" && participants.length !== 2 ? <MissionBody muted>{missionCopy("missionLiveMemberUnavailable")}</MissionBody> : null}
    <MissionBody muted>{missionCopy(row.kind === "shared" ? "missionSharedHelp" : "missionIndividualHelp")}</MissionBody>
    <AppButton fill loading={busy} disabled={busy || !allowed || row.completed_by.includes(accountId) || Boolean(row.awarded_at)} onPress={onComplete}>{missionCopy(row.completed_by.includes(accountId) ? "missionDone" : "missionComplete")}</AppButton>
    {canSwap ? <AppButton fill variant="secondary" disabled={busy} onPress={onSwap}>{missionCopy("missionSwap")}</AppButton> : null}
    <MissionBody muted>{missionCopy("missionSelfMark")}</MissionBody>
  </YStack>;
}
export function LiveMissionAchievements({ periods }: { periods: MissionPeriod[] }) {
  return <YStack gap="$lg">
    <XStack gap="$md" alignItems="center"><YStack flex={1}><MissionTitle>{missionCopy("missionTogether")}</MissionTitle></YStack><FlameCouple size={t.rewardWalletMascotSize} /></XStack>
    {periods.length === 0 ? <MissionBody muted>{missionCopy("missionLiveNoAchievements")}</MissionBody> : null}
    {periods.map((period) => <SectionCard key={`${period.kind}:${period.start_date}`} tone="white">
      <MissionTitle>{missionCopy(period.kind === "week" ? "missionWeek" : "missionMonth")}</MissionTitle>
      <MissionBody muted>{missionDate(period.start_date)} – {missionDate(new Date(Date.parse(`${period.end_date}T12:00:00Z`) - 86400000).toISOString().slice(0, 10))}</MissionBody>
      <MissionBody>{formatMessage("vi", "missionProgress", { done: period.completed_count, total: period.target })}</MissionBody>
      <YStack height={t.progressHeight} borderRadius="$sm" backgroundColor={t.dotEmpty} overflow="hidden" role="progressbar" aria-valuemin={0} aria-valuemax={period.target} aria-valuenow={period.completed_count}>
        <YStack height="100%" width={`${Math.min(100, period.completed_count / period.target * 100)}%`} backgroundColor="$primary" />
      </YStack>
      <MissionBody color={missionColorTokens.points}>{missionPoints(period.bonus)}</MissionBody>
      <MissionState done={Boolean(period.credited_at)} active={period.completed_count > 0}>{missionCopy(period.credited_at ? "missionClaimed" : "missionLiveMilestonePending")}</MissionState>
    </SectionCard>)}
  </YStack>;
}
export function LiveMissionRewards({ rewards, wallet, busy, onRedeem }: { rewards: MissionReward[]; wallet?: MissionWallet; busy: boolean; onRedeem: (reward: MissionReward) => void }) {
  const milestones = availableRewardMilestones(rewards);
  return <YStack gap="$md"><MissionTitle>{missionCopy("missionChooseGift")}</MissionTitle>
    {milestones.length === 0 ? <MissionBody muted>{missionCopy("missionLiveNoRewards")}</MissionBody> : null}
    <XStack flexWrap="wrap" gap="$md" alignItems="stretch">
      {milestones.map((reward) => { const milestone = wallet ? rewardMilestone(wallet.balance, reward.price_points) : null; return <YStack key={reward.id} flexBasis="46%" flexGrow={1} maxWidth="49%" minWidth={0} borderRadius={t.rewardCardRadius} backgroundColor="$white" {...resolveSurfaceShadow(Platform.OS, cardTokens.nativeShadow)}>
        <YStack padding="$xs" paddingBottom={0}><RewardArtwork id={reward.id} title={reward.title_vi} rounded /></YStack>
        <YStack flex={1} padding="$md" gap="$sm">
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$bold" color="$textPrimary" numberOfLines={2}>{reward.title_vi}</Text>
          <Text fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color={missionColorTokens.points}>{missionPoints(reward.price_points)}</Text>
          {milestone ? <YStack gap="$sm">
            <YStack height={t.rewardProgressHeight} borderRadius="$sm" backgroundColor={t.dotEmpty} overflow="hidden" role="progressbar" aria-valuemin={0} aria-valuemax={reward.price_points} aria-valuenow={Math.min(wallet!.balance, reward.price_points)} aria-label={formatMessage("vi", "missionRewardProgress", { current: wallet!.balance, target: reward.price_points })}>
              <YStack height="100%" width={`${milestone.progress}%`} backgroundColor={milestone.reached ? "$calmText" : "$primary"} borderRadius="$sm" />
            </YStack>
            <Text fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" color={milestone.reached ? "$calmText" : "$textSecondary"}>{milestone.reached ? missionCopy("missionRewardReachedShort") : formatMessage("vi", "missionRewardMissingShort", { points: milestone.missing.toLocaleString("vi-VN") })}</Text>
          </YStack> : null}
          <YStack flex={1} />
          <AppButton fill size="compact" depth="flat" variant={milestone?.reached && reward.stock > 0 ? "primary" : "secondary"} disabled={busy || !wallet || wallet.balance < reward.price_points || reward.stock === 0 || !reward.active} onPress={() => onRedeem(reward)}>{missionCopy(reward.stock === 0 ? "missionLiveOutOfStock" : wallet && wallet.balance < reward.price_points ? "missionNotEnough" : "missionRewards")}</AppButton>
        </YStack>
      </YStack>; })}
    </XStack>
  </YStack>;
}

function RewardProgress({ balance, target }: { balance: number; target: number }) {
  const milestone = rewardMilestone(balance, target);
  return <YStack gap="$xs">
    <XStack alignItems="center" justifyContent="space-between" gap="$sm"><MissionBody muted>{missionPoints(balance)}</MissionBody><MissionBody color={missionColorTokens.points}>{missionPoints(target)}</MissionBody></XStack>
    <YStack height={t.progressHeight} borderRadius="$sm" backgroundColor={t.dotEmpty} overflow="hidden" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(balance, target)} aria-label={formatMessage("vi", "missionRewardProgress", { current: balance, target })}>
      <YStack height="100%" width={`${milestone.progress}%`} borderRadius="$sm" backgroundColor={milestone.reached ? "$calmText" : "$primary"} />
    </YStack>
  </YStack>;
}

export function LiveRewardMilestone({ wallet, rewards, onHistory }: { wallet: MissionWallet; rewards: MissionReward[]; onHistory: () => void }) {
  const milestones = availableRewardMilestones(rewards);
  const next = milestones.find((reward) => reward.price_points > wallet.balance) ?? milestones.at(-1);
  const target = next?.price_points ?? MINIMUM_REWARD_POINTS;
  const milestone = rewardMilestone(wallet.balance, target);
  return <YStack gap="$md" backgroundColor={t.peach} borderRadius={t.rowRadius} padding="$lg">
    <XStack alignItems="center" justifyContent="space-between" gap="$sm">
      <YStack flex={1} minWidth={0}><MissionBody muted>{missionCopy("missionWallet")}</MissionBody></YStack>
      <AppTextButton size="compact" tone="accent" emphasis="strong" icon={<Gift size={16} color="$accentText" />} onPress={onHistory}>{missionCopy("missionRedeemed")}</AppTextButton>
    </XStack>
    <XStack alignItems="center" gap="$md"><MissionIllustration kind="coin" size={t.walletArtworkSize} /><Text flex={1} fontFamily="$heading" fontSize="$h2" lineHeight="$h2" fontWeight="$bold" color="$accentText">{wallet.balance.toLocaleString("vi-VN")}</Text></XStack>
    <RewardProgress balance={wallet.balance} target={target} />
    <MissionBody>{next ? next.title_vi : formatMessage("vi", "missionRewardMinimum", { points: MINIMUM_REWARD_POINTS })}</MissionBody>
    <MissionBody muted>{milestone.reached ? missionCopy("missionRewardReached") : formatMessage("vi", "missionRewardMissing", { points: milestone.missing.toLocaleString("vi-VN") })}</MissionBody>
  </YStack>;
}
