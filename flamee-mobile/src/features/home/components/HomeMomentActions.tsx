import { Camera } from "@tamagui/lucide-icons-2/icons/Camera";
import { MessageCircle } from "@tamagui/lucide-icons-2/icons/MessageCircle";
import { Mic } from "@tamagui/lucide-icons-2/icons/Mic";
import { Radio } from "@tamagui/lucide-icons-2/icons/Radio";
import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";
import { homeShadows } from "../../../shared/constants/tokens";
import type { MomentDraft } from "../../moments";

type ActionSurface = "$accentSoft" | "$calmSurface" | "$supportPeachLight" | "$surfaceMuted";

const actions: Array<{ kind: MomentDraft["kind"]; label: MessageKey; icon: ReactNode; surface: ActionSurface }> = [
  { kind: "text", label: "momentText", icon: <MessageCircle size={20} color="$accentText" />, surface: "$accentSoft" },
  { kind: "photo", label: "momentPhoto", icon: <Camera size={20} color="$calmText" />, surface: "$calmSurface" },
  { kind: "voice", label: "momentVoice", icon: <Mic size={20} color="$accentText" />, surface: "$supportPeachLight" },
  { kind: "signal", label: "momentSignal", icon: <Radio size={20} color="$textSecondary" />, surface: "$surfaceMuted" },
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
          <YStack
            key={action.kind}
            flex={1}
            minWidth={0}
            minHeight={76}
            borderRadius="$lg"
            backgroundColor="$surface"
            alignItems="center"
            justifyContent="center"
            gap="$sm"
            role="button"
            aria-label={getMessage("vi", action.label)}
            pressStyle={{ opacity: 0.78 }}
            focusStyle={{ outlineColor: "$primary", outlineWidth: 2, outlineStyle: "solid" }}
            onPress={() => onSelect(action.kind)}
            {...homeShadows.card}
          >
            <YStack width={36} height={36} borderRadius="$md" backgroundColor={action.surface} alignItems="center" justifyContent="center">
              {action.icon}
            </YStack>
            <Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" fontWeight="$medium" color="$textPrimary" numberOfLines={1}>
              {getMessage("vi", action.label)}
            </Text>
          </YStack>
        ))}
      </XStack>
    </YStack>
  );
}
