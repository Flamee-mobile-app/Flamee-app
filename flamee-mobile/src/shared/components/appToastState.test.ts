import assert from "node:assert/strict";
import test from "node:test";
import { createAppToastState } from "./appToastState.ts";

function clock() {
  let now = 0;
  let id = 0;
  const tasks = new Map<number, { at: number; run: () => void }>();
  return {
    now: () => now,
    setTimeout: (run: () => void, delay: number) => { tasks.set(++id, { at: now + delay, run }); return id; },
    clearTimeout: (key: unknown) => { tasks.delete(key as number); },
    advance(ms: number) {
      const end = now + ms;
      while (true) {
        const next = [...tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at; tasks.delete(next[0]); next[1].run();
      }
      now = end;
    },
  };
}

test("a late result cannot replace a newer operation, even after its loading toast is dismissed", () => {
  const state = createAppToastState(3000);
  const first = state.begin();
  const second = state.begin();
  state.show("loading", "Second", { operationId: second });
  state.show("success", "Old result", { operationId: first });
  assert.equal(state.getSnapshot()?.title, "Second");
  state.show("success", "Confirmed", { operationId: second });
  assert.equal(state.getSnapshot()?.title, "Confirmed");
});

test("route changes dismiss loading and invalidate late results, but preserve a confirmed result", () => {
  const state = createAppToastState(3000);
  const id = state.begin();
  state.show("loading", "Saving", { operationId: id });
  state.changeRoute();
  assert.equal(state.getSnapshot()?.open, false);
  state.show("success", "Stale", { operationId: id });
  assert.notEqual(state.getSnapshot()?.title, "Stale");
  state.show("success", "Saved");
  state.changeRoute();
  assert.equal(state.getSnapshot()?.open, true);
  state.reset();
  assert.equal(state.getSnapshot(), null);
});

test("foreground display time pauses in background and new results get their full reading time", () => {
  const time = clock();
  const state = createAppToastState(3000, time);
  state.setActive(true);
  state.show("success", "Saved");
  time.advance(1000); state.setActive(false); time.advance(10000);
  assert.equal(state.getSnapshot()?.open, true);
  state.setActive(true); time.advance(1999);
  assert.equal(state.getSnapshot()?.open, true);
  time.advance(1); assert.equal(state.getSnapshot()?.open, false);
  state.setActive(false); state.show("error", "Offline"); time.advance(10000);
  state.setActive(true); time.advance(2999);
  assert.equal(state.getSnapshot()?.open, true);
  time.advance(1); assert.equal(state.getSnapshot()?.open, false);
});

test("stalled loading becomes an uncertain warning, never a fabricated failure or success", () => {
  const time = clock();
  const state = createAppToastState(3000, { ...time, loadingTimeout: 45000 });
  state.setActive(true);
  const operationId = state.begin();
  state.show("loading", "Saving", { operationId });
  time.advance(45000);
  assert.equal(state.getSnapshot()?.tone, "warning");
  assert.equal(state.getSnapshot()?.open, true);
  state.show("success", "Server confirmed", { operationId });
  time.advance(3000);
  assert.equal(state.getSnapshot()?.title, "Server confirmed");
  assert.equal(state.getSnapshot()?.open, false);
});

test("invalid durations cannot strand a result toast and reset revokes old operation handles", () => {
  const time = clock();
  const state = createAppToastState(3000, time);
  state.setActive(true);
  for (const duration of [Infinity, NaN, -1, 0]) {
    state.show("info", "Notice", { duration }); time.advance(3000);
    assert.equal(state.getSnapshot()?.open, false);
  }
  const operationId = state.begin(); state.reset();
  state.show("error", "Old account result", { operationId });
  assert.equal(state.getSnapshot(), null);
});

test("hover/focus pause cannot resume the clock while the app is in background", () => {
  const time = clock();
  const state = createAppToastState(3000, time);
  state.setActive(true); state.show("info", "Readable"); time.advance(1000);
  state.setPaused(true); time.advance(10000); state.setActive(false);
  state.setPaused(false); time.advance(10000);
  assert.equal(state.getSnapshot()?.open, true);
  state.setActive(true); time.advance(1999);
  assert.equal(state.getSnapshot()?.open, true);
  time.advance(1); assert.equal(state.getSnapshot()?.open, false);
});

test("exit cleanup removes the overlay deterministically and cannot remove a replacement toast", () => {
  const time = clock();
  const state = createAppToastState(3000, { ...time, exitDuration: 180 });
  state.show("loading", "Pending"); state.dismiss();
  time.advance(179); assert.equal(state.getSnapshot()?.open, false);
  time.advance(1); assert.equal(state.getSnapshot(), null);
  const old = state.show("info", "Old"); state.dismiss(old); time.advance(100);
  state.show("success", "New"); time.advance(100);
  assert.equal(state.getSnapshot()?.title, "New");
  assert.equal(state.getSnapshot()?.open, true);
});

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

test("a notification retains its locale for accessible labels", () => {
  const state = createAppToastState(3000);
  state.show("success", "Saved", { locale: "en" });
  assert.equal(state.getSnapshot()?.locale, "en");
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
