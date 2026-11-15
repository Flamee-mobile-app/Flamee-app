import assert from "node:assert/strict";
import test from "node:test";
import { mergeCommentAcknowledgement, orderCommentThreads } from "./conversationModel.ts";
import type { MemoryComment } from "./conversationApi.ts";
const comment = (id: string, time: number, parent: string | null = null): MemoryComment => ({ id, memory_id: "m", body: id, deleted: false, version: 0, created_at: `2026-11-15T00:00:0${time}Z`, updated_at: "2026-11-15T00:00:00Z", parent_id: parent, parent_author: parent ? "Parent" : null, author: { id: "a", full_name: "A", username: null }, heart_count: 0, hearted: false });

test("server acknowledgement replaces heart/edit state before the next tap and deduplicates a retried send", () => {
  const base = comment("a", 1);
  const data = { pages: [{ items: [base], total: 1, comment_count: 1 }], pageParams: [0] };
  const next = mergeCommentAcknowledgement(data, { ...base, hearted: true, heart_count: 1 }, false)!;
  assert.equal(next.pages[0].items[0].hearted, true);
  assert.equal(!next.pages[0].items[0].hearted, false, "next desired state is unlike");
  const sent = comment("b", 2);
  const appended = mergeCommentAcknowledgement(next, sent, true)!;
  const retried = mergeCommentAcknowledgement(appended, sent, true)!;
  assert.equal(retried.pages[0].items.filter((c) => c.id === "b").length, 1);
  assert.equal(mergeCommentAcknowledgement(data, { ...base, body: "edited", version: 1 }, false)!.pages[0].items[0].body, "edited");
});

test("replies stay under their parent despite intervening roots and unloaded parents are not fabricated", () => {
  const root = comment("root", 1), second = comment("second", 2), reply = comment("reply", 3, "root"), orphan = comment("orphan", 4, "unloaded");
  assert.deepEqual(orderCommentThreads([second, orphan, reply, root]).map((c) => c.id), ["root", "reply", "second", "orphan"]);
  assert.equal(orderCommentThreads([orphan]).length, 1);
});
