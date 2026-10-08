import { Eye, EyeOff, Lock } from "@tamagui/lucide-icons-2";
import { Text, XStack, YStack } from "tamagui";
import type { ShareScope } from "../types";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";

const scopes: Array<{ value: ShareScope; title: MessageKey; body: MessageKey; icon: typeof Eye }> = [
  { value: "full", title: "shareFull", body: "shareFullBody", icon: Eye },
  { value: "mood_only", title: "shareMoodOnly", body: "shareMoodOnlyBody", icon: EyeOff },
  { value: "private_only", title: "sharePrivate", body: "sharePrivateBody", icon: Lock },
];

export function ShareScopePicker({ value, onChange }: { value: ShareScope; onChange: (value: ShareScope) => void }) {
  return (
    <YStack gap="$sm">
      {scopes.map((scope) => {
        const selected = scope.value === value;
        const Icon = scope.icon;
        return (
          <XStack
            key={scope.value}
            minHeight={76}
            borderRadius="$lg"
            borderWidth={selected ? 2 : 1}
            borderColor={selected ? "$primary" : "$border"}
            backgroundColor={selected ? "$supportPeachLight" : "$surface"}
            padding="$md"
            alignItems="center"
            gap="$md"
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(scope.value)}
          >
            <Icon size={22} color={selected ? "$primary" : "$textSecondary"} />
            <YStack flex={1} gap="$xs">
              <Text fontFamily="$body" fontSize="$bodyM" fontWeight="$semibold">{getMessage("vi", scope.title)}</Text>
              <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", scope.body)}</Text>
            </YStack>
          </XStack>
        );
      })}
    </YStack>
  );
}
