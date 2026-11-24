import { Image } from "react-native";
import { YStack } from "tamagui";
import { resolveMascotSticker } from "../../checkins";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";
import type { DualNudge } from "../dualNudgeApi";

export function nudgeActionTitle(nudge: Pick<DualNudge, "action_type" | "tone">) {
  const titles: Record<string, MessageKey> = { text: "nudgeVisualText", voice: "nudgeVisualVoice", photo: "nudgeVisualPhoto", call: "nudgeVisualCall" };
  return getMessage("vi", nudge.tone === "crisis_safe" ? "nudgeVisualSupport" : titles[nudge.action_type] ?? "nudgeVisualOther");
}

/** Decorative brand artwork describes the action, never an inferred partner mood. */
export function NudgeArtwork({ nudge, size }: { nudge: Pick<DualNudge, "action_type" | "tone">; size: number }) {
  const sticker = resolveMascotSticker(nudge.tone === "crisis_safe" ? "mascot-calm" : nudge.action_type === "photo" ? "mascot-excited" : "mascot-loved");
  return <YStack width={size} height={size} alignItems="center" justifyContent="center" aria-hidden>
    {sticker ? <Image source={sticker.source()} resizeMode="contain" accessible={false} style={{ width: size, height: size }} /> : null}
  </YStack>;
}
