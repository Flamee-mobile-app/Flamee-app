import assert from "node:assert/strict";
import test from "node:test";
import { colors, startupTokens } from "../../shared/constants/tokens.ts";

test("keeps the complete startup motion within the 3.05 to 3.15 second budget", () => {
  const totalDuration = startupTokens.playbackDuration + startupTokens.exitDuration;

  assert.ok(totalDuration >= 3050);
  assert.ok(totalDuration <= 3150);
});

test("holds the completed brand long enough to register before handoff", () => {
  const holdDuration = (startupTokens.duration - startupTokens.taglineEnd)
    * startupTokens.playbackDuration / startupTokens.duration;

  assert.ok(holdDuration >= 350);
  assert.ok(holdDuration <= 450);
});

test("runs every startup phase in strict order without visual overlap", () => {
  assert.ok(startupTokens.connectionStart < startupTokens.connectionEnd);
  assert.ok(startupTokens.connectionEnd <= startupTokens.heartDrawStart);
  assert.ok(startupTokens.heartDrawStart < startupTokens.heartDrawEnd);
  assert.ok(startupTokens.heartDrawEnd <= startupTokens.flameStart);
  assert.ok(startupTokens.flameStart < startupTokens.flameEnd);
  assert.ok(startupTokens.flameEnd <= startupTokens.wordmarkStart);
  assert.ok(startupTokens.wordmarkStart < startupTokens.wordmarkEnd);
  assert.ok(startupTokens.wordmarkEnd <= startupTokens.taglineStart);
  assert.ok(startupTokens.taglineStart < startupTokens.taglineEnd);
});

test("moves directly from the completed outline heart to the logo reveal", () => {
  assert.ok(startupTokens.heartCompleteHold >= 160);
  assert.equal(
    startupTokens.flameStart,
    startupTokens.heartDrawEnd + startupTokens.heartCompleteHold,
  );
});

test("uses a dedicated dark startup surface instead of the light app background", () => {
  assert.notEqual(startupTokens.background, colors.background);
});
