import assert from "node:assert/strict";
import test from "node:test";
import { advanceHeaderScroll, type HeaderScrollState } from "./headerScrollModel.ts";

const initial: HeaderScrollState = { offset: 0, travel: 0, compact: false };

test("small scrolls keep the header open; sustained scrolling compacts it", () => {
  let state = initial;
  for (const offset of [8, 20, 38, 54, 72]) state = advanceHeaderScroll(state, offset, 600);
  assert.equal(state.compact, false);
  state = advanceHeaderScroll(state, 100, 600);
  assert.equal(state.compact, true);
});

test("small direction changes do not toggle the compact header", () => {
  let state = advanceHeaderScroll(initial, 140, 600);
  for (const offset of [134, 138, 130, 134]) state = advanceHeaderScroll(state, offset, 600);
  assert.equal(state.compact, true);
  state = advanceHeaderScroll(state, 80, 600);
  assert.equal(state.compact, false);
});

test("overscroll cannot compact short feeds or reopen the header at the bottom", () => {
  assert.equal(advanceHeaderScroll(initial, 120, 0).compact, false);
  let state = advanceHeaderScroll(initial, 600, 600);
  state = advanceHeaderScroll(state, 720, 600);
  state = advanceHeaderScroll(state, 600, 600);
  assert.equal(state.compact, true);
  assert.equal(advanceHeaderScroll(state, -40, 600).compact, false);
});
