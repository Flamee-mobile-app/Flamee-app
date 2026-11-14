import assert from "node:assert/strict";
import test from "node:test";
import { createProfileDraftCleanup } from "./profileDraftCleanup.ts";

test("restarting the edit effect preserves the visible avatar draft", async () => {
  const deleted: string[] = [];
  const cleanup = createProfileDraftCleanup(async (uri) => { deleted.push(uri); });
  cleanup.schedule("file:///visible-avatar.jpg");
  cleanup.cancel();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(deleted, []);
});

test("leaving the edit screen cleans the abandoned avatar draft", async () => {
  const deleted: string[] = [];
  const cleanup = createProfileDraftCleanup(async (uri) => { deleted.push(uri); });
  cleanup.schedule("file:///abandoned-avatar.jpg");
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(deleted, ["file:///abandoned-avatar.jpg"]);
});
