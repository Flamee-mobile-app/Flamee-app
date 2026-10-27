import assert from "node:assert/strict";
import test from "node:test";
import { homeOverlayReducer, initialHomeOverlay } from "./homeOverlayModel.ts";

test("closing retains the selected private content until the matching sheet exit completes", () => {
  const opened = homeOverlayReducer(initialHomeOverlay, { type: "show", selection: { kind: "details", id: "memory-one" } });
  const closing = homeOverlayReducer(opened, { type: "close" });
  assert.equal(closing.open, false);
  assert.deepEqual(closing.selection, opened.selection);
  const closed = homeOverlayReducer(closing, { type: "exited", revision: closing.revision });
  assert.equal(closed.selection, null);
});

test("a late exit cannot dispose a reopened or replaced sheet", () => {
  const first = homeOverlayReducer(initialHomeOverlay, { type: "show", selection: { kind: "create" } });
  const closing = homeOverlayReducer(first, { type: "close" });
  const second = homeOverlayReducer(closing, { type: "show", selection: { kind: "notifications" } });
  assert.deepEqual(homeOverlayReducer(second, { type: "exited", revision: first.revision }), second);
  assert.deepEqual(homeOverlayReducer(second, { type: "exited", revision: second.revision }), second);
});

test("scope or focus reset drops private selection immediately without waiting for an exit", () => {
  const opened = homeOverlayReducer(initialHomeOverlay, { type: "show", selection: { kind: "day", day: "2026-10-19" } });
  assert.equal(homeOverlayReducer(opened, { type: "reset" }).selection, null);
});
