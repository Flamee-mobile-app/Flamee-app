import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryPhotoDraft } from "./memoryPhotoDraft.ts";
import type { LocalMediaAdapter, LocalMediaResult } from "../media";

function media(selectPhoto: LocalMediaAdapter["selectPhoto"]) {
  const cleaned: string[] = [];
  const adapter = {
    selectPhoto,
    cleanup: async (uri) => { if (uri) cleaned.push(uri); },
  } satisfies Pick<LocalMediaAdapter, "selectPhoto" | "cleanup">;
  return { adapter, cleaned };
}

test("replacing a draft photo cleans only the old temporary photo; closing cleans the current one", async () => {
  let id = 0;
  const { adapter, cleaned } = media(async () => ({ kind: "selected", uri: `file:///draft-${++id}.jpg` }));
  const draft = createMemoryPhotoDraft(adapter);
  await draft.select();
  assert.deepEqual(cleaned, []);
  await draft.select();
  assert.deepEqual(cleaned, ["file:///draft-1.jpg"]);
  await draft.dispose();
  await draft.dispose();
  assert.deepEqual(cleaned, ["file:///draft-1.jpg", "file:///draft-2.jpg"]);
});

test("cancelled and denied picks do not destroy the selected draft photo", async () => {
  let result: LocalMediaResult = { kind: "selected", uri: "file:///selected.jpg" };
  const { adapter, cleaned } = media(async () => result);
  const draft = createMemoryPhotoDraft(adapter);
  await draft.select();
  for (const kind of ["cancelled", "denied", "unavailable"] as const) {
    result = { kind };
    assert.deepEqual(await draft.select(), result);
    assert.deepEqual(cleaned, []);
  }
  await draft.dispose();
  assert.deepEqual(cleaned, ["file:///selected.jpg"]);
});

test("a picker finishing after popup close cleans its file and cannot restore the draft", async () => {
  let release: (result: LocalMediaResult) => void = () => undefined;
  const { adapter, cleaned } = media(async () => new Promise((resolve) => { release = resolve; }));
  const draft = createMemoryPhotoDraft(adapter);
  const picking = draft.select();
  assert.equal(await draft.select(), null, "repeated taps must not open a second picker");
  await draft.dispose();
  release({ kind: "selected", uri: "file:///late.jpg" });
  assert.equal(await picking, null);
  assert.deepEqual(cleaned, ["file:///late.jpg"]);
  assert.equal(await draft.select(), null);
});

test("removing a photo releases it once and lets the user select another", async () => {
  let id = 0;
  const { adapter, cleaned } = media(async () => ({ kind: "selected", uri: `file:///photo-${++id}.jpg` }));
  const draft = createMemoryPhotoDraft(adapter);
  await draft.select();
  await draft.remove();
  await draft.remove();
  assert.deepEqual(cleaned, ["file:///photo-1.jpg"]);
  assert.deepEqual(await draft.select(), { kind: "selected", uri: "file:///photo-2.jpg" });
  await draft.dispose();
  assert.deepEqual(cleaned, ["file:///photo-1.jpg", "file:///photo-2.jpg"]);
});

test("removing during a pending replacement prevents its late result from restoring the photo", async () => {
  let release: (result: LocalMediaResult) => void = () => undefined;
  let first = true;
  const { adapter, cleaned } = media(async () => {
    if (first) { first = false; return { kind: "selected", uri: "file:///first.jpg" }; }
    return new Promise((resolve) => { release = resolve; });
  });
  const draft = createMemoryPhotoDraft(adapter);
  await draft.select();
  const pending = draft.select();
  await draft.remove();
  release({ kind: "selected", uri: "file:///late-replacement.jpg" });
  assert.equal(await pending, null);
  await draft.dispose();
  assert.deepEqual(cleaned, ["file:///first.jpg", "file:///late-replacement.jpg"]);
});

test("draft forwards early previews only while the picker revision is active", async () => {
  let preview: ((asset: { uri: string; width: number; height: number }) => void) | undefined;
  let release: (result: LocalMediaResult) => void = () => undefined;
  const { adapter, cleaned } = media(async (_source, options) => {
    assert.equal(options?.purpose, "memory");
    preview = options?.onPreview;
    return new Promise((resolve) => { release = resolve; });
  });
  const draft = createMemoryPhotoDraft(adapter);
  const previews: string[] = [];
  const pending = draft.select((asset) => previews.push(asset.uri));
  preview?.({ uri: "file:///original.jpg", width: 4000, height: 3000 });
  assert.deepEqual(previews, ["file:///original.jpg"]);
  await draft.dispose();
  preview?.({ uri: "file:///late-original.jpg", width: 4000, height: 3000 });
  release({ kind: "selected", uri: "file:///prepared.jpg" });
  assert.equal(await pending, null);
  assert.deepEqual(previews, ["file:///original.jpg"]);
  assert.deepEqual(cleaned, ["file:///prepared.jpg"]);
});
