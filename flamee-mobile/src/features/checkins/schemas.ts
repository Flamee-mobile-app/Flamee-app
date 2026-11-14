import { z } from "zod";
import { getMessage } from "../../shared/localization/messages.ts";
import { localCheckInReasons } from "./types.ts";
import { emotionCatalog } from "./emotionCatalog.ts";
import { mascotStickerCatalog } from "./mascotCatalog.ts";

export function createCheckInSchema(allowedReasonIds: readonly string[]) {
  const allowed = new Set(allowedReasonIds);
  return z.object({
    mood: z.number().int().min(1).max(5),
    reasonIds: z
      .array(z.string())
      .max(3, getMessage("vi", "maxThreeReasons"))
      .refine((ids) => new Set(ids).size === ids.length, getMessage("vi", "checkInDuplicateReason"))
      .refine((ids) => ids.every((id) => allowed.has(id)), getMessage("vi", "reasonCatalogChanged")),
    note: z.string().trim().max(140, getMessage("vi", "noteTooLong")),
    shareScope: z.enum(["full", "mood_only", "private_only"]),
  });
}

export const checkInSchema = createCheckInSchema(localCheckInReasons.map((reason) => reason.id));
export type CheckInInput = z.infer<typeof checkInSchema>;

export function createEmotionCheckInSchema(
  allowedEmotionIds: readonly string[],
  allowedMascotIds: readonly string[],
) {
  const emotions = new Set(allowedEmotionIds);
  const mascots = new Set(allowedMascotIds);
  return z.object({
    emotionId: z.string().trim().min(1),
    customEmotionLabel: z.string().trim().max(32).nullable(),
    note: z.string().trim().min(1, getMessage("vi", "requiredField")).max(100, getMessage("vi", "emotionNoteTooLong")),
    mascotStickerId: z.string().nullable(),
  }).superRefine((value, context) => {
    const custom = value.emotionId === "custom";
    if (custom && !value.customEmotionLabel) {
      context.addIssue({ code: "custom", path: ["customEmotionLabel"], message: getMessage("vi", "requiredField") });
    }
    if (!custom && !emotions.has(value.emotionId)) {
      context.addIssue({ code: "custom", path: ["emotionId"], message: getMessage("vi", "reasonCatalogChanged") });
    }
    if (value.mascotStickerId && !mascots.has(value.mascotStickerId)) {
      context.addIssue({ code: "custom", path: ["mascotStickerId"], message: getMessage("vi", "reasonCatalogChanged") });
    }
  });
}

export const emotionCheckInSchema = createEmotionCheckInSchema(
  emotionCatalog.map((emotion) => emotion.id),
  mascotStickerCatalog.map((sticker) => sticker.id),
);
export type EmotionCheckInInput = z.infer<typeof emotionCheckInSchema>;
