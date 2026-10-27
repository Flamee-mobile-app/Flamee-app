import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowImageSkeleton, shouldShowInitialSkeleton } from "./appSkeletonModel.ts";

test("initial skeleton only replaces an unresolved first read", () => {
  assert.equal(shouldShowInitialSkeleton({ pending: true, hasConfirmedContent: false }), true);
  assert.equal(shouldShowInitialSkeleton({ pending: true, hasConfirmedContent: true }), false);
  assert.equal(shouldShowInitialSkeleton({ pending: false, hasConfirmedContent: false }), false);
});

test("remote images keep a real preview instead of covering it with a skeleton", () => {
  assert.equal(shouldShowImageSkeleton({ loaded: false, hasPreview: false }), true);
  assert.equal(shouldShowImageSkeleton({ loaded: false, hasPreview: true }), false);
  assert.equal(shouldShowImageSkeleton({ loaded: true, hasPreview: false }), false);
});
