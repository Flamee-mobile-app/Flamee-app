import { Text } from "tamagui";
import { moodEmojiCatalog } from "../moodEmojiCatalog";
import { MoodEmojiIcon } from "./MoodEmojiIcon";

/** An unmapped server mood must not silently appear as a neutral emotion. */
export function ServerMoodIcon({ emotionId, size, label }: { emotionId: string; size: number; label?: string }) {
  return Object.hasOwn(moodEmojiCatalog, emotionId)
    ? <MoodEmojiIcon emotionId={emotionId} size={size} label={label} />
    : <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" numberOfLines={1} accessibilityLabel={label ?? emotionId}>{emotionId}</Text>;
}
