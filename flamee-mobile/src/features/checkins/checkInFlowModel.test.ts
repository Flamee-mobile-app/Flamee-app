import assert from "node:assert/strict";
import test from "node:test";
import { canContinueCheckIn, checkInReasonOptions, checkInSteps, createCheckInDraft, hasCheckInAnswers, setCheckInAttachment, toggleSelection } from "./checkInFlowModel.ts";

test("reason multi-select retains more than three choices and toggles without duplicates", () => {
  let ids: string[] = [];
  for (const id of ["work", "study", "family", "health", "friends"]) ids = toggleSelection(ids, id);
  assert.equal(ids.length, 5);
  assert.deepEqual(toggleSelection(ids, "work"), ["study", "family", "health", "friends"]);
});

test("the feeling stage requires a chosen feeling without inventing answers", () => {
  const draft = createCheckInDraft();
  assert.equal(canContinueCheckIn("feeling", draft), false);
  assert.equal(canContinueCheckIn("feeling", { ...draft, emotionId: "custom", customEmotionLabel: "  " }), false);
  assert.equal(canContinueCheckIn("feeling", { ...draft, emotionId: "happy" }), true);
  assert.equal(canContinueCheckIn("feeling", { ...draft, emotionId: "energetic" }), true);
});

test("the reasons step requires at least one reason", () => {
  const draft = createCheckInDraft();
  assert.equal(canContinueCheckIn("reasons", draft), false);
  assert.equal(canContinueCheckIn("reasons", { ...draft, reasonIds: ["work"] }), true);
});

test("intensity is required while sleep stays optional", () => {
  const draft = createCheckInDraft();
  assert.equal(canContinueCheckIn("intensity", draft), false);
  for (const intensity of [0, 6, 10, 1.5]) assert.equal(canContinueCheckIn("intensity", { ...draft, intensity }), false);
  assert.equal(canContinueCheckIn("intensity", { ...draft, intensity: 3 }), true);
  assert.equal(canContinueCheckIn("intensity", { ...draft, intensity: 3, sleepHours: 2 }), true);
  assert.equal(canContinueCheckIn("intensity", { ...draft, intensity: 3, sleepHours: 8 }), true);
  assert.equal(canContinueCheckIn("intensity", { ...draft, intensity: 3, sleepHours: 1 }), false);
  assert.equal(canContinueCheckIn("intensity", { ...draft, intensity: 3, sleepHours: 9 }), false);
  assert.equal(canContinueCheckIn("intensity", { ...draft, intensity: 3, sleepHours: 2.5 }), false);
  assert.equal(draft.sleepHours, null);
});

test("the final note step validates a short shareable note without requiring media", () => {
  const draft = createCheckInDraft();
  assert.equal(canContinueCheckIn("note", draft), false);
  assert.equal(canContinueCheckIn("note", { ...draft, note: "  " }), false);
  assert.equal(canContinueCheckIn("note", { ...draft, note: "Hôm nay mình thấy nhẹ nhõm." }), true);
  assert.equal(canContinueCheckIn("note", { ...draft, note: "a".repeat(60) }), true);
  assert.equal(canContinueCheckIn("note", { ...draft, note: "a".repeat(61) }), false);
});

test("the screen sequence ends on the note composer and removes rating and communication fields", () => {
  assert.deepEqual(checkInSteps, ["feeling", "reasons", "intensity", "note"]);
  assert.deepEqual(checkInReasonOptions.map(({ id }) => id), ["work", "study", "tired", "stress", "anxious", "friends", "family"]);
  assert.equal("companions" in createCheckInDraft(), false);
  assert.equal("dayScore" in createCheckInDraft(), false);
  assert.equal("socialized" in createCheckInDraft(), false);
});

test("note attachments allow one current item per picker category", () => {
  let attachments = setCheckInAttachment([], { kind: "gif", id: "tired" });
  attachments = setCheckInAttachment(attachments, { kind: "emoji", id: "happy" });
  attachments = setCheckInAttachment(attachments, { kind: "sticker", id: "mascot-calm" });
  assert.deepEqual(attachments, [
    { kind: "gif", id: "tired" },
    { kind: "emoji", id: "happy" },
    { kind: "sticker", id: "mascot-calm" },
  ]);
  attachments = setCheckInAttachment(attachments, { kind: "gif", id: "sad" });
  assert.deepEqual(attachments.find(({ kind }) => kind === "gif"), { kind: "gif", id: "sad" });
  attachments = setCheckInAttachment(attachments, { kind: "gif", id: "sad" });
  assert.equal(attachments.some(({ kind }) => kind === "gif"), false);
});

test("exit confirmation is only needed after the user has entered an answer", () => {
  const draft = createCheckInDraft();
  assert.equal(hasCheckInAnswers(draft), false);
  assert.equal(hasCheckInAnswers({ ...draft, emotionId: "happy" }), true);
  assert.equal(hasCheckInAnswers({ ...draft, note: "a note" }), true);
  assert.equal(hasCheckInAnswers({ ...draft, attachments: [{ kind: "emoji", id: "happy" }] }), true);
});
