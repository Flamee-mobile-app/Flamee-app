import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { colors, startupTokens } from "../../shared/constants/tokens.ts";

test("keeps brand introduction and progress completion within 1.3 to 1.5 seconds", () => {
  const totalDuration = startupTokens.playbackDuration + startupTokens.loaderProgressDuration + startupTokens.exitDuration;

  assert.ok(totalDuration >= 1300);
  assert.ok(totalDuration <= 1500);
});

test("holds the completed brand long enough to register before handoff", () => {
  const holdDuration = startupTokens.playbackDuration - startupTokens.brandFadeDuration;

  assert.ok(holdDuration >= 700);
  assert.ok(holdDuration <= 900);
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

test("uses the mockup v2 warm cream and peach palette with readable foregrounds", () => {
  const background = readFileSync(join(process.cwd(), "src", "features", "startup", "components", "StartupBackground.tsx"), "utf8");

  assert.equal(startupTokens.background, "#FDF0E5");
  assert.equal(startupTokens.backgroundCenter, "#FFFAE7");
  assert.equal(startupTokens.backgroundPeach, "#FFDDC4");
  assert.equal(startupTokens.tagline, colors.textSecondary);
  assert.equal(startupTokens.amber, colors.accentText);
  assert.match(background, /RadialGradient/);
  assert.doesNotMatch(background, /Path/);
});
