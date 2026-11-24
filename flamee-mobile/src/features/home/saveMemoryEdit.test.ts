import assert from "node:assert/strict";
import test from "node:test";
import { saveMemoryEdit, type MemoryEditCheckpoint } from "./saveMemoryEdit.ts";

const saved = { id: "post", title: "Updated", description: null, memory_date: "2026-11-16", location: null, images: [] };
test("replacement uploads before removing old photo, and retries reuse acknowledged stages and upload key", async () => {
  const calls: string[] = [];
  let fail = true;
  const checkpoint: MemoryEditCheckpoint = {};
  const input = { id: "post", payload: { title: "Updated", description: null }, photo: { uri: "file:///new.jpg", name: "memory.jpg", type: "image/jpeg" }, removeImageId: "old", requestKey: "stable-key", checkpoint };
  const api = {
    upload: async (_id: string, _file: unknown, key: string) => { calls.push(`upload:${key}`); return { id: "new", url: "https://example.test/new", thumbnail_url: "https://example.test/thumb" }; },
    removeImage: async () => { calls.push("remove:old"); }, detail: async () => saved,
    update: async () => { calls.push("update"); if (fail) throw new Error("offline"); return saved; },
  };
  await assert.rejects(saveMemoryEdit(input, api, () => true));
  fail = false;
  assert.deepEqual(await saveMemoryEdit(input, api, () => true), saved);
  assert.deepEqual(calls, ["upload:stable-key", "remove:old", "update", "update"]);
});
test("failed upload never deletes old photo and lost delete ack is checked before retry", async () => {
  let deletes = 0;
  const input = { id: "post", payload: { title: "Updated", description: null }, photo: new Blob(), removeImageId: "old", requestKey: "key", checkpoint: {} };
  const api = { upload: async (): Promise<never> => { throw new Error("upload"); }, removeImage: async () => { deletes++; throw new Error("timeout"); }, detail: async () => saved, update: async () => saved };
  await assert.rejects(saveMemoryEdit(input, api, () => true));
  assert.equal(deletes, 0);
  await saveMemoryEdit({ ...input, photo: null }, api, () => true);
  assert.equal(deletes, 1);
});
