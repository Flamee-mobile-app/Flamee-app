import assert from "node:assert/strict";
import test from "node:test";
import type { Nudge, NudgeStatus } from "./types.ts";

function nudge(id: string, status: NudgeStatus, createdAt: string): Nudge {
  return {
    id,
    coupleId: "couple-1",
    recipientId: "account-1",
    sourceCheckInId: `check-in-${id}`,
    observation: `Observation ${id}`,
    actionType: "text",
    draft: `Draft ${id}`,
    reason: `Reason ${id}`,
    tone: "gentle",
    source: "template",
    status,
    createdAt,
    expiresAt: "2026-10-15T00:00:00.000Z",
    snoozeCount: status === "snoozed" ? 1 : 0,
    linkedMomentId: status === "acted" ? "moment-1" : null,
    feedback: null,
  };
}

test("shows only actionable nudges and puts the newest task first", async () => {
  const module = await import("./taskFeed.ts").catch(() => null);
  assert.ok(module, "task feed selector should exist");

  const result = module.selectActionableNudges([
    nudge("older", "new", "2026-10-13T08:00:00.000Z"),
    nudge("done", "acted", "2026-10-14T09:00:00.000Z"),
    nudge("newer", "snoozed", "2026-10-14T08:00:00.000Z"),
    nudge("expired", "expired", "2026-10-14T10:00:00.000Z"),
  ]);

  assert.deepEqual(result.map((item) => item.id), ["newer", "older"]);
});
