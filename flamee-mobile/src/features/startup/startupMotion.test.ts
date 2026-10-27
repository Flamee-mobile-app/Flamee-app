import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { colors, startupTokens } from "../../shared/constants/tokens.ts";

test("keeps the complete startup motion within the approved 1.05 to 1.15 second budget", () => {
  const totalDuration = startupTokens.playbackDuration + startupTokens.exitDuration;

  assert.ok(totalDuration >= 1050);
  assert.ok(totalDuration <= 1150);
});

test("holds the completed brand long enough to register before handoff", () => {
  const holdDuration = (startupTokens.duration - startupTokens.taglineEnd)
    * startupTokens.playbackDuration / startupTokens.duration;

  assert.ok(holdDuration >= 120);
  assert.ok(holdDuration <= 170);
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

test("uses a solid light startup surface with restrained depth and readable foregrounds", () => {
  const background = readFileSync(join(process.cwd(), "src", "features", "startup", "components", "StartupBackground.tsx"), "utf8");

  assert.equal(startupTokens.background, "#F4F1EB");
  assert.equal(startupTokens.tagline, colors.textSecondary);
  assert.equal(startupTokens.amber, colors.accentText);
  assert.doesNotMatch(background, /LinearGradient|RadialGradient|<Stop/);
  assert.match(background, /Path/);
});
