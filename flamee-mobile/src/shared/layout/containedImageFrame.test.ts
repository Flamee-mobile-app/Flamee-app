import assert from "node:assert/strict";
import test from "node:test";
import { getContainedImageFrame } from "./containedImageFrame.ts";

test("portrait images fit the sheet body without making an unbounded tall scroll area", () => {
  assert.deepEqual(getContainedImageFrame(1536, 2048, 340, 240), { width: 180, height: 240 });
  assert.deepEqual(getContainedImageFrame(592, 1280, 340, 240), { width: 111, height: 240 });
});

test("landscape images use available width without cropping or enlarging beyond the height limit", () => {
  assert.deepEqual(getContainedImageFrame(1600, 900, 320, 250), { width: 320, height: 180 });
});

test("unmeasured or invalid image dimensions still produce a finite stable frame", () => {
  assert.deepEqual(getContainedImageFrame(undefined, undefined, 0, 180), { width: 0, height: 0 });
  assert.deepEqual(getContainedImageFrame(0, NaN, 300, 200), { width: 200, height: 200 });
});
