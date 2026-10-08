import type { PropsWithChildren } from "react";
import { Card, Text, YStack } from "tamagui";

type SectionCardProps = PropsWithChildren<{
  title?: string;
  description?: string;
  tone?: "default" | "peach" | "lavender";
}>;

export function SectionCard({ title, description, tone = "default", children }: SectionCardProps) {
  const backgroundColor =
    tone === "peach" ? "$supportPeachLight" : tone === "lavender" ? "$supportLavenderLight" : "$surface";
  return (
    <Card
      borderWidth={1}
      borderColor="$border"
      borderRadius="$lg"
      backgroundColor={backgroundColor}
      padding="$lg"
    >
      <YStack gap="$sm">
        {title ? (
          <Text fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">
            {title}
          </Text>
        ) : null}
        {description ? (
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">
            {description}
          </Text>
        ) : null}
        {children}
      </YStack>
    </Card>
  );
}
