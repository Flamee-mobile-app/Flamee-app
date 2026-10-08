import {
  AlertCircle,
  BellOff,
  CircleCheck,
  Clock,
  Inbox,
  LoaderCircle,
  WifiOff,
} from "@tamagui/lucide-icons-2";
import { Text, YStack } from "tamagui";
import { getMessage, type MessageKey } from "../localization/messages";
import { AppButton } from "./AppButton";
import { getAsyncStateCopy, type AsyncStateVariant } from "./asyncStateCopy";

export type { AsyncStateVariant } from "./asyncStateCopy";

type AsyncStateViewProps = {
  variant: AsyncStateVariant;
  title?: MessageKey;
  description?: MessageKey;
  actionLabel?: MessageKey;
  onAction?: () => void;
};

const icons = {
  loading: LoaderCircle,
  empty: Inbox,
  error: AlertCircle,
  offline: WifiOff,
  permission: BellOff,
  expired: Clock,
  success: CircleCheck,
  pending: Clock,
};

export function AsyncStateView({ variant, title, description, actionLabel, onAction }: AsyncStateViewProps) {
  const Icon = icons[variant];
  const copy = getAsyncStateCopy(variant);
  return (
    <YStack flex={1} minHeight={280} alignItems="center" justifyContent="center" gap="$md" padding="$xl">
      <YStack width={64} height={64} borderRadius="$xl" alignItems="center" justifyContent="center" backgroundColor="$supportPeachLight">
        <Icon size={30} color="$primary" />
      </YStack>
      <Text textAlign="center" fontFamily="$heading" fontSize="$h4" fontWeight="$bold" color="$textPrimary">
        {getMessage("vi", title ?? copy.title)}
      </Text>
      <Text textAlign="center" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">
        {getMessage("vi", description ?? copy.description)}
      </Text>
      {(actionLabel ?? copy.actionLabel) && onAction ? (
        <AppButton marginTop="$sm" onPress={onAction}>
          {getMessage("vi", actionLabel ?? copy.actionLabel!)}
        </AppButton>
      ) : null}
    </YStack>
  );
}
