import { Image } from "react-native";
import { resolveMoodEmoji } from "../moodEmojiCatalog";

export function MoodEmojiIcon({ emotionId, size, label }: { emotionId: string; size: number; label?: string }) {
  return <Image source={resolveMoodEmoji(emotionId)} resizeMode="contain" accessibilityLabel={label} accessible={Boolean(label)} style={{ width: size, height: size }} />;
}
