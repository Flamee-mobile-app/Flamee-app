import assert from "node:assert/strict";
import test from "node:test";
import { resolveSheetInteraction } from "./sheetInteractionModel.ts";

test("a pinned sheet uses native scrolling without scroll-to-drag handoff", () => {
  assert.deepEqual(resolveSheetInteraction(true, true), { pinned: true, nativeScroll: true, showHandle: false, dismissOnSnapToBottom: false });
});

test("a non-dismissible upload stays pinned while retaining an independently scrollable body", () => {
  assert.deepEqual(resolveSheetInteraction(false, false), { pinned: true, nativeScroll: true, showHandle: false, dismissOnSnapToBottom: false });
});

test("ordinary draggable sheets keep the original sheet gesture integration", () => {
  assert.deepEqual(resolveSheetInteraction(false, true), { pinned: false, nativeScroll: false, showHandle: true, dismissOnSnapToBottom: true });
});
