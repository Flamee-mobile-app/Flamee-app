import { z } from "zod";
import { negativeFeedbackReasons } from "./types.ts";

export const nudgeFeedbackSchema = z.discriminatedUnion("value", [
  z.object({ value: z.literal("up") }),
  z.object({ value: z.literal("down"), reason: z.enum(negativeFeedbackReasons) }),
]);

export const nudgeSchema = z.object({
  id: z.string().min(1),
  coupleId: z.string().min(1),
  recipientId: z.string().min(1),
  sourceCheckInId: z.string().min(1),
  observation: z.string().max(120),
  actionType: z.enum(["text", "voice", "photo", "call", "other"]),
  draft: z.string().max(280),
  reason: z.string().max(100),
  tone: z.enum(["gentle", "playful", "supportive", "celebratory", "crisis_safe"]),
  source: z.enum(["template", "safety"]),
  status: z.enum(["new", "snoozed", "acted", "skipped", "expired"]),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  snoozeCount: z.number().int().min(0).max(1),
  linkedMomentId: z.string().min(1).nullable(),
  feedback: nudgeFeedbackSchema.nullable(),
});

export type NudgeFeedbackInput = z.infer<typeof nudgeFeedbackSchema>;
