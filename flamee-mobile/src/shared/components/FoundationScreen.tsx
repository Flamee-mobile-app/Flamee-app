import type { PropsWithChildren } from "react";
import { Button, Text, YStack } from "tamagui";
import { getMessage, type MessageKey } from "../localization/messages";

type FoundationScreenProps = PropsWithChildren<{
  title: MessageKey;
  description?: MessageKey;
  actionLabel?: MessageKey;
  onAction?: () => void;
}>;

export function FoundationScreen({ title, description, actionLabel, onAction }: FoundationScreenProps) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="transparent" paddingHorizontal="$xxl">
      <Text
        marginBottom="$md"
        textAlign="center"
        fontFamily="$heading"
        fontSize="$h2"
        lineHeight="$h2"
        fontWeight="$bold"
        color="$textPrimary"
      >
        {getMessage("vi", title)}
      </Text>
      <Text
        maxWidth={384}
        textAlign="center"
        fontFamily="$body"
        fontSize="$bodyM"
        lineHeight="$bodyM"
        fontWeight="$medium"
        color="$textSecondary"
      >
        {getMessage("vi", description ?? "foundationDescription")}
      </Text>
      {actionLabel && onAction ? (
        <Button
          marginTop="$xl"
          minHeight="$control"
          borderRadius="$md"
          backgroundColor="$primary"
          paddingHorizontal="$xl"
          fontFamily="$body"
          fontSize="$button"
          fontWeight="$medium"
          color="$white"
          pressStyle={{ opacity: 0.85 }}
          onPress={onAction}
        >
          {getMessage("vi", actionLabel)}
        </Button>
      ) : null}
    </YStack>
  );
}
