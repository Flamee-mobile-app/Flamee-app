import assert from "node:assert/strict";
import test from "node:test";
import { createLocalMediaAdapter, type LocalMediaNative } from "./localMediaPreparation.ts";
import * as preparation from "./localMediaPreparation.ts";

function setup() {
  const events: string[] = [];
  const removed: string[] = [];
  const native: LocalMediaNative = {
    isAvailable: async () => true, requestPhotoPermission: async () => true,
    selectPhoto: async () => ({ uri: "file:///source.jpg", width: 4000, height: 3000 }),
    compressPhoto: async (_uri, edge) => { events.push(`encode:${edge}`); return { uri: "file:///prepared.jpg", width: edge, height: edge }; },
    getFileSize: async () => 1000, requestVoicePermission: async () => true,
    deleteFile: async (uri) => { removed.push(uri); },
  };
  return { native, events, removed };
}

test("preview arrives before preparation and avatar uses its own smaller edge", async () => {
  const { native, events, removed } = setup();
  const adapter = createLocalMediaAdapter({ native });
  const result = await adapter.selectPhoto("library", { purpose: "avatar", onPreview: (asset) => events.push(`preview:${asset.uri}`) });
  assert.deepEqual(events, ["preview:file:///source.jpg", "encode:512"]);
  assert.equal(result.kind, "selected");
  await adapter.cleanup("file:///source.jpg");
  assert.deepEqual(removed, []);
  await adapter.cleanup("file:///prepared.jpg");
  assert.deepEqual(removed, ["file:///prepared.jpg"]);
});

test("memory keeps 1600 preparation and cleans a rejected first encode", async () => {
  const { native, events, removed } = setup();
  let attempt = 0;
  native.compressPhoto = async (_uri, edge, quality) => { events.push(`${edge}:${quality}`); return { uri: `file:///pass-${++attempt}.jpg`, width: edge, height: edge }; };
  native.getFileSize = async () => attempt === 1 ? 3 * 1024 * 1024 : 1000;
  const adapter = createLocalMediaAdapter({ native });
  assert.equal((await adapter.selectPhoto("library")).kind, "selected");
  assert.deepEqual(events, ["1600:0.8", "1600:0.55"]);
  assert.deepEqual(removed, ["file:///pass-1.jpg"]);
});

test("a native result aliasing the picker source is never owned or deleted", async () => {
  const { native, removed } = setup();
  native.compressPhoto = async () => ({ uri: "file:///source.jpg", width: 512, height: 512 });
  const adapter = createLocalMediaAdapter({ native });
  await adapter.selectPhoto("library", { purpose: "avatar" });
  await adapter.cleanup("file:///source.jpg");
  assert.deepEqual(removed, []);
});

test("avatar crops before resize to retain 512 pixels even for a panoramic source", () => {
  assert.deepEqual(preparation.getPhotoTransforms?.(4000, 1000, 512, "avatar"), [
    { crop: { originX: 1500, originY: 0, width: 1000, height: 1000 } }, { resize: { width: 512 } },
  ]);
  assert.deepEqual(preparation.getPhotoTransforms?.(4000, 1000, 1600, "memory"), [{ resize: { width: 1600 } }]);
});

test("a failed size lookup deletes its newly transformed output exactly once, never the source", async () => {
  const { native, removed } = setup();
  native.getFileSize = async () => { throw new Error("file metadata unavailable"); };
  const adapter = createLocalMediaAdapter({ native });
  assert.deepEqual(await adapter.selectPhoto("library"), { kind: "unavailable" });
  assert.deepEqual(removed, ["file:///prepared.jpg"]);
  await adapter.cleanup("file:///prepared.jpg");
  await adapter.cleanup("file:///source.jpg");
  assert.deepEqual(removed, ["file:///prepared.jpg"]);
});
