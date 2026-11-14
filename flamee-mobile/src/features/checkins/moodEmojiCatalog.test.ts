import assert from "node:assert/strict";
import test from "node:test";
import { resolveMoodEmojiDefinition } from "./moodEmojiCatalog.ts";

test("keeps the Mood calendar on its original OpenMoji catalog", () => {
  assert.deepEqual(
    ["happy", "loved", "hopeful", "calm", "uncertain", "tired", "sad", "overwhelmed"].map((id) => resolveMoodEmojiDefinition(id).emojiId),
    ["happy", "loved", "hopeful", "calm", "uncertain", "tired", "sad", "overwhelmed"],
  );
  assert.equal(resolveMoodEmojiDefinition("missing").emojiId, "neutral");
});
