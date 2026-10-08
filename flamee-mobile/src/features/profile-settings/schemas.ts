import { z } from "zod";
import { carePreferenceIds } from "../onboarding/schemas.ts";

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("vi-VN", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const settingsProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  partnerNickname: z.string().trim().max(40),
  timezone: z.string().min(1).refine(isIanaTimezone),
});

export const settingsCareSchema = z.object({
  preferences: z.array(z.enum(carePreferenceIds)).max(6),
  note: z.string().trim().max(140),
});

export const notificationSettingsSchema = z.object({
  reminderEnabled: z.boolean(),
  reminderTime: timeSchema,
}).strict();
