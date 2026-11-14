import assert from "node:assert/strict";
import test from "node:test";
import { getAppHeaderContentOffset } from "./appHeaderLayoutModel.ts";

test("feature title reserves a compact offset without the glass-header gap", () => {
  assert.equal(getAppHeaderContentOffset(false), 56);
});

test("Home keeps the approved glass-header offset", () => {
  assert.equal(getAppHeaderContentOffset(true), 86);
});
