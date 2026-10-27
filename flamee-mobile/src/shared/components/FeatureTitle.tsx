import { ArrowLeft } from "@tamagui/lucide-icons-2/icons/ArrowLeft";
import { Text, XStack } from "tamagui";
import { featureTitleTokens, spacing } from "../constants/tokens";
import { getMessage } from "../localization/messages";
import { AppIconButton } from "./AppIconButton";

/** Plain feature heading. Rendered by the single root header host. */
export function FeatureTitle({ title, onBack }: { title: string; onBack?: () => void }) {
  return <XStack height={featureTitleTokens.height} alignItems="center" gap="$xs" paddingHorizontal={spacing.page}>
    {onBack ? <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "back")} icon={<ArrowLeft color="$textPrimary" />} onPress={onBack} /> : null}
    <Text flex={1} minWidth={0} role="heading" aria-level={1} fontFamily="$heading" fontSize={onBack ? "$h4" : "$h3"} lineHeight={onBack ? "$h4" : "$h3"}
      fontWeight="$bold" color={featureTitleTokens.color} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{title}</Text>
  </XStack>;
}
