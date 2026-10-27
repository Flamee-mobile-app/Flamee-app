import assert from "node:assert/strict";
import test from "node:test";
import { getSheetBodyCapacity } from "./sheetContentSizing.ts";

test("content-sized sheet reserves only header, footer and safe padding within its viewport cap", () => {
  const capacity = getSheetBodyCapacity({ viewportHeight: 800, topInset: 50, headerHeight: 44, footerHeight: 82, paddingVertical: 24, gap: 24 });
  assert.equal(capacity, 506);
});

test("body capacity stays independent of loaded image/content height to prevent a resize feedback loop", () => {
  const bounds = { viewportHeight: 800, topInset: 50, headerHeight: 44, footerHeight: 0, paddingVertical: 48, gap: 16 };
  assert.equal(getSheetBodyCapacity(bounds), 572);
  assert.equal(getSheetBodyCapacity({ ...bounds, viewportHeight: 400 }), 232);
  assert.equal(getSheetBodyCapacity({ ...bounds, viewportHeight: 100 }), 0);
});

test("keyboard occlusion reduces the body while reserving the close header and post footer", () => {
  assert.equal(getSheetBodyCapacity({ viewportHeight: 800, topInset: 50, headerHeight: 44, footerHeight: 82, paddingVertical: 24, gap: 24, keyboardHeight: 300 }), 276);
});
