import type { MessageKey } from "../../shared/localization/messages.ts";

export type Mood = 1 | 2 | 3 | 4 | 5;
export type ShareScope = "full" | "mood_only" | "private_only";
export type EmotionTone = "heavy" | "low" | "steady" | "warm" | "bright";

export type EmotionDefinition = {
  id: string;
  labelKey: MessageKey;
  tone: EmotionTone;
};

export type MascotStickerDefinition = {
  id: string;
  labelKey: MessageKey;
  source: () => number;
};

export type CheckInReason = {
  id: string;
  labelKey: MessageKey;
};

export type CheckInFormValue = {
  mood: Mood;
  reasonIds: string[];
  note: string;
  shareScope: ShareScope;
};

export type LegacyLocalCheckIn = {
  id: string;
  clientId: string;
  authorId: string;
  coupleId: string | null;
  mood: Mood;
  reasonIds: string[];
  note: string;
  shareScope: ShareScope;
  createdAt: string;
  localDate: string;
  storageStatus: "saved_local" | "pending";
};

export type EmotionCheckInFormValue = {
  emotionId: string;
  customEmotionLabel: string | null;
  note: string;
  mascotStickerId: string | null;
};

export type EmotionCheckIn = {
  kind: "emotion";
  id: string;
  authorId: string;
  coupleId: string | null;
  emotionId: string;
  customEmotionLabel: string | null;
  emotionTone: EmotionTone;
  note: string;
  mascotStickerId: string | null;
  createdAt: string;
  localDate: string;
  status: "saved_local" | "pending";
};

export type LocalCheckIn = LegacyLocalCheckIn | EmotionCheckIn;

export function isEmotionCheckIn(checkIn: LocalCheckIn): checkIn is EmotionCheckIn {
  return (checkIn as { kind?: string }).kind === "emotion";
}

export type PartnerVisibleCheckIn =
  | {
      kind: "legacy";
      id: string;
      authorId: string;
      mood: Mood;
      shareScope: "mood_only";
      createdAt: string;
      localDate: string;
    }
  | {
      kind: "legacy";
      id: string;
      authorId: string;
      mood: Mood;
      shareScope: "full";
      reasonIds: string[];
      note: string;
      createdAt: string;
      localDate: string;
    }
  | {
      kind: "emotion";
      id: string;
      authorId: string;
      emotionId: string;
      customEmotionLabel: string | null;
      emotionTone: EmotionTone;
      note: string;
      mascotStickerId: string | null;
      createdAt: string;
      localDate: string;
    };

export function isPartnerVisibleEmotionCheckIn(
  checkIn: PartnerVisibleCheckIn,
): checkIn is Extract<PartnerVisibleCheckIn, { kind: "emotion" }> {
  return checkIn.kind === "emotion";
}

export const localCheckInReasons: readonly CheckInReason[] = [
  { id: "work", labelKey: "reasonWork" },
  { id: "study", labelKey: "reasonStudy" },
  { id: "tired", labelKey: "reasonTired" },
  { id: "stress", labelKey: "reasonStress" },
  { id: "anxious", labelKey: "reasonAnxious" },
  { id: "lonely", labelKey: "reasonLonely" },
  { id: "miss_you", labelKey: "reasonMissYou" },
  { id: "happy", labelKey: "reasonHappy" },
  { id: "calm", labelKey: "reasonCalm" },
  { id: "health", labelKey: "reasonHealth" },
  { id: "family", labelKey: "reasonFamily" },
  { id: "friends", labelKey: "reasonFriends" },
  { id: "money", labelKey: "reasonMoney" },
  { id: "other", labelKey: "reasonOther" },
] as const;
