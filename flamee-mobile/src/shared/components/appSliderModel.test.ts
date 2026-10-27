import assert from "node:assert/strict";
import test from "node:test";
import { getAppSliderCommittedValue, getAppSliderContinuousStep, getAppSliderThumbPresentation, getAppSliderTrackInset, getAppSliderVisualValue, shouldCommitAppSliderValue } from "./appSliderModel.ts";
import { colors, sliderTokens } from "../constants/tokens.ts";

test("keeps an unanswered slider empty while positioning its thumb at the lower bound", () => {
  assert.equal(getAppSliderVisualValue(null, 2), 2);
  assert.equal(getAppSliderVisualValue(5, 2), 5);
});

test("aligns track endpoints with Tamagui thumb travel", () => {
  assert.equal(getAppSliderTrackInset(32), 16);
});

test("keeps slider travel clear of the iOS edge-swipe zone and exposes a thick track", () => {
  assert.equal(sliderTokens.edgeInset, 24);
  assert.ok(sliderTokens.targetHeight >= 44);
  assert.ok(sliderTokens.trackHeight >= 6);
  assert.equal(sliderTokens.thumbSize, 32);
  assert.equal(getAppSliderTrackInset(sliderTokens.thumbSize), 16);
});

test("starts neutral and switches to the readable brand surface after a selection", () => {
  assert.deepEqual(getAppSliderThumbPresentation(false), { backgroundColor: "$border", borderColor: "$textSecondary", valueColor: colors.textSecondary });
  assert.deepEqual(getAppSliderThumbPresentation(true), { backgroundColor: "$primary", borderColor: "$primary", valueColor: colors.white });
});

test("moves continuously while dragging and commits a contract step on release", () => {
  assert.ok(getAppSliderContinuousStep(1, 5) <= 0.05);
  assert.ok(getAppSliderContinuousStep(2, 8) <= 0.05);
  assert.equal(getAppSliderCommittedValue(3.7, 1, 1), 4);
  assert.equal(getAppSliderCommittedValue(7.9, 2, 1), 8);
});

test("defers draft commits until a pointer drag ends", () => {
  assert.equal(shouldCommitAppSliderValue(true), false);
  assert.equal(shouldCommitAppSliderValue(false), true);
});
