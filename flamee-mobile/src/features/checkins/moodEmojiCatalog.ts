type MoodEmojiId = "happy" | "loved" | "hopeful" | "calm" | "uncertain" | "tired" | "sad" | "overwhelmed" | "neutral";

export type MoodEmojiDefinition = {
  emojiId: MoodEmojiId;
  source: () => number;
};

export const moodEmojiCatalog = {
  happy: { emojiId: "happy", source: () => require("../../public/openmoji-moods/happy.png") },
  loved: { emojiId: "loved", source: () => require("../../public/openmoji-moods/loved.png") },
  hopeful: { emojiId: "hopeful", source: () => require("../../public/openmoji-moods/hopeful.png") },
  calm: { emojiId: "calm", source: () => require("../../public/openmoji-moods/calm.png") },
  uncertain: { emojiId: "uncertain", source: () => require("../../public/openmoji-moods/uncertain.png") },
  tired: { emojiId: "tired", source: () => require("../../public/openmoji-moods/tired.png") },
  sad: { emojiId: "sad", source: () => require("../../public/openmoji-moods/sad.png") },
  overwhelmed: { emojiId: "overwhelmed", source: () => require("../../public/openmoji-moods/overwhelmed.png") },
  neutral: { emojiId: "neutral", source: () => require("../../public/openmoji-moods/neutral.png") },
} as const satisfies Record<MoodEmojiId, MoodEmojiDefinition>;

export function resolveMoodEmojiDefinition(emotionId: string): MoodEmojiDefinition {
  return moodEmojiCatalog[emotionId as keyof typeof moodEmojiCatalog] ?? moodEmojiCatalog.neutral;
}

export function resolveMoodEmoji(emotionId: string): number {
  return resolveMoodEmojiDefinition(emotionId).source();
}
