import { Eye } from "@tamagui/lucide-icons-2/icons/Eye";
import { EyeOff } from "@tamagui/lucide-icons-2/icons/EyeOff";
import { Lock } from "@tamagui/lucide-icons-2/icons/Lock";
import { Text, XStack, YStack } from "tamagui";
import { SectionCard } from "../../../shared/components";
import type { ShareScope } from "../types";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";

const scopes: Array<{ value: ShareScope; title: MessageKey; body: MessageKey; icon: typeof Eye }> = [
  { value: "full", title: "shareFull", body: "shareFullBody", icon: Eye },
  { value: "mood_only", title: "shareMoodOnly", body: "shareMoodOnlyBody", icon: EyeOff },
  { value: "private_only", title: "sharePrivate", body: "sharePrivateBody", icon: Lock },
];

export function ShareScopePicker({ value, onChange }: { value: ShareScope; onChange: (value: ShareScope) => void }) {
  return (
    <YStack gap="$sm" role="radiogroup">
      {scopes.map((scope) => {
        const selected = scope.value === value;
        const Icon = scope.icon;
        return (
          <SectionCard key={scope.value} tone={selected ? "peach" : "default"} selectionMode="single" selected={selected}
            accessibilityLabel={getMessage("vi", scope.title)} onPress={() => onChange(scope.value)}>
            <XStack alignItems="center" gap="$md">
            <Icon size={22} color={selected ? "$primary" : "$textSecondary"} />
            <YStack flex={1} gap="$xs">
              <Text fontFamily="$body" fontSize="$bodyM" fontWeight="$semibold">{getMessage("vi", scope.title)}</Text>
              <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", scope.body)}</Text>
            </YStack>
            </XStack>
          </SectionCard>
        );
      })}
    </YStack>
  );
}
