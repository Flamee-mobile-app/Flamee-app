import { ChevronDown } from "@tamagui/lucide-icons-2/icons/ChevronDown";
import { ChevronUp } from "@tamagui/lucide-icons-2/icons/ChevronUp";
import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppTextButton } from "../../../shared/components";
import { getMessage, type Locale, type MessageKey } from "../../../shared/localization/messages";

const questions = [
  { id: "connect", question: "supportFaqConnectQuestion", answer: "supportFaqConnectAnswer" },
  { id: "mood", question: "supportFaqMoodQuestion", answer: "supportFaqMoodAnswer" },
  { id: "points", question: "supportFaqPointsQuestion", answer: "supportFaqPointsAnswer" },
  { id: "redeem", question: "supportFaqRedeemQuestion", answer: "supportFaqRedeemAnswer" },
  { id: "claim", question: "supportFaqClaimQuestion", answer: "supportFaqClaimAnswer" },
  { id: "retry", question: "supportFaqRetryQuestion", answer: "supportFaqRetryAnswer" },
] as const satisfies readonly { id: string; question: MessageKey; answer: MessageKey }[];

export function SupportFaq({ locale = "vi" }: { locale?: Locale }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return <YStack gap="$md">
    <YStack gap="$xs">
      <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{getMessage(locale, "supportFaqTitle")}</Text>
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage(locale, "supportFaqIntro")}</Text>
    </YStack>
    <YStack>
      {questions.map((item, index) => {
        const expanded = openId === item.id;
        const Icon = expanded ? ChevronUp : ChevronDown;
        const answerId = `support-faq-answer-${item.id}`;
        return <YStack key={item.id} paddingVertical="$xs" gap="$xs">
          {index > 0 ? <YStack height={1} backgroundColor="$border" aria-hidden /> : null}
          <AppTextButton size="compact" expanded={expanded} controls={answerId} accessibilityLabel={getMessage(locale, item.question)}
            testID={`support-faq-${item.id}`} onPress={() => setOpenId(expanded ? null : item.id)}>
            <XStack flex={1} minWidth={0} alignItems="center" gap="$md" paddingVertical="$sm">
              <Text flex={1} fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color={expanded ? "$accentText" : "$textPrimary"}>{getMessage(locale, item.question)}</Text>
              <Icon size={18} color={expanded ? "$accentText" : "$textSecondary"} aria-hidden />
            </XStack>
          </AppTextButton>
          {expanded ? <YStack nativeID={answerId} paddingHorizontal="$xs" paddingBottom="$md">
            <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage(locale, item.answer)}</Text>
          </YStack> : null}
        </YStack>;
      })}
    </YStack>
  </YStack>;
}
