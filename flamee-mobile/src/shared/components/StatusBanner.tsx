import { AlertCircle } from "@tamagui/lucide-icons-2/icons/AlertCircle";
import { CircleCheck } from "@tamagui/lucide-icons-2/icons/CircleCheck";
import { Clock } from "@tamagui/lucide-icons-2/icons/Clock";
import { WifiOff } from "@tamagui/lucide-icons-2/icons/WifiOff";
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
  const backgroundColor = tone === "warning" ? "$accentSoft" : "$glassCard";
  const color = tone === "success" ? "$calmText" : tone === "warning" ? "$accentText" : "$textPrimary";
  return (
    <XStack aria-live="polite" role="alert" borderRadius="$md" backgroundColor={backgroundColor} padding="$md" gap="$sm" alignItems="flex-start">
      <Icon size={20} color={color} />
      <YStack flex={1} gap="$xs">
        <Text fontFamily="$body" fontSize="$bodyM" fontWeight="$semibold" color={color}>
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
