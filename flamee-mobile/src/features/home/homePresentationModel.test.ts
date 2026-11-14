import assert from "node:assert/strict";
import test from "node:test";
import type { EmotionCheckIn, PartnerVisibleCheckIn } from "../checkins/types.ts";
import type { Nudge } from "../nudges/types.ts";
import { createPartnerNotePreview, isCurrentHomeLoad, selectHomeHero } from "./homePresentationModel.ts";

const checkIn: EmotionCheckIn = {
  kind: "emotion",
  id: "check-in-1",
  authorId: "account-a",
  coupleId: "couple-1",
  emotionId: "calm",
  customEmotionLabel: null,
  emotionTone: "steady",
  note: "Mình đang bình yên hơn.",
  mascotStickerId: "mascot-calm",
  createdAt: "2026-10-14T08:00:00.000Z",
  localDate: "2026-10-14",
  status: "saved_local",
};

function nudge(status: Nudge["status"]): Nudge {
  return {
    id: "nudge-1",
    coupleId: "couple-1",
    recipientId: "account-a",
    sourceCheckInId: "check-in-partner",
    observation: "Người ấy đang cần một nhịp nhẹ.",
    actionType: "text",
    draft: "Mình ở đây nè.",
    reason: "Một lời nhắn vừa đủ.",
    tone: "gentle",
    source: "template",
    status,
    createdAt: "2026-10-14T08:00:00.000Z",
    expiresAt: "2026-10-15T08:00:00.000Z",
    snoozeCount: 0,
    linkedMomentId: null,
    feedback: null,
  };
}

test("selects one stateful hero with an actionable nudge taking priority", () => {
  assert.deepEqual(selectHomeHero(null, []), { kind: "empty" });
  assert.deepEqual(selectHomeHero(checkIn, []), { kind: "saved", checkInId: "check-in-1", note: "Mình đang bình yên hơn." });
  assert.deepEqual(selectHomeHero(checkIn, [nudge("new")]), { kind: "nudge", nudgeId: "nudge-1" });
  assert.deepEqual(selectHomeHero(checkIn, [nudge("acted")]), { kind: "saved", checkInId: "check-in-1", note: "Mình đang bình yên hơn." });
});

test("partner preview contains only the note and record identifier", () => {
  const partnerCheckIn: PartnerVisibleCheckIn = {
    kind: "emotion",
    id: "partner-note-1",
    authorId: "account-b",
    emotionId: "sad",
    customEmotionLabel: null,
    emotionTone: "low",
    note: "Hôm nay mình muốn được nghe một câu dịu dàng.",
    mascotStickerId: "mascot-sad",
    createdAt: "2026-10-14T07:00:00.000Z",
    localDate: "2026-10-14",
  };
  assert.deepEqual(createPartnerNotePreview(partnerCheckIn), {
    checkInId: "partner-note-1",
    note: "Hôm nay mình muốn được nghe một câu dịu dàng.",
  });
  assert.equal("mascotStickerId" in (createPartnerNotePreview(partnerCheckIn) ?? {}), false);

  const moodOnly: PartnerVisibleCheckIn = {
    kind: "legacy",
    id: "legacy-mood",
    authorId: "account-b",
    mood: 3,
    shareScope: "mood_only",
    createdAt: "2026-10-14T07:00:00.000Z",
    localDate: "2026-10-14",
  };
  assert.equal(createPartnerNotePreview(moodOnly), null);
});

test("rejects stale Home load results after account or revision changes", () => {
  assert.equal(isCurrentHomeLoad(4, "account-a", 4, "account-a"), true);
  assert.equal(isCurrentHomeLoad(3, "account-a", 4, "account-a"), false);
  assert.equal(isCurrentHomeLoad(4, "account-a", 4, "account-b"), false);
});
