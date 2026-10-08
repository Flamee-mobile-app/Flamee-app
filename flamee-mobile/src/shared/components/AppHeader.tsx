import { ArrowLeft } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { Button, Text, XStack, YStack } from "tamagui";
import { getMessage } from "../localization/messages";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  eyebrow?: string;
};

export function AppHeader({ title, subtitle, showBack = false, onBack, eyebrow }: AppHeaderProps) {
  const router = useRouter();
  return (
    <YStack gap="$sm">
      <XStack alignItems="center" gap="$sm">
        {showBack ? (
          <Button
            circular
            size="$control"
            chromeless
            accessibilityLabel={getMessage("vi", "back")}
            icon={<ArrowLeft color="$textPrimary" />}
            onPress={onBack ?? router.back}
          />
        ) : null}
        <YStack flex={1} gap="$xs">
          {eyebrow ? (
            <Text fontFamily="$body" fontSize="$bodyS" color="$primary" fontWeight="$semibold">
              {eyebrow}
            </Text>
          ) : null}
          <Text
            fontFamily="$heading"
            fontSize="$h2"
            lineHeight="$h2"
            fontWeight="$bold"
            color="$textPrimary"
          >
            {title}
          </Text>
        </YStack>
      </XStack>
      {subtitle ? (
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">
          {subtitle}
        </Text>
      ) : null}
    </YStack>
  );
}
