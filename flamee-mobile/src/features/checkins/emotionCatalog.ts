import type { EmotionDefinition, EmotionTone } from "./types.ts";

export const emotionCatalog = [
  { id: "overwhelmed", labelKey: "emotionOverwhelmed", tone: "heavy" },
  { id: "sad", labelKey: "emotionSad", tone: "low" },
  { id: "tired", labelKey: "emotionTired", tone: "low" },
  { id: "calm", labelKey: "emotionCalm", tone: "steady" },
  { id: "uncertain", labelKey: "emotionUncertain", tone: "steady" },
  { id: "loved", labelKey: "emotionLoved", tone: "warm" },
  { id: "hopeful", labelKey: "emotionHopeful", tone: "warm" },
  { id: "happy", labelKey: "emotionHappy", tone: "bright" },
] as const satisfies readonly EmotionDefinition[];

export function resolveEmotionDefinition(id: string): EmotionDefinition | null {
  return emotionCatalog.find((emotion) => emotion.id === id) ?? null;
}

export function resolveEmotionSelection(
  emotionId: string,
  customEmotionLabel: string | null,
): { emotionId: string; customEmotionLabel: string | null; emotionTone: EmotionTone } | null {
  if (emotionId === "custom") {
    const label = customEmotionLabel?.trim();
    return label ? { emotionId, customEmotionLabel: label, emotionTone: "steady" } : null;
  }
  const emotion = resolveEmotionDefinition(emotionId);
  return emotion ? { emotionId: emotion.id, customEmotionLabel: null, emotionTone: emotion.tone } : null;
}
