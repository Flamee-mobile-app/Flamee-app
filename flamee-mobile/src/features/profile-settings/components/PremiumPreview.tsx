import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Crown } from "@tamagui/lucide-icons-2/icons/Crown";
import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppFilterChip } from "../../../shared/components";
import { menuTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";

const benefits = ["profilePremiumThemes", "profilePremiumStickers", "profilePremiumMemories"] as const;

/** Presentation-only plans; no checkout, entitlement or account changes. */
export function PremiumPreview() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  return (
    <YStack gap="$md" paddingVertical="$md">
      <XStack alignItems="center" gap="$sm">
        <Crown size={menuTokens.iconSize} color="$accentText" aria-hidden={true} />
        <Text flex={1} fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary">
          {getMessage("vi", "profilePremiumName")}
        </Text>
      </XStack>
      <XStack flexWrap="wrap" gap="$sm" role="radiogroup" aria-label={getMessage("vi", "profileSubscriptionGroup")}>
        <AppFilterChip testID="premium-monthly" label={getMessage("vi", "profilePremiumMonthly")} selectionMode="single" selected={billing === "monthly"} onPress={() => setBilling("monthly")} />
        <AppFilterChip testID="premium-yearly" label={getMessage("vi", "profilePremiumYearly")} selectionMode="single" selected={billing === "yearly"} onPress={() => setBilling("yearly")} />
      </XStack>
      <XStack alignItems="baseline" flexWrap="wrap" gap="$xs" aria-live="polite">
        <Text fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$accentText">
          {getMessage("vi", billing === "monthly" ? "profilePremiumMonthlyPrice" : "profilePremiumYearlyPrice")}
        </Text>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">
          {getMessage("vi", billing === "monthly" ? "profilePremiumPerMonth" : "profilePremiumPerYear")}
        </Text>
      </XStack>
      <YStack gap="$sm">
        {benefits.map((benefit) => (
          <XStack key={benefit} alignItems="flex-start" gap="$sm">
            <Check size={menuTokens.iconSize} color="$accentText" aria-hidden={true} />
            <Text flex={1} fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{getMessage("vi", benefit)}</Text>
          </XStack>
        ))}
      </YStack>
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "profilePremiumPreviewNote")}</Text>
      <AppButton variant="secondary" disabled onPress={() => undefined}>{getMessage("vi", "profilePremiumComingSoon")}</AppButton>
    </YStack>
  );
}
