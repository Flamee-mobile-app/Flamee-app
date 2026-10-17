import assert from "node:assert/strict";
import test from "node:test";
import { createLocalNudgeService } from "./localNudgeService.ts";
import type { EmotionCheckIn, LegacyLocalCheckIn } from "../checkins/types.ts";

const now = new Date("2026-10-14T08:00:00.000Z");

function emotionCheckIn(overrides: Partial<EmotionCheckIn> = {}): EmotionCheckIn {
  return {
    kind: "emotion",
    id: "check-in-1",
    authorId: "account-a",
    coupleId: "couple-1",
    emotionId: "calm",
    customEmotionLabel: null,
    emotionTone: "steady",
    note: "Nội dung riêng không dành cho template",
    mascotStickerId: "mascot-calm",
    createdAt: now.toISOString(),
    localDate: "2026-10-14",
    status: "saved_local",
    ...overrides,
  };
}

test("creates a nudge from emotion tone without exposing the note to templates", async () => {
  let received: Record<string, unknown> | null = null;
  const service = createLocalNudgeService({
    now: () => now,
    createId: () => "nudge-1",
    templateProvider: (input) => {
      received = input.sourceCheckIn as unknown as Record<string, unknown>;
      return {
        observation: "Một nhịp nhẹ cho người ấy.",
        actionType: "text",
        draft: "Mình ở đây nè.",
        reason: "Một lời nhắn vừa đủ.",
        tone: input.sourceCheckIn.kind === "emotion" && input.sourceCheckIn.emotionTone === "steady" ? "gentle" : "supportive",
      };
    },
  });

  const result = await service.createForSharedCheckIn({
    sourceCheckIn: emotionCheckIn(),
    recipientId: "account-b",
    recipientTimezone: "UTC",
    coupleId: "couple-1",
  });

  assert.equal(result.kind, "created");
  assert.deepEqual(received, { kind: "emotion", id: "check-in-1", emotionTone: "steady" });
  assert.equal(received && "note" in received, false);
});

test("uses the neutral steady tone carried by a custom emotion", async () => {
  let tone = "";
  const service = createLocalNudgeService({
    now: () => now,
    templateProvider: (input) => {
      tone = input.sourceCheckIn.kind === "emotion" ? input.sourceCheckIn.emotionTone : "legacy";
      return { observation: "O", actionType: "text", draft: "D", reason: "R", tone: "gentle" };
    },
  });
  await service.createForSharedCheckIn({
    sourceCheckIn: emotionCheckIn({ emotionId: "custom", customEmotionLabel: "Bâng khuâng", emotionTone: "steady" }),
    recipientId: "account-b",
    recipientTimezone: "UTC",
    coupleId: "couple-1",
  });
  assert.equal(tone, "steady");
});

test("suppresses unpaired, stale-couple, and legacy private records", async () => {
  const service = createLocalNudgeService({ now: () => now });
  const unpaired = await service.createForSharedCheckIn({
    sourceCheckIn: emotionCheckIn({ coupleId: null }),
    recipientId: "account-b",
    recipientTimezone: "UTC",
    coupleId: "couple-1",
  });
  assert.deepEqual(unpaired, { kind: "suppressed", reason: "stale_couple" });

  const legacy: LegacyLocalCheckIn = {
    id: "legacy-private",
    clientId: "client-1",
    authorId: "account-a",
    coupleId: "couple-1",
    mood: 2,
    reasonIds: ["stress"],
    note: "Không được lộ",
    shareScope: "private_only",
    createdAt: now.toISOString(),
    localDate: "2026-10-14",
    storageStatus: "saved_local",
  };
  const privateResult = await service.createForSharedCheckIn({
    sourceCheckIn: legacy,
    recipientId: "account-b",
    recipientTimezone: "UTC",
    coupleId: "couple-1",
  });
  assert.deepEqual(privateResult, { kind: "suppressed", reason: "private_only" });
});

test("default local templates change support tone without reading note text", async () => {
  const heavyService = createLocalNudgeService({ now: () => now, createId: () => "heavy-nudge" });
  const brightService = createLocalNudgeService({ now: () => now, createId: () => "bright-nudge" });
  const heavy = await heavyService.createForSharedCheckIn({
    sourceCheckIn: emotionCheckIn({ id: "heavy", emotionId: "overwhelmed", emotionTone: "heavy", note: "SECRET_HEAVY" }),
    recipientId: "account-b",
    recipientTimezone: "UTC",
    coupleId: "couple-1",
  });
  const bright = await brightService.createForSharedCheckIn({
    sourceCheckIn: emotionCheckIn({ id: "bright", emotionId: "happy", emotionTone: "bright", note: "SECRET_BRIGHT" }),
    recipientId: "account-b",
    recipientTimezone: "UTC",
    coupleId: "couple-1",
  });
  assert.equal(heavy.kind, "created");
  assert.equal(bright.kind, "created");
  if (heavy.kind !== "created" || bright.kind !== "created") return;
  assert.equal(heavy.nudge.tone, "supportive");
  assert.equal(bright.nudge.tone, "celebratory");
  assert.notEqual(heavy.nudge.draft, bright.nudge.draft);
  assert.equal(JSON.stringify([heavy.nudge, bright.nudge]).includes("SECRET_"), false);
});
