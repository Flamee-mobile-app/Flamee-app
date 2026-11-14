import assert from "node:assert/strict";
import test from "node:test";
import { publishMemoryPost, type MemoryPostCheckpoint } from "./publishMemoryPost.ts";

const record = { id: "memory-one", title: "A day", description: null, memory_date: "2026-10-18", location: null, images: [], created_by: "user-one" };
const input = { accountId: "user-one", requestKey: "post-key", payload: { title: "A day", category: "moment", memory_date: "2026-10-18" }, photo: { uri: "file:///photo.jpg", name: "memory.jpg", type: "image/jpeg" } };

test("publish creates the server record then uploads bytes with the same stable request key", async () => {
  const events: string[] = [];
  const result = await publishMemoryPost(input, {
    create: async (payload, key) => { assert.equal(payload, input.payload); assert.equal(key, "post-key"); events.push("create"); return record; },
    upload: async (id, file, key) => { assert.equal(id, record.id); assert.equal(file, input.photo); assert.equal(key, "post-key"); events.push("upload"); return { id: "image", url: "https://example.test/image.jpg", thumbnail_url: "https://example.test/thumb.jpg" }; },
  }, () => true, (stage) => events.push(stage));
  assert.deepEqual(events, ["creating", "create", "uploading", "upload"]);
  assert.deepEqual(result, { kind: "saved", id: record.id });
});

test("upload failures remain failures; retry reuses the original key", async () => {
  const keys: string[] = [];
  let fail = true;
  const dependencies = {
    create: async (_payload: unknown, key: string) => { keys.push(key); return record; },
    upload: async () => { if (fail) throw new Error("offline"); return { id: "image", url: "https://example.test/image.jpg", thumbnail_url: "https://example.test/thumb.jpg" }; },
  };
  await assert.rejects(publishMemoryPost(input, dependencies, () => true, () => undefined), /offline/);
  fail = false;
  assert.equal((await publishMemoryPost(input, dependencies, () => true, () => undefined)).kind, "saved");
  assert.deepEqual(keys, ["post-key", "post-key"]);
});

test("account/couple changes stop the upload and never report another account's result", async () => {
  let current = true;
  const result = await publishMemoryPost(input, {
    create: async () => { current = false; return record; },
    upload: async () => { assert.fail("must not upload after leaving scope"); },
  }, () => current, () => undefined);
  assert.deepEqual(result, { kind: "cancelled" });
});

test("a mismatched create acknowledgement cannot upload a photo", async () => {
  await assert.rejects(publishMemoryPost(input, {
    create: async () => ({ ...record, created_by: "another-user" }),
    upload: async () => { assert.fail("must not upload with an unrelated acknowledgement"); },
  }, () => true, () => undefined));
});

test("text-only memories complete after the create acknowledgement", async () => {
  const result = await publishMemoryPost({ ...input, photo: null }, {
    create: async () => record, upload: async () => { assert.fail("no photo selected"); },
  }, () => true, () => undefined);
  assert.deepEqual(result, { kind: "saved", id: record.id });
});

test("a completed upload from an ended account/couple scope cannot display success", async () => {
  let current = true;
  const result = await publishMemoryPost(input, {
    create: async () => record,
    upload: async () => { current = false; return { id: "image", url: "https://example.test/image.jpg", thumbnail_url: "https://example.test/thumb.jpg" }; },
  }, () => current, () => undefined);
  assert.deepEqual(result, { kind: "cancelled" });
});

test("retry resumes after the acknowledged create without repeating it", async () => {
  const checkpoint: MemoryPostCheckpoint = {};
  let creates = 0;
  let uploads = 0;
  const dependencies = {
    create: async () => { creates++; return record; },
    upload: async () => { if (++uploads === 1) throw new Error("offline"); return { id: "image", url: "https://example.test/image.jpg", thumbnail_url: "https://example.test/thumb.jpg" }; },
  };
  await assert.rejects(publishMemoryPost({ ...input, checkpoint }, dependencies, () => true, () => undefined), /offline/);
  assert.equal(checkpoint.created, record);
  assert.equal(checkpoint.uploaded, undefined);
  await publishMemoryPost({ ...input, checkpoint }, dependencies, () => true, () => undefined);
  await publishMemoryPost({ ...input, checkpoint }, dependencies, () => true, () => undefined);
  assert.equal(creates, 1);
  assert.equal(uploads, 2);
});

test("checkpoints reject another owner and ignore unrelated images on create", async () => {
  await assert.rejects(publishMemoryPost({ ...input, checkpoint: { created: { ...record, created_by: "other" } } }, {
    create: async () => { assert.fail("checkpoint exists"); }, upload: async () => { assert.fail("unrelated owner"); },
  }, () => true, () => undefined), (error) => error instanceof Error && error.message === "response");
  let uploads = 0;
  await publishMemoryPost({ ...input, checkpoint: {} }, {
    create: async () => ({ ...record, images: [{ id: "unrelated", url: "https://example.test/old.jpg", width: 1, height: 1 }] }),
    upload: async () => { uploads++; return { id: "image", url: "https://example.test/image.jpg", thumbnail_url: "https://example.test/thumb.jpg" }; },
  }, () => true, () => undefined);
  assert.equal(uploads, 1);
});

test("an upload checkpoint without a matching create acknowledgement is rejected", async () => {
  await assert.rejects(publishMemoryPost({ ...input, checkpoint: { uploaded: { id: "image", url: "https://example.test/image.jpg", thumbnail_url: "https://example.test/thumb.jpg" } } }, {
    create: async () => record, upload: async () => { assert.fail("invalid checkpoint"); },
  }, () => true, () => undefined), (error) => error instanceof Error && error.message === "response");
});

test("late acknowledgements do not mutate a checkpoint after its scope ends", async () => {
  const checkpoint: MemoryPostCheckpoint = {};
  let current = true;
  await publishMemoryPost({ ...input, checkpoint }, {
    create: async () => { current = false; return record; }, upload: async () => { assert.fail("scope ended"); },
  }, () => current, () => undefined);
  assert.deepEqual(checkpoint, {});
});
