import { AlertCircle, CircleCheck, Clock, WifiOff } from "@tamagui/lucide-icons-2";
import { Text, XStack, YStack } from "tamagui";

type StatusBannerProps = {
  tone: "info" | "offline" | "success" | "warning";
  title: string;
  description?: string;
};

const iconByTone = {
  info: Clock,
  offline: WifiOff,
  success: CircleCheck,
  warning: AlertCircle,
};

export function StatusBanner({ tone, title, description }: StatusBannerProps) {
  const Icon = iconByTone[tone];
  const backgroundColor = tone === "success" ? "$success" : tone === "warning" ? "$supportPeach" : "$supportPeachLight";
  return (
    <XStack accessibilityLiveRegion="polite" accessibilityRole="alert" borderRadius="$md" backgroundColor={backgroundColor} padding="$md" gap="$sm" alignItems="flex-start">
      <Icon size={20} color="$textPrimary" />
      <YStack flex={1} gap="$xs">
        <Text fontFamily="$body" fontSize="$bodyM" fontWeight="$semibold" color="$textPrimary">
          {title}
        </Text>
        {description ? (
          <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">
            {description}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  );
}
