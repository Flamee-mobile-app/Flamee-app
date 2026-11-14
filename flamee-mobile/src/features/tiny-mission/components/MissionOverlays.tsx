import { CircleAlert } from "@tamagui/lucide-icons-2/icons/CircleAlert";
import { Coins } from "@tamagui/lucide-icons-2/icons/Coins";
import { Copy } from "@tamagui/lucide-icons-2/icons/Copy";
import { Link } from "@tamagui/lucide-icons-2/icons/Link";
import { MinusCircle } from "@tamagui/lucide-icons-2/icons/MinusCircle";
import { RefreshCw } from "@tamagui/lucide-icons-2/icons/RefreshCw";
import { Image, StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppDialog, AppIconButton, AppSheet, AppTextButton, appToast } from "../../../shared/components";
import { missionTokens as t } from "../../../shared/constants/tokens";
import { formatMessage } from "../../../shared/localization/messages";
import { previewBalance, type MissionPreview, type RewardPreview } from "../previewContent";
import { MissionIllustration } from "./MissionIllustrations";
import { copy, MissionDivider, MissionPreviewNotice, MissionSummary, MissionText } from "./MissionViews";

export type MissionOverlay = { kind: "swap"; mission: MissionPreview } | { kind: "redeem" | "code"; reward: RewardPreview } | { kind: "rules" | "points" | "gifts" };
const unavailable = () => appToast.info(copy("missionUnavailable"));

export function MissionOverlays({ overlay, close, change }: { overlay: MissionOverlay | null; close: () => void; change: (overlay: MissionOverlay) => void }) {
  if (!overlay) return null;
  if (overlay.kind === "swap") return <AppSheet open fitContent title={copy("missionSwapTitle")} description={copy("missionSwapBody")} onOpenChange={(open) => { if (!open) close(); }}>
    <MissionSummary mission={overlay.mission} />
    <XStack alignItems="center" gap="$lg"><YStack flex={1}><MissionDivider /></YStack><RefreshCw size={30} color={t.coral} /><YStack flex={1}><MissionDivider /></YStack></XStack>
    <XStack alignItems="center" gap="$md" backgroundColor={t.peach} borderRadius={t.rowRadius} padding="$md"><MissionIllustration kind="gift" size={36} /><YStack flex={1}><MissionText>{copy("missionSwapEqual")}</MissionText></YStack></XStack>
    <XStack gap="$sm" alignItems="center"><CircleAlert color="$warning" size={18} /><YStack flex={1}><MissionText small>{copy("missionSwapRestriction")}</MissionText></YStack></XStack>
    <AppButton fill onPress={unavailable} disabled={overlay.mission.completedBy.length > 0}>{copy("missionSwap")}</AppButton>
    <AppButton fill variant="secondary" onPress={close}>{copy("missionKeep")}</AppButton><MissionPreviewNotice />
  </AppSheet>;

  const reward = "reward" in overlay ? overlay.reward : null;
  const title = overlay.kind === "redeem" && reward ? formatMessage("vi", "missionRedeemTitle", { gift: copy(reward.title).toLocaleLowerCase("vi") })
    : overlay.kind === "code" ? copy("missionCodeTitle") : copy(overlay.kind === "rules" ? "missionRules" : overlay.kind === "points" ? "missionHistory" : "missionRedeemed");
  const copyCode = async () => {
    try { await (await import("expo-clipboard")).setStringAsync(copy("missionCode")); appToast.info(copy("missionCopied")); }
    catch { appToast.error(copy("missionCopyFailed")); }
  };
  return <AppDialog open onOpenChange={(open) => { if (!open) close(); }} title={title} description={copy("missionPreview")} surfaceTone="paper">
    {reward && overlay.kind === "redeem" ? <YStack gap="$lg">
      <YStack width="100%" aspectRatio={t.rewardDialogAspectRatio} borderRadius={t.rowRadius} overflow="hidden"><Image source={reward.image} accessibilityLabel={copy(reward.title)} resizeMode="contain" style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]} /></YStack>
      <YStack gap="$md"><SummaryRow kind="coins" label={copy("missionCurrentPoints")} value={previewBalance.toLocaleString("vi-VN")} /><SummaryRow kind="minus" label={copy("missionCost")} value={`−${reward.points.toLocaleString("vi-VN")}`} /><MissionDivider /><SummaryRow kind="coin" label={copy("missionRemaining")} value={(previewBalance - reward.points).toLocaleString("vi-VN")} /></YStack>
      <MissionText secondary center>{copy("missionDeductNotice")}</MissionText>
      <AppButton fill onPress={unavailable}>{formatMessage("vi", "missionConfirm", { points: reward.points })}</AppButton>
      <AppButton fill variant="secondary" onPress={close}>{copy("missionLater")}</AppButton>
      <AppTextButton onPress={() => change({ kind: "code", reward })}>{copy("missionCodePreview")}</AppTextButton>
    </YStack> : null}
    {reward && overlay.kind === "code" ? <YStack gap="$md">
      <YStack alignItems="center"><MissionIllustration kind="gift" size={64} /></YStack>
      <XStack gap="$md" alignItems="center" padding="$sm" borderRadius={t.rowRadius} backgroundColor={t.wash}><Image source={reward.image} accessibilityLabel={copy(reward.title)} style={{ width: 72, height: 56, borderRadius: t.rewardRadius }} /><YStack flex={1} gap="$xs"><Text fontFamily="$body" fontSize="$bodyL" fontWeight="$bold" color={t.ink}>{copy(reward.title)}</Text><MissionText secondary small>{copy("missionCodeDisclaimer")}</MissionText></YStack></XStack>
      <YStack gap="$xs"><MissionText secondary center>{copy("missionCodeLabel")}</MissionText><XStack backgroundColor={t.wash} borderRadius={t.rewardRadius} paddingLeft="$lg" alignItems="center"><Text flex={1} textAlign="center" fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color={t.ink}>{copy("missionCode")}</Text><AppIconButton tone="plain" icon={<Copy size={18} color={t.muted} />} accessibilityLabel={copy("missionCopyCode")} onPress={() => void copyCode()} /></XStack><MissionText secondary center small>{copy("missionCodeHelp")}</MissionText></YStack>
      <XStack borderWidth={1} borderColor={t.line} borderRadius={t.rowRadius} paddingLeft="$md" alignItems="center" gap="$sm"><Link size={18} color={t.ink} /><YStack flex={1}><MissionText secondary small>{copy("missionFanpageMissing")}</MissionText></YStack><AppIconButton tone="plain" disabled icon={<Copy size={18} color={t.muted} />} accessibilityLabel={copy("missionCopyLink")} onPress={unavailable} /></XStack>
      <AppButton fill disabled onPress={unavailable}>{copy("missionOpenFanpage")}</AppButton>
      <AppButton fill variant="secondary" icon={<Copy size={18} color={t.ink} />} onPress={() => void copyCode()}>{copy("missionCopyCode")}</AppButton>
      <AppButton fill variant="secondary" icon={<Link size={18} color={t.ink} />} disabled onPress={unavailable}>{copy("missionCopyLink")}</AppButton>
      <MissionDivider /><MissionText secondary center small>{copy("missionViewCodes")}</MissionText>
      <AppButton fill variant="secondary" onPress={close}>{copy("close")}</AppButton>
    </YStack> : null}
    {overlay.kind === "rules" || overlay.kind === "points" || overlay.kind === "gifts" ? <YStack gap="$lg"><MissionText secondary>{copy(overlay.kind === "rules" ? "missionRulesBody" : overlay.kind === "points" ? "missionHistoryBody" : "missionRedeemedBody")}</MissionText><AppButton fill variant="secondary" onPress={close}>{copy("close")}</AppButton></YStack> : null}
  </AppDialog>;
}

function SummaryRow({ kind, label, value }: { kind: "coins" | "minus" | "coin"; label: string; value: string }) {
  return <XStack alignItems="center" gap="$sm"><YStack width={28} height={28} alignItems="center" justifyContent="center" backgroundColor={t.peach} borderRadius="$sm">{kind === "coin" ? <MissionIllustration kind="coin" size={22} /> : kind === "minus" ? <MinusCircle color={t.coral} size={20} /> : <Coins color={t.orange} size={20} />}</YStack><YStack flex={1}><MissionText>{label}</MissionText></YStack><Text fontFamily="$body" fontSize="$bodyL" fontWeight="$bold" color={kind === "minus" ? t.coral : t.ink}>{value}</Text></XStack>;
}
