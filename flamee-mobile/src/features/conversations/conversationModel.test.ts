import assert from "node:assert/strict";
import test from "node:test";
import { getCommentActions, getCommentAuthorName, getReplyAuthorName, mergeCommentAcknowledgement, orderCommentThreads } from "./conversationModel.ts";
import type { MemoryComment } from "./conversationApi.ts";
const comment = (id: string, time: number, parent: string | null = null): MemoryComment => ({ id, memory_id: "m", body: id, deleted: false, version: 0, created_at: `2026-11-15T00:00:0${time}Z`, updated_at: "2026-11-15T00:00:00Z", parent_id: parent, parent_author: parent ? "Parent" : null, author: { id: "a", full_name: "A", username: null }, heart_count: 0, hearted: false });

test("comment and reply labels prefer the confirmed nickname and fall back only when blank", () => {
  const root = { ...comment("root", 1), author: { id: "a", full_name: "Original name", username: "  Tai voi  " } };
  const reply = { ...comment("reply", 2, "root"), parent_author: "Original name" };
  assert.equal(getCommentAuthorName(root.author), "Tai voi");
  assert.equal(getReplyAuthorName(reply, [root, reply]), "Tai voi");
  assert.equal(getCommentAuthorName({ ...root.author, username: "  " }), "Original name");
  assert.equal(getReplyAuthorName({ ...reply, parent_author: "Server nickname" }, [reply]), "Server nickname");
});

test("context actions preserve author permissions, one-level replies and deleted tombstones", () => {
  const root = comment("root", 1);
  assert.deepEqual(getCommentActions(root, "a"), ["heart", "reply", "edit", "delete"]);
  assert.deepEqual(getCommentActions(root, "partner"), ["heart", "reply"]);
  assert.deepEqual(getCommentActions(comment("reply", 2, "root"), "a"), ["heart", "edit", "delete"]);
  assert.deepEqual(getCommentActions({ ...root, deleted: true }, "a"), []);
});

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
