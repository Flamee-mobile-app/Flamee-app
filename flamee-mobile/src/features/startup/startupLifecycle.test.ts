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

test("dismisses the splash after startup is ready even while the root entry route is resolving", () => {
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
  assert.equal(gate.canDismiss, true);
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
    animationComplete: 2450,
    revealReady: 350,
    dismissed: 650,
  });
  assert.deepEqual(resolveStartupLifecycleDelays(1360, true), {
    animationComplete: 0,
    revealReady: 0,
    dismissed: 0,
  });
});
