import assert from "node:assert/strict";
import test from "node:test";
import { checkInFeelingCatalog, resolveCheckInFeeling } from "./checkInFeelingCatalog.ts";

test("maps every check-in feeling to one bundled GIF emote", () => {
  assert.ok(checkInFeelingCatalog.every(({ pack }) => pack === "daily_emotions_gif"));
  assert.deepEqual(
    checkInFeelingCatalog.map(({ id, stickerId }) => [id, stickerId]),
    [
      ["tired", "tired"],
      ["discouraged", "discouraged"],
      ["happy", "happy"],
      ["energetic", "energetic"],
      ["unbothered", "unbothered"],
      ["broken_down", "broken_down"],
      ["sad", "sad"],
      ["awful", "awful"],
    ],
  );
  assert.equal(new Set(checkInFeelingCatalog.map(({ stickerId }) => stickerId)).size, checkInFeelingCatalog.length);
  assert.equal(resolveCheckInFeeling("energetic")?.stickerId, "energetic");
  assert.equal(resolveCheckInFeeling("missing"), null);
});
