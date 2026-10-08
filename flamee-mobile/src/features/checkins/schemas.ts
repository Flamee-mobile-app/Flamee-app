import { z } from "zod";
import { getMessage } from "../../shared/localization/messages.ts";
import { localCheckInReasons } from "./types.ts";

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
