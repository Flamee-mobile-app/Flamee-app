import { z } from 'zod';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function isIsoCalendarDate(value: string) {
  if (!isoDatePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export const timelineDetailsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên cột mốc')
    .max(120, 'Tên cột mốc tối đa 120 ký tự'),
  eventDate: z
    .string()
    .refine(isIsoCalendarDate, 'Ngày diễn ra phải có định dạng YYYY-MM-DD'),
  recurrence: z.enum(['none', 'monthly', 'yearly']),
  coverAssetKey: z.string().optional(),
  note: z.string().trim().max(300, 'Ghi chú tối đa 300 ký tự').optional(),
});

export const timelineReminderSchema = z.discriminatedUnion('enabled', [
  z.object({ enabled: z.literal(false) }),
  z.object({
    enabled: z.literal(true),
    leadDays: z.union([z.literal(1), z.literal(3), z.literal(7)]),
    time: z.string().regex(timePattern, 'Thời gian nhắc phải có định dạng HH:mm'),
    recipient: z.enum(['couple', 'self']),
  }),
]);

export type TimelineDetailsValues = z.infer<typeof timelineDetailsSchema>;
export type TimelineReminderValues = z.infer<typeof timelineReminderSchema>;
