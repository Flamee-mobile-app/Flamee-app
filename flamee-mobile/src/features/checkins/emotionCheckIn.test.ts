import assert from "node:assert/strict";
import test from "node:test";
import { createLocalCoupleService } from "../couple/localCoupleService.ts";
import { emotionCheckInSchema } from "./schemas.ts";
import { createLocalCheckInService } from "./localCheckInService.ts";
import { emotionCatalog, resolveEmotionDefinition, resolveEmotionSelection } from "./emotionCatalog.ts";
import { mascotStickerCatalog, resolveMascotSticker } from "./mascotCatalog.ts";
import type { LegacyLocalCheckIn } from "./types.ts";

const now = new Date("2026-10-14T08:00:00.000Z");

async function pairedCouple() {
  const coupleService = createLocalCoupleService({ createId: () => "couple-1", now: () => now });
  await coupleService.beginWaiting("account-a", "invite-1", "2026-10-15T08:00:00.000Z", {
    id: "account-a",
    displayName: "An",
    nickname: "",
    avatarUri: null,
    timezone: "UTC",
  });
  await coupleService.acceptInvite({
    inviteId: "invite-1",
    inviterId: "account-a",
    inviteeId: "account-b",
    inviter: { id: "account-a", displayName: "An", nickname: "", avatarUri: null, timezone: "UTC" },
    invitee: { id: "account-b", displayName: "Bình", nickname: "", avatarUri: null, timezone: "UTC" },
  });
  return coupleService;
}

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

test("captures the active couple and exposes only the current partner note", async () => {
  const coupleService = await pairedCouple();
  let id = 0;
  const service = createLocalCheckInService({
    coupleService,
    createId: () => `check-in-${++id}`,
    now: () => now,
    timezoneForAccount: () => "UTC",
  });

  const result = await service.submit("account-a", {
    emotionId: "calm",
    customEmotionLabel: null,
    note: "  Hôm nay mình bình yên.  ",
    mascotStickerId: "mascot-calm",
  });
  assert.notEqual(result.kind, "error");
  if (result.kind === "error") return;
  assert.equal(result.checkIn.kind, "emotion");
  assert.equal(result.checkIn.coupleId, "couple-1");
  assert.equal(result.checkIn.note, "Hôm nay mình bình yên.");

  const visible = await service.getLatestPartnerCheckIn("account-b");
  assert.deepEqual(visible, {
    kind: "emotion",
    id: result.checkIn.id,
    authorId: "account-a",
    emotionId: "calm",
    customEmotionLabel: null,
    emotionTone: "steady",
    note: "Hôm nay mình bình yên.",
    mascotStickerId: "mascot-calm",
    createdAt: now.toISOString(),
    localDate: "2026-10-14",
  });
  assert.deepEqual(await service.getByIdForAccount("account-b", result.checkIn.id), visible);
  assert.equal(await service.getByIdForAccount("account-outsider", result.checkIn.id), null);
});

test("keeps an unpaired note personal even after a later pairing", async () => {
  const coupleService = createLocalCoupleService({ createId: () => "couple-1", now: () => now });
  const service = createLocalCheckInService({
    coupleService,
    createId: (() => { let id = 0; return () => `personal-${++id}`; })(),
    now: () => now,
    timezoneForAccount: () => "UTC",
  });
  const saved = await service.submit("account-a", {
    emotionId: "custom",
    customEmotionLabel: "Bâng khuâng",
    note: "Một note của riêng mình",
    mascotStickerId: null,
  });
  assert.notEqual(saved.kind, "error");
  if (saved.kind === "error") return;
  assert.equal(saved.checkIn.coupleId, null);

  await coupleService.beginWaiting("account-a", "invite-1", "2026-10-15T08:00:00.000Z", {
    id: "account-a", displayName: "An", nickname: "", avatarUri: null, timezone: "UTC",
  });
  await coupleService.acceptInvite({
    inviteId: "invite-1",
    inviterId: "account-a",
    inviteeId: "account-b",
    inviter: { id: "account-a", displayName: "An", nickname: "", avatarUri: null, timezone: "UTC" },
    invitee: { id: "account-b", displayName: "Bình", nickname: "", avatarUri: null, timezone: "UTC" },
  });

  assert.equal(await service.getLatestPartnerCheckIn("account-b"), null);
  assert.equal(await service.getByIdForAccount("account-b", saved.checkIn.id), null);
});

test("preserves legacy private and mood-only redaction", async () => {
  const coupleService = await pairedCouple();
  const legacyBase = {
    clientId: "client",
    authorId: "account-a",
    coupleId: "couple-1",
    mood: 2 as const,
    reasonIds: ["stress"],
    note: "Không được lộ",
    createdAt: now.toISOString(),
    localDate: "2026-10-14",
    storageStatus: "saved_local" as const,
  };
  const privateRecord: LegacyLocalCheckIn = { ...legacyBase, id: "legacy-private", shareScope: "private_only" };
  const moodOnlyRecord: LegacyLocalCheckIn = { ...legacyBase, id: "legacy-mood", shareScope: "mood_only" };
  const service = createLocalCheckInService({
    coupleService,
    now: () => now,
    timezoneForAccount: () => "UTC",
    initialCheckIns: [privateRecord, moodOnlyRecord],
  });

  const visible = await service.getLatestPartnerCheckIn("account-b");
  assert.deepEqual(visible, {
    kind: "legacy",
    id: "legacy-mood",
    authorId: "account-a",
    mood: 2,
    shareScope: "mood_only",
    createdAt: now.toISOString(),
    localDate: "2026-10-14",
  });
  assert.equal(await service.getByIdForAccount("account-b", "legacy-private"), null);
});
