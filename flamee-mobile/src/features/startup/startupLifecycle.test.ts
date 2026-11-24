import assert from "node:assert/strict";
import test from "node:test";
import * as startupLifecycle from "./startupLifecycle.ts";
import { resolveStartupGate } from "./startupLifecycle.ts";

test("prepares the custom splash only after layout and startup assets are ready", () => {
  const resolveStartupPrepared = (startupLifecycle as typeof startupLifecycle & {
    resolveStartupPrepared?: (state: { laidOut: boolean; assetsReady: boolean }) => boolean;
  }).resolveStartupPrepared;

  assert.equal(resolveStartupPrepared?.({ laidOut: true, assetsReady: false }), false);
  assert.equal(resolveStartupPrepared?.({ laidOut: false, assetsReady: true }), false);
  assert.equal(resolveStartupPrepared?.({ laidOut: true, assetsReady: true }), true);
});

test("reveals the destination only after the splash handoff reaches its reveal point", () => {
  const readiness = {
    prepared: true,
    animationComplete: true,
    sessionReady: true,
    isEntryRoute: false,
    entryFailed: false,
  };

  const beforeRevealPoint = resolveStartupGate({
    ...readiness,
    overlayVisible: true,
    contentRevealReady: false,
  });
  const duringLateHandoff = resolveStartupGate({
    ...readiness,
    overlayVisible: true,
    contentRevealReady: true,
  });
  const afterSplashIsDismissed = resolveStartupGate({
    ...readiness,
    overlayVisible: false,
    contentRevealReady: true,
  });

  assert.equal(beforeRevealPoint.canDismiss, true);
  assert.equal(beforeRevealPoint.canReveal, false);
  assert.equal(duringLateHandoff.canReveal, true);
  assert.equal(afterSplashIsDismissed.canReveal, true);
});

test("keeps the loader while the entry route is resolving, without blocking navigation", () => {
  const gate = resolveStartupGate({
    prepared: true,
    animationComplete: true,
    sessionReady: true,
    isEntryRoute: true,
    entryFailed: false,
    overlayVisible: true,
    contentRevealReady: false,
  });

  assert.equal(gate.canNavigate, true);
  assert.equal(gate.canDismiss, false);
});

test("exposes startup recovery instead of trapping errors behind the loader", () => {
  const gate = resolveStartupGate({ prepared: true, animationComplete: true, sessionReady: true,
    isEntryRoute: true, entryFailed: true, overlayVisible: true, contentRevealReady: false });
  assert.equal(gate.canDismiss, true);
});

test("progress stays below completion until startup can hand off to its destination", () => {
  const progress = (startupLifecycle as typeof startupLifecycle & {
    resolveStartupProgress?: (state: { prepared: boolean; sessionReady: boolean; destinationReady: boolean; canDismiss: boolean }) => number;
  }).resolveStartupProgress;
  assert.ok(progress);
  const state = { prepared: false, sessionReady: false, destinationReady: false, canDismiss: false };
  assert.equal(progress(state), 0);
  assert.equal(progress({ ...state, prepared: true }), 0.3);
  assert.equal(progress({ ...state, prepared: true, sessionReady: true }), 0.7);
  assert.equal(progress({ ...state, prepared: true, sessionReady: true, destinationReady: true }), 0.9);
  assert.equal(progress({ ...state, prepared: true, sessionReady: true, destinationReady: true, canDismiss: true }), 1);
});

test("provides lifecycle deadlines independent from animation-driver callbacks", () => {
  const resolveStartupLifecycleDelays = (startupLifecycle as typeof startupLifecycle & {
    resolveStartupLifecycleDelays?: (elapsed: number, reducedMotion: boolean) => {
      animationComplete: number;
      revealReady: number;
      dismissed: number;
    };
  }).resolveStartupLifecycleDelays;

  assert.ok(resolveStartupLifecycleDelays);
  assert.deepEqual(resolveStartupLifecycleDelays(0, false), {
    animationComplete: 1000,
    revealReady: 80,
    dismissed: 200,
  });
  assert.deepEqual(resolveStartupLifecycleDelays(1360, true), {
    animationComplete: 0,
    revealReady: 0,
    dismissed: 0,
  });
});

test("waits for session restore before deciding whether to play the brand animation", () => {
  const decide = (startupLifecycle as typeof startupLifecycle & {
    resolveStartupPresentation?: (state: { sessionReady: boolean; hasSession: boolean; seen: boolean | null }) => string;
  }).resolveStartupPresentation;
  assert.ok(decide);
  assert.equal(decide({ sessionReady: false, hasSession: false, seen: false }), "pending");
  assert.equal(decide({ sessionReady: true, hasSession: true, seen: null }), "skip");
  assert.equal(decide({ sessionReady: true, hasSession: false, seen: true }), "skip");
  assert.equal(decide({ sessionReady: true, hasSession: false, seen: null }), "pending");
  assert.equal(decide({ sessionReady: true, hasSession: false, seen: false }), "play");
});
