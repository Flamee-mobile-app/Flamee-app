import assert from "node:assert/strict";
import test from "node:test";
import { emotionCheckInSchema } from "./schemas.ts";
import { emotionCatalog, resolveEmotionDefinition, resolveEmotionSelection } from "./emotionCatalog.ts";
import { mascotStickerCatalog, resolveMascotSticker } from "./mascotCatalog.ts";


test("validates catalog or custom emotion, trimmed note, and optional known mascot", () => {
  assert.ok(emotionCatalog.length > 5);
  assert.equal(resolveEmotionDefinition("calm")?.tone, "steady");
  assert.equal(resolveEmotionDefinition("missing"), null);
  assert.ok(mascotStickerCatalog.length >= 9);
  assert.equal(resolveMascotSticker("missing"), null);

  const known = emotionCheckInSchema.safeParse({
    emotionId: "calm",
    customEmotionLabel: null,
    note: "  Mình đang ổn hơn rồi.  ",
    mascotStickerId: mascotStickerCatalog[0]?.id ?? null,
  });
  assert.equal(known.success, true);
  if (known.success) assert.equal(known.data.note, "Mình đang ổn hơn rồi.");

  const custom = emotionCheckInSchema.safeParse({
    emotionId: "custom",
    customEmotionLabel: "  Nhớ nhà  ",
    note: "Một chút thôi",
    mascotStickerId: null,
  });
  assert.equal(custom.success, true);
  if (custom.success) assert.equal(custom.data.customEmotionLabel, "Nhớ nhà");

  assert.equal(emotionCheckInSchema.safeParse({ emotionId: "custom", customEmotionLabel: "   ", note: "Có note", mascotStickerId: null }).success, false);
  assert.equal(emotionCheckInSchema.safeParse({ emotionId: "calm", customEmotionLabel: null, note: "   ", mascotStickerId: null }).success, false);
  assert.equal(emotionCheckInSchema.safeParse({ emotionId: "calm", customEmotionLabel: null, note: "a".repeat(101), mascotStickerId: null }).success, false);
  assert.equal(emotionCheckInSchema.safeParse({ emotionId: "calm", customEmotionLabel: null, note: "Có note", mascotStickerId: "unknown" }).success, false);
});

test("normalizes catalog and custom emotion selections for every consumer", () => {
  assert.deepEqual(resolveEmotionSelection("calm", null), {
    emotionId: "calm",
    customEmotionLabel: null,
    emotionTone: "steady",
  });
  assert.deepEqual(resolveEmotionSelection("custom", "  Nhớ nhà  "), {
    emotionId: "custom",
    customEmotionLabel: "Nhớ nhà",
    emotionTone: "steady",
  });
  assert.equal(resolveEmotionSelection("missing", null), null);
  assert.equal(resolveEmotionSelection("custom", "   "), null);
});

