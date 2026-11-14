import assert from "node:assert/strict";
import test from "node:test";
import { initialQuickMenuPresence, quickMenuPresenceReducer } from "./quickMenuPresence.ts";

test("closing keeps menu content mounted until its exit animation completes", () => {
  const open = quickMenuPresenceReducer(initialQuickMenuPresence, { type: "open" });
  const closing = quickMenuPresenceReducer(open, { type: "close" });
  assert.equal(closing.open, false);
  assert.equal(closing.mounted, true);
  assert.equal(quickMenuPresenceReducer(closing, { type: "closed", revision: closing.revision }).mounted, false);
});

test("a stale exit completion cannot unmount a reopened menu", () => {
  const closing = quickMenuPresenceReducer(quickMenuPresenceReducer(initialQuickMenuPresence, { type: "open" }), { type: "close" });
  const reopened = quickMenuPresenceReducer(closing, { type: "open" });
  assert.equal(quickMenuPresenceReducer(reopened, { type: "closed", revision: closing.revision }), reopened);
});

test("leaving a screen disposes the menu immediately and invalidates callbacks", () => {
  const closing = quickMenuPresenceReducer(quickMenuPresenceReducer(initialQuickMenuPresence, { type: "open" }), { type: "close" });
  const reset = quickMenuPresenceReducer(closing, { type: "reset" });
  assert.equal(reset.open, false);
  assert.equal(reset.mounted, false);
  assert.equal(quickMenuPresenceReducer(reset, { type: "closed", revision: closing.revision }), reset);
});
