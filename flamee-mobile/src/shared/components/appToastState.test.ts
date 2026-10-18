import assert from "node:assert/strict";
import test from "node:test";
import { createAppToastState } from "./appToastState.ts";

test("a new notification replaces the old one and cannot be dismissed by its old lifecycle", () => {
  const state = createAppToastState(3000);
  const loading = state.show("loading", "Uploading");
  const success = state.show("success", "Saved");
  state.dismiss(loading);
  assert.equal(state.getSnapshot()?.id, success);
  assert.equal(state.getSnapshot()?.open, true);
  state.dismiss(success);
  assert.equal(state.getSnapshot()?.open, false);
});

test("loading follows its operation while result notifications use the configured duration", () => {
  const state = createAppToastState(3000);
  state.show("loading", "Connecting");
  assert.equal(state.getSnapshot()?.duration, Infinity);
  state.show("error", "Try again", { description: "Connection unavailable" });
  assert.equal(state.getSnapshot()?.duration, 3000);
  assert.equal(state.getSnapshot()?.description, "Connection unavailable");
});

test("dismissal retains the record for exit motion and notifies subscribers once", () => {
  const state = createAppToastState(3000);
  let changes = 0;
  const unsubscribe = state.subscribe(() => { changes += 1; });
  const id = state.show("info", "Updated");
  state.dismiss(id);
  state.dismiss(id);
  assert.equal(changes, 2);
  assert.equal(state.getSnapshot()?.title, "Updated");
  unsubscribe();
  state.show("warning", "Check your connection");
  assert.equal(changes, 2);
});
