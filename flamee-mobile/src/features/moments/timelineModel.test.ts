import assert from "node:assert/strict";
import test from "node:test";
import { groupTimelineMoments } from "./timelineModel.ts";
import type { Moment } from "./types.ts";

const moment = (id: string, createdAt: string, overrides: Partial<Moment> = {}): Moment => ({
  id, createdAt, coupleId: "couple-1", authorId: "author-1", kind: "text", text: "A note", caption: null,
  place: null, mediaUri: null, durationSeconds: null, status: "saved_local", parentMomentId: null,
  fromNudgeId: null, reactions: [], ...overrides,
});

test("timeline groups newest first by the viewer's day and excludes other couples and replies", () => {
  const input = [
    moment("older", "2026-10-13T16:00:00Z"),
    moment("newer", "2026-10-13T18:00:00Z"),
    moment("foreign", "2026-10-14T08:00:00Z", { coupleId: "other-couple" }),
    moment("reply", "2026-10-14T08:00:00Z", { parentMomentId: "newer" }),
  ];
  const groups = groupTimelineMoments(input, "couple-1", "Asia/Ho_Chi_Minh", "timeline");
  assert.deepEqual(groups.map((group) => [group.date, group.data.map((item) => item.id)]), [
    ["2026-10-14", ["newer"]], ["2026-10-13", ["older"]],
  ]);
  assert.equal(input[0].id, "older", "grouping must not reorder service records in place");
});

test("memories include only saved photo and voice moments, never failed or pending media", () => {
  const input = [
    moment("note", "2026-10-14T08:00:00Z"),
    moment("photo", "2026-10-14T08:00:00Z", { kind: "photo" }),
    moment("voice", "2026-10-14T08:00:00Z", { kind: "voice" }),
    moment("pending", "2026-10-14T08:00:00Z", { kind: "photo", status: "pending" }),
    moment("failed", "2026-10-14T08:00:00Z", { kind: "voice", status: "failed" }),
  ];
  assert.deepEqual(groupTimelineMoments(input, "couple-1", "Asia/Ho_Chi_Minh", "memories").flatMap((group) => group.data.map((item) => item.id)), ["photo", "voice"]);
});
