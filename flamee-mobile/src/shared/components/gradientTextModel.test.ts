import assert from "node:assert/strict";
import test from "node:test";
import { getGradientTextLines } from "./gradientTextModel.ts";

test("gradient glyph baselines follow native text layout including Vietnamese multiline titles", () => {
  assert.deepEqual(getGradientTextLines([
    { text: "Gửi thông báo đến", x: 0, y: 0, ascender: 22, height: 28, width: 180 },
    { text: "đối phương", x: 0, y: 28, ascender: 22, height: 28, width: 110 },
  ]), [
    { text: "Gửi thông báo đến", x: 0, baseline: 22 },
    { text: "đối phương", x: 0, baseline: 50 },
  ]);
});

test("unmeasured, invalid or truncated text keeps its readable native fallback", () => {
  assert.equal(getGradientTextLines([], 1), null);
  assert.equal(getGradientTextLines([{ text: "Hello", x: 0, y: 0, ascender: NaN, height: 24, width: 30 }], 1), null);
  const line = { text: "Long title", x: 0, y: 0, ascender: 20, height: 24, width: 100 };
  assert.equal(getGradientTextLines([line, { ...line, y: 24 }], 1), null);
});

test("a capped iOS layout cannot replace the native ellipsis with clipped SVG text", () => {
  const capped = [{ text: "A long title whose glyphs were ellipsized", x: 0, y: 0, ascender: 20, height: 24, width: 100 }];
  assert.equal(getGradientTextLines(capped, 1), null);
});

test("accessibility scaling retains actual native SP text instead of a linear SVG approximation", () => {
  const scaled = [{ text: "Mood của chúng ta", x: 0, y: 0, ascender: 31, height: 40, width: 250 }];
  assert.equal(getGradientTextLines(scaled, undefined, 1.5), null);
});
