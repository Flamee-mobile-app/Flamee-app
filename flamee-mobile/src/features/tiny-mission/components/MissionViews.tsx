import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { ChevronLeft } from "@tamagui/lucide-icons-2/icons/ChevronLeft";
import { Gift } from "@tamagui/lucide-icons-2/icons/Gift";
import { Info } from "@tamagui/lucide-icons-2/icons/Info";
import { RefreshCw } from "@tamagui/lucide-icons-2/icons/RefreshCw";
import { Users } from "@tamagui/lucide-icons-2/icons/Users";
import { useState, type PropsWithChildren } from "react";
import { Image, StyleSheet, useWindowDimensions } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppCalendarDay, AppCalendarGrid, AppFilterChip, AppIconButton, AppProfileAvatar, AppTextButton, SectionCard } from "../../../shared/components";
import { memoryCalendarTokens, missionTokens as t } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { missionPreviews, previewBalance, rewardPreviews, type MissionPreview, type RewardPreview } from "../previewContent";
import { FlameCouple, MissionIllustration, VideoCallArtwork } from "./MissionIllustrations";

export const copy = (key: Parameters<typeof getMessage>[1]) => getMessage("vi", key);
export const points = (value: number) => formatMessage("vi", "missionPointCost", { points: value.toLocaleString("vi-VN") });

export function MissionText({ children, secondary = false, small = false, center = false }: PropsWithChildren<{ secondary?: boolean; small?: boolean; center?: boolean }>) {
  return <Text fontFamily="$body" fontSize={small ? "$bodyS" : "$bodyM"} lineHeight={small ? "$bodyS" : "$bodyM"} color={secondary ? t.muted : t.ink} textAlign={center ? "center" : "left"}>{children}</Text>;
}

export function MissionHeading({ children, large = false, center = false }: PropsWithChildren<{ large?: boolean; center?: boolean }>) {
  return <Text fontFamily="$heading" fontSize={large ? "$h3" : "$h4"} lineHeight={large ? "$h3" : "$h4"} fontWeight="$bold" color={t.ink} textAlign={center ? "center" : "left"}>{children}</Text>;
}

export function MissionDivider() { return <YStack height={1} backgroundColor={t.line} />; }

export function MissionPreviewNotice() {
  return <Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" color={t.muted} textAlign="center">{copy("missionPreview")}</Text>;
}

export function MissionArtwork({ kind, large = false }: { kind: MissionPreview["id"]; large?: boolean }) {
  return <YStack width={large ? t.detailArtworkSize : t.artworkSize} height={large ? t.detailArtworkSize : t.artworkSize} borderRadius="$md" backgroundColor={t.peach} alignItems="center" justifyContent="center">
    <MissionIllustration kind={kind} size={large ? t.detailArtworkSize : t.artworkSize} />
  </YStack>;
}

export function MissionProgress({ value, total }: { value: number; total: number }) {
  return <YStack height={t.progressHeight} borderRadius="$sm" backgroundColor={t.dotEmpty} overflow="hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}
    aria-label={formatMessage("vi", "missionProgress", { done: value, total })}>
    <YStack height="100%" width={`${Math.min(100, value / total * 100)}%`} backgroundColor={t.coral} borderRadius="$sm" />
  </YStack>;
}

export function CompletionMark({ done, small = false }: { done: boolean; small?: boolean }) {
  return <YStack width={small ? 16 : 24} height={small ? 16 : 24} borderRadius="$xl" backgroundColor={done ? t.sage : "transparent"} borderWidth={done ? 0 : 1} borderColor={t.muted} alignItems="center" justifyContent="center">
    {done ? <Check size={small ? 12 : 18} color="$white" strokeWidth={2.5} aria-hidden /> : null}
  </YStack>;
}

export function MissionParticipants({ mission }: { mission: MissionPreview }) {
  return <YStack>{(mission.owner ? [mission.owner] : ["Linh", "Nam"]).map((name) => {
    const done = mission.completedBy.includes(name);
    return <YStack key={name}><MissionDivider /><XStack alignItems="center" gap="$md" paddingVertical="$md">
      <AppProfileAvatar fallbackSeed={name === "Linh" ? "b" : "a"} size={t.avatarSize} accessibilityLabel={name} />
      <Text flex={1} fontFamily="$body" fontSize="$bodyL" fontWeight="$semibold" color={t.ink}>{name}</Text>
      <CompletionMark done={done} />
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color={done ? t.completed : t.muted}>{copy(done ? "missionDone" : "missionNotDone")}</Text>
    </XStack></YStack>;
  })}<MissionDivider /></YStack>;
}

export function MissionWallet({ rewards = false, onRewards, onHistory }: { rewards?: boolean; onRewards?: () => void; onHistory?: () => void }) {
  const compact = useWindowDimensions().width < t.compactWidth;
  return <YStack borderWidth={rewards ? 0 : 1} borderColor={t.line} borderRadius={t.rowRadius} padding={rewards ? "$sm" : "$md"}>
    <XStack alignItems="center" gap="$md">
      {rewards ? <FlameCouple size={t.rewardWalletMascotSize} /> : <MissionIllustration kind="coin" size={t.walletArtworkSize} />}
      <YStack flex={1} minWidth={0} gap="$xs"><MissionText secondary small>{copy("missionWallet")}</MissionText><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} fontFamily="$heading" fontSize={rewards ? "$h1" : "$h2"} lineHeight={rewards ? "$h1" : "$h2"} fontWeight="$bold" color={rewards ? t.coral : t.ink}>{previewBalance.toLocaleString("vi-VN")}</Text></YStack>
      {onRewards ? compact ? <AppIconButton tone="plain" accessibilityLabel={copy("missionRewards")} icon={<MissionIllustration kind="gift" size={26} />} onPress={onRewards} /> : <AppTextButton size="compact" icon={<MissionIllustration kind="gift" size={26} />} iconAfter={<ChevronRight size={16} color={t.ink} />} onPress={onRewards}>{copy("missionRewards")}</AppTextButton> : null}
      {onHistory ? compact ? <AppIconButton tone="plain" accessibilityLabel={copy("missionRedeemed")} icon={<Gift size={20} color={t.muted} />} onPress={onHistory} /> : <AppTextButton size="compact" iconAfter={<ChevronRight size={14} color={t.muted} />} onPress={onHistory}>{copy("missionRedeemed")}</AppTextButton> : null}
    </XStack>
  </YStack>;
}

function MissionStatus({ mission }: { mission: MissionPreview }) {
  const done = !!mission.owner && mission.completedBy.includes(mission.owner);
  return <XStack backgroundColor={done ? t.completedSurface : mission.owner ? t.waitingSurface : t.wash} borderRadius="$xl" paddingHorizontal="$sm" paddingVertical="$xs" alignItems="center" gap="$xs">
    {mission.owner ? <CompletionMark done={done} small /> : null}
    {!mission.owner && mission.completedBy.length === 1 ? <XStack alignItems="center" gap="$xs"><MissionText small>Linh</MissionText><CompletionMark done small /><MissionText small>Nam</MissionText><CompletionMark done={false} small /></XStack>
      : <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color={done ? t.completed : mission.owner ? t.waiting : t.muted}>{done ? copy("missionDone") : mission.owner ? copy("missionPending") : formatMessage("vi", "missionParticipants", { count: mission.completedBy.length })}</Text>}
  </XStack>;
}

export function MissionSummary({ mission }: { mission: MissionPreview }) {
  return <XStack alignItems="center" gap="$md" padding="$md" borderRadius={t.rowRadius} backgroundColor={t.peach}>
    <MissionArtwork kind={mission.id} /><YStack flex={1} minWidth={0} gap="$xs"><Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$semibold" color={t.ink}>{copy(mission.title)}</Text><MissionText secondary small>{copy(mission.owner ? "missionIndividual" : "missionShared")} · {points(mission.points)}</MissionText></YStack>
    {!mission.owner ? <XStack gap="$xs">{["Linh", "Nam"].map(name => <YStack key={name} gap="$xs" alignItems="center"><AppProfileAvatar fallbackSeed={name === "Linh" ? "b" : "a"} size={28} accessibilityLabel={name} /><CompletionMark done={mission.completedBy.includes(name)} small /></YStack>)}</XStack> : null}
  </XStack>;
}

export function TodayMissions({ onDetails, onSwap, onRules }: { onDetails: (mission: MissionPreview) => void; onSwap: (mission: MissionPreview) => void; onRules: () => void }) {
  return <YStack gap="$md">
    <XStack alignItems="center" justifyContent="space-between" gap="$md" paddingTop="$xs">
      <YStack flex={1} gap="$xs"><MissionHeading>{copy("missionDaily")}</MissionHeading><MissionText secondary>{copy("missionDate")}</MissionText></YStack>
      <YStack width="34%" gap="$xs"><MissionText secondary small>{copy("missionDayProgress")}</MissionText><MissionProgress value={1} total={4} /></YStack>
    </XStack>
    <YStack gap="$sm">{missionPreviews.map((mission) => <YStack key={mission.id} backgroundColor={t.paper} borderWidth={1} borderColor={t.line} borderRadius={t.rowRadius} overflow="hidden">
      <XStack alignItems="center" minHeight={t.rowMinHeight}>
        <YStack flex={1} minWidth={0}><SectionCard tone="paper" emphasis="flat" density="compact" showChevron={false} onPress={() => onDetails(mission)} accessibilityLabel={copy(mission.title)} testID={`mission-${mission.id}`}>
          <XStack gap="$sm" alignItems="center"><MissionArtwork kind={mission.id} /><YStack flex={1} minWidth={0} gap="$xs">
            <Text textAlign="left" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$bold" color={t.ink}>{copy(mission.title)}</Text>
            <MissionText secondary small>{mission.owner ? `${mission.owner} · ${copy("missionIndividual")}` : `${copy("missionBoth")} · ${copy("missionShared")}`}</MissionText>
            <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$xs"><XStack alignItems="center" gap="$xs"><MissionIllustration kind="flame" size={16} /><Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color={t.coral}>{formatMessage("vi", "missionPoints", { points: mission.points })}</Text></XStack><MissionStatus mission={mission} /></XStack>
          </YStack></XStack>
        </SectionCard></YStack>
        {mission.completedBy.length === 0 ? <YStack borderLeftWidth={1} borderColor={t.line}><AppIconButton tone="plain" icon={<RefreshCw size={18} color={t.muted} />} accessibilityLabel={`${copy("missionSwap")}: ${copy(mission.title)}`} onPress={() => onSwap(mission)} /></YStack> : null}
      </XStack>
    </YStack>)}</YStack>
    <XStack alignItems="center" gap="$xs"><YStack flex={1}><MissionDivider /></YStack><AppTextButton icon={<Info size={17} color={t.muted} />} iconAfter={<ChevronRight size={16} color={t.muted} />} onPress={onRules}>{copy("missionRules")}</AppTextButton><YStack flex={1}><MissionDivider /></YStack></XStack>
  </YStack>;
}

export function MissionDetail({ mission, onSwap, onComplete }: { mission: MissionPreview; onSwap: () => void; onComplete: () => void }) {
  return <YStack gap="$lg">
    {mission.id === "call" ? <VideoCallArtwork /> : <YStack alignItems="center" paddingVertical="$xl"><MissionArtwork kind={mission.id} large /></YStack>}
    <MissionHeading large>{copy(mission.title)}</MissionHeading>
    <XStack gap="$sm" flexWrap="wrap"><XStack backgroundColor={t.peach} paddingHorizontal="$md" paddingVertical="$sm" borderRadius="$xl" alignItems="center" gap="$sm"><Users size={16} color={t.muted} /><MissionText>{copy(mission.owner ? "missionIndividual" : "missionShared")}</MissionText></XStack><XStack backgroundColor={t.waitingSurface} paddingHorizontal="$md" paddingVertical="$sm" borderRadius="$xl" alignItems="center" gap="$xs"><MissionIllustration kind="flame" size={20} /><Text fontFamily="$body" fontSize="$bodyL" fontWeight="$semibold" color={t.coral}>{formatMessage("vi", "missionPoints", { points: mission.points })}</Text></XStack></XStack>
    <MissionText secondary>{copy(mission.description)}</MissionText>
    <MissionParticipants mission={mission} />
    <XStack gap="$sm" alignItems="center"><Info size={17} color={t.muted} /><YStack flex={1}><MissionText secondary small>{copy(mission.owner ? "missionIndividualHelp" : "missionSharedHelp")}</MissionText></YStack></XStack>
    <AppButton depth="flat" fill onPress={onComplete} disabled={!!mission.owner && mission.completedBy.includes(mission.owner)}>{copy("missionComplete")}</AppButton>
    <AppButton depth="flat" fill variant="outline" disabled={mission.completedBy.length > 0} onPress={onSwap}>{copy("missionSwap")}</AppButton>
    <XStack gap="$sm" alignItems="center"><Users size={16} color={t.muted} /><YStack flex={1}><MissionText secondary small>{copy("missionSelfMark")}</MissionText></YStack></XStack>
    <MissionPreviewNotice />
  </YStack>;
}

export function MissionAchievements({ onHistory }: { onHistory: () => void }) {
  const compact = useWindowDimensions().width < t.compactWidth;
  const [period, setPeriod] = useState<"week" | "month">("week");
  const isWeek = period === "week";
  const done = isWeek ? 18 : 64;
  const total = isWeek ? 28 : 124;
  const milestones = isWeek ? [[8, 30], [16, 60], [24, 100]] : [[40, 100], [80, 200], [112, 300]];
  const weekCounts = [3, 4, 3, 4, 2, 2, 0];
  const days = isWeek ? Array.from({ length: 7 }, (_, index) => index + 19)
    : [null, null, null, ...Array.from({ length: 31 }, (_, index) => index + 1), null];
  return <YStack gap="$lg">
    <XStack alignItems="center" gap="$sm"><YStack flex={1} minWidth={0} gap="$md"><MissionHeading large>{copy("missionTogether")}</MissionHeading><XStack gap="$sm">{(["week", "month"] as const).map((item) => <AppFilterChip key={item} selectionMode="single" selected={period === item} label={copy(item === "week" ? "missionWeek" : "missionMonth")} onPress={() => setPeriod(item)} />)}</XStack></YStack><FlameCouple /></XStack>
    <XStack alignItems="center" justifyContent="space-between"><AppIconButton tone="plain" disabled icon={<ChevronLeft size={18} color={t.muted} />} accessibilityLabel={copy("missionPreviousPeriod")} onPress={() => undefined} /><Text fontFamily="$body" fontSize="$bodyL" fontWeight="$semibold" color={t.ink}>{copy(isWeek ? "missionWeekPeriod" : "missionMonthPeriod")}</Text><AppIconButton tone="plain" disabled icon={<ChevronRight size={18} color={t.muted} />} accessibilityLabel={copy("missionNextPeriod")} onPress={() => undefined} /></XStack>
    <AppCalendarGrid density={isWeek ? "compact" : "default"} cells={days.map((day, index) => {
      if (day === null) return { key: `blank-${index}`, content: <YStack height={memoryCalendarTokens.cellHeight} /> };
      const count = day < 11 ? 3 : day < 19 ? 2 : weekCounts[day - 19] ?? 0;
      const future = day > 25;
      return { key: String(day), content: <AppCalendarDay variant={isWeek ? "mood" : "progress"} progress={{ value: count, total: 4 }} showDayNumber day={day} today={day === 25} future={future} count={count}
        label={formatMessage("vi", future ? "missionCalendarFuture" : "missionCalendarDay", { day, count })}
        moodIcon={!future ? <Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" fontWeight="$semibold" color="$accentText">{count}/4</Text> : undefined} /> };
    })} />
    {!isWeek ? <XStack gap="$md" flexWrap="wrap" alignItems="center">
      <XStack gap="$xs" alignItems="center"><Check size={14} color="$calmText" /><MissionText secondary small>{copy("missionCalendarComplete")}</MissionText></XStack>
      <XStack gap="$xs" alignItems="center"><YStack width={memoryCalendarTokens.dotSize} height={memoryCalendarTokens.dotSize} borderRadius="$sm" backgroundColor="$primary" /><MissionText secondary small>{copy("missionCalendarPartial")}</MissionText></XStack>
      <MissionText secondary small>{copy("missionCalendarLegend")}</MissionText>
    </XStack> : null}
    <YStack gap="$sm"><XStack alignItems="baseline" gap="$xs"><Text fontFamily="$heading" fontSize="$h2" fontWeight="$bold" color={t.coral}>{done}</Text><YStack flex={1}><MissionHeading>{formatMessage("vi", "missionProgress", { done: "", total })}</MissionHeading></YStack><MissionText secondary>{Math.round(done / total * 100)}%</MissionText></XStack><MissionProgress value={done} total={total} /></YStack>
    <MissionDivider />
    <YStack gap="$md"><MissionHeading>{copy(isWeek ? "missionWeekMilestones" : "missionMonthMilestones")}</MissionHeading><YStack gap="$xs">{milestones.map(([target, bonus]) => <XStack key={target} alignItems="center" gap={compact ? "$xs" : "$sm"} padding="$sm" borderWidth={1} borderColor={t.line} borderRadius={t.rowRadius}>
      <YStack width={t.milestoneSize} height={t.milestoneSize} borderRadius="$xl" backgroundColor={done >= target ? t.sage : t.wash} alignItems="center" justifyContent="center">{done >= target ? <Check color="$white" size={19} /> : <Gift color={t.muted} size={19} />}</YStack>
      <YStack flex={1} minWidth={0}><MissionText small={compact}>{formatMessage("vi", "missionMilestone", { count: target })}</MissionText></YStack>
      <Text fontFamily="$body" fontSize={compact ? "$bodyS" : "$bodyM"} fontWeight="$semibold" color={t.orange}>{formatMessage("vi", "missionPoints", { points: bonus })}</Text>
      {done >= target ? <YStack borderRadius="$xl" backgroundColor={t.completedSurface} paddingHorizontal="$sm" paddingVertical="$xs"><Text fontFamily="$body" fontSize="$bodyS" color={t.completed}>{copy("missionClaimed")}</Text></YStack> : <YStack width="23%" gap="$xs"><MissionProgress value={done} total={target} /><MissionText secondary small center>{done}/{target}</MissionText></YStack>}
    </XStack>)}</YStack></YStack>
    <XStack gap="$sm" alignItems="center"><Info size={16} color={t.muted} /><YStack flex={1}><MissionText secondary small>{copy("missionKeepPoints")}</MissionText></YStack></XStack>
    <AppTextButton tone="accent" iconAfter={<ChevronRight size={16} color={t.coral} />} onPress={onHistory}>{copy("missionHistory")}</AppTextButton>
  </YStack>;
}

export function MissionRewards({ onRedeem }: { onRedeem: (reward: RewardPreview) => void }) {
  return <YStack gap="$md">
    <MissionHeading>{copy("missionChooseGift")}</MissionHeading>
    <XStack flexWrap="wrap" gap="$sm" alignItems="stretch">{rewardPreviews.map((reward) => <YStack key={reward.id} flexBasis="46%" flexGrow={1} minWidth={0} borderWidth={1} borderColor={t.line} borderRadius={t.rewardRadius} overflow="hidden" backgroundColor={t.paper}>
      <YStack width="100%" aspectRatio={t.rewardAspectRatio} overflow="hidden"><Image source={reward.image} accessibilityLabel={copy(reward.title)} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]} /></YStack>
      <YStack flex={1} padding="$sm" gap="$xs"><Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$bold" color={t.ink}>{copy(reward.title)}</Text><Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$semibold" color={t.coral}>{points(reward.points)}</Text>
        <YStack flex={1} /><AppButton depth="flat" fill size="compact" disabledTone="muted" disabled={reward.points > previewBalance} onPress={() => onRedeem(reward)}>{copy(reward.points > previewBalance ? "missionNotEnough" : "missionRewards")}</AppButton></YStack>
    </YStack>)}</XStack>
    <MissionDivider /><XStack gap="$sm" alignItems="center" justifyContent="center"><Gift size={20} color={t.coral} /><YStack><MissionText secondary small>{copy("missionContact")}</MissionText><MissionText secondary small>{copy("missionFanpageMissing")}</MissionText></YStack></XStack>
  </YStack>;
}
