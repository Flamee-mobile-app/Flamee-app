import assert from "node:assert/strict";
import test from "node:test";
import { getAnchoredPopupLayout } from "./anchoredPopupModel.ts";

const viewport = { width: 390, height: 844, top: 47, bottom: 34, left: 0, right: 0 };
test("anchored menu stays beside its target and flips above a low comment", () => {
  const below = getAnchoredPopupLayout({ x: 20, y: 100, width: 350, height: 80 }, viewport, 240);
  assert.equal(below.top, 188);
  const above = getAnchoredPopupLayout({ x: 20, y: 650, width: 350, height: 80 }, viewport, 240);
  assert.equal(above.top, 402);
  assert.ok(above.left >= 16 && above.left + above.width <= 374);
});
test("menu clamps long content inside safe areas and the keyboard viewport", () => {
  const small = { ...viewport, height: 420 };
  const layout = getAnchoredPopupLayout({ x: -5, y: 380, width: 100, height: 60 }, small, 600);
  assert.ok(layout.top >= 55);
  assert.ok(layout.top + layout.maxHeight <= 378);
  assert.ok(layout.left >= 16);
});
