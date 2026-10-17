import { Camera } from "@tamagui/lucide-icons-2/icons/Camera";
import { MessageCircle } from "@tamagui/lucide-icons-2/icons/MessageCircle";
import { Mic } from "@tamagui/lucide-icons-2/icons/Mic";
import { Radio } from "@tamagui/lucide-icons-2/icons/Radio";
import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";
import { AppIconButton } from "../../../shared/components";
import type { MomentDraft } from "../../moments";

const actions: Array<{ kind: MomentDraft["kind"]; label: MessageKey; icon: ReactNode }> = [
  { kind: "text", label: "momentText", icon: <MessageCircle size={20} color="$accentText" /> },
  { kind: "photo", label: "momentPhoto", icon: <Camera size={20} color="$calmText" /> },
  { kind: "voice", label: "momentVoice", icon: <Mic size={20} color="$accentText" /> },
  { kind: "signal", label: "momentSignal", icon: <Radio size={20} color="$textSecondary" /> },
];

export function HomeMomentActions({ onSelect }: { onSelect: (kind: MomentDraft["kind"]) => void }) {
  return (
    <YStack gap="$md">
      <YStack gap="$xs">
        <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">
          {getMessage("vi", "homeQuickShareTitle")}
        </Text>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">
          {getMessage("vi", "homeQuickShareBody")}
        </Text>
      </YStack>
      <XStack gap="$sm" role="group" aria-label={getMessage("vi", "homeQuickShareTitle")}>
        {actions.map((action) => (
          <YStack key={action.kind} flex={1} minWidth={0} alignItems="center" gap="$xs"><AppIconButton accessibilityLabel={getMessage("vi", action.label)} icon={action.icon} onPress={() => onSelect(action.kind)} /><Text fontFamily="$body" fontSize="$caption" color="$textSecondary" numberOfLines={1}>{getMessage("vi", action.label)}</Text></YStack>
        ))}
      </XStack>
    </YStack>
  );
}
