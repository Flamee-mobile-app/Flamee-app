import type { PartnerSummary } from "../couple/index.ts";
import type { Mood } from "../checkins/types.ts";

type PartnerStatusBase = {
  partner: PartnerSummary;
  partnerLocalTime: string;
  timezoneDifferenceHours: number;
};

export type PartnerStatusView =
  | (PartnerStatusBase & { kind: "no_update" })
  | (PartnerStatusBase & {
      kind: "mood_only";
      mood: Mood;
      updatedAt: string;
      minutesAgo: number;
    })
  | (PartnerStatusBase & {
      kind: "full";
      mood: Mood;
      reasonIds: string[];
      note: string;
      updatedAt: string;
      minutesAgo: number;
    })
  | (PartnerStatusBase & {
      kind: "emotion";
      note: string;
      mascotStickerId: string | null;
      updatedAt: string;
      minutesAgo: number;
    });

export type PartnerStatusViewer = {
  userId: string;
  timezone: string;
  partner: PartnerSummary;
  now: Date;
};

export type { PartnerVisibleCheckIn } from "../checkins/types.ts";
