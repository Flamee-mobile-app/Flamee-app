export type Mood = 1 | 2 | 3 | 4 | 5;
export type ShareScope = "full" | "mood_only" | "private_only";

export type CheckInReason = {
  id: string;
  labelKey: string;
};

export type CheckInFormValue = {
  mood: Mood;
  reasonIds: string[];
  note: string;
  shareScope: ShareScope;
};

export type LocalCheckIn = {
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

export type PartnerVisibleCheckIn =
  | {
      id: string;
      authorId: string;
      mood: Mood;
      shareScope: "mood_only";
      createdAt: string;
      localDate: string;
    }
  | {
      id: string;
      authorId: string;
      mood: Mood;
      shareScope: "full";
      reasonIds: string[];
      note: string;
      createdAt: string;
      localDate: string;
    };

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
