import assert from "node:assert/strict";
import test from "node:test";

test("opens supported Nudge actions in the matching Tiny Moment composer", async () => {
  const model = await import("./homeActionModel.ts").catch(() => null);

  assert.ok(model, "home action model should exist");
  assert.deepEqual(model.getNudgeHomeAction("text"), { kind: "composer", momentKind: "text" });
  assert.deepEqual(model.getNudgeHomeAction("voice"), { kind: "composer", momentKind: "voice" });
  assert.deepEqual(model.getNudgeHomeAction("photo"), { kind: "composer", momentKind: "photo" });
});

test("keeps call and other Nudge actions in the dedicated Nudge flow", async () => {
  const model = await import("./homeActionModel.ts").catch(() => null);

  assert.ok(model, "home action model should exist");
  assert.deepEqual(model.getNudgeHomeAction("call"), { kind: "detail" });
  assert.deepEqual(model.getNudgeHomeAction("other"), { kind: "detail" });
});

test("does not route the note author to a nudge addressed to their partner", async () => {
  const model = await import("./homeActionModel.ts").catch(() => null);
  assert.ok(model, "home action model should exist");
  const value = {
    id: "nudge-for-partner",
    coupleId: "couple-1",
    recipientId: "account-b",
    sourceCheckInId: "check-in-1",
    observation: "O",
    actionType: "text" as const,
    draft: "D",
    reason: "R",
    tone: "gentle" as const,
    source: "template" as const,
    status: "new" as const,
    createdAt: "2026-10-14T08:00:00.000Z",
    expiresAt: "2026-10-15T08:00:00.000Z",
    snoozeCount: 0,
    linkedMomentId: null,
    feedback: null,
  };
  assert.equal(model.getNudgeRouteIdForAccount(value, "account-a"), undefined);
  assert.equal(model.getNudgeRouteIdForAccount(value, "account-b"), "nudge-for-partner");
});
