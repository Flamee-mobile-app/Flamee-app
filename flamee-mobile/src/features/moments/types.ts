export const momentReactions = ["❤️", "🥰", "😂", "😢", "👏", "🔥"] as const;
export type MomentReaction = (typeof momentReactions)[number];

export type MomentDraft =
  | { kind: "text"; text: string }
  | { kind: "signal"; text: string }
  | { kind: "photo"; mediaUri: string; caption: string; place: string }
  | { kind: "voice"; mediaUri: string; durationSeconds: number; caption: string; place: string };

export type MomentStatus = "saved_local" | "pending" | "failed";

export type MomentReactionRecord = {
  userId: string;
  emoji: MomentReaction;
  createdAt: string;
};

export type Moment = {
  id: string;
  coupleId: string;
  authorId: string;
  kind: MomentDraft["kind"];
  text: string | null;
  caption: string | null;
  place: string | null;
  mediaUri: string | null;
  durationSeconds: number | null;
  createdAt: string;
  status: MomentStatus;
  parentMomentId: string | null;
  fromNudgeId: string | null;
  reactions: MomentReactionRecord[];
};
