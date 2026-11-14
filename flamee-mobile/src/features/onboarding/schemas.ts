import { z } from "zod";
import { getMessage } from "../../shared/localization/messages.ts";

export const carePreferenceIds = [
  "encouragement",
  "voice",
  "photo",
  "call",
  "space",
  "gift",
] as const;

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("vi-VN", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, getMessage("vi", "nameRequired")).max(40),
  partnerNickname: z.string().trim().max(40),
  avatarUri: z.string().nullable(),
  timezone: z.string().min(1).refine(isIanaTimezone, getMessage("vi", "timezoneInvalid")),
});

export const carePreferencesSchema = z.object({
  preferences: z.array(z.enum(carePreferenceIds)).max(6),
  note: z.string().trim().max(140, getMessage("vi", "noteTooLong")),
});

export const relationSchema = z.object({
  relationType: z.enum(["long_distance", "same_city"]),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValue = z.output<typeof profileSchema>;
export type CarePreferencesInput = z.infer<typeof carePreferencesSchema>;
export type RelationInput = z.infer<typeof relationSchema>;
