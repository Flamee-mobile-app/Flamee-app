import type { MessageKey } from "../../shared/localization/messages.ts";

export type CheckInFeeling = {
  id: string;
  labelKey: MessageKey;
  stickerId: string;
  pack: "daily_emotions_gif";
  source: () => number;
};

export const checkInFeelingCatalog = [
  { id: "tired", labelKey: "moodFeelingTired", stickerId: "tired", pack: "daily_emotions_gif", source: () => require("../../public/gif_sticker_emote/tired.gif") },
  { id: "discouraged", labelKey: "moodFeelingDiscouraged", stickerId: "discouraged", pack: "daily_emotions_gif", source: () => require("../../public/gif_sticker_emote/discouraged.gif") },
  { id: "happy", labelKey: "moodFeelingHappy", stickerId: "happy", pack: "daily_emotions_gif", source: () => require("../../public/gif_sticker_emote/happy.gif") },
  { id: "energetic", labelKey: "moodFeelingEnergetic", stickerId: "energetic", pack: "daily_emotions_gif", source: () => require("../../public/gif_sticker_emote/energetic.gif") },
  { id: "unbothered", labelKey: "moodFeelingUnbothered", stickerId: "unbothered", pack: "daily_emotions_gif", source: () => require("../../public/gif_sticker_emote/unbothered.gif") },
  { id: "broken_down", labelKey: "moodFeelingBrokenDown", stickerId: "broken_down", pack: "daily_emotions_gif", source: () => require("../../public/gif_sticker_emote/broken_down.gif") },
  { id: "sad", labelKey: "moodFeelingSad", stickerId: "sad", pack: "daily_emotions_gif", source: () => require("../../public/gif_sticker_emote/sad.gif") },
  { id: "awful", labelKey: "moodFeelingAwful", stickerId: "awful", pack: "daily_emotions_gif", source: () => require("../../public/gif_sticker_emote/awful.gif") },
] as const satisfies readonly CheckInFeeling[];

export function resolveCheckInFeeling(id: string): CheckInFeeling | null {
  return checkInFeelingCatalog.find((feeling) => feeling.id === id) ?? null;
}
