import { z } from "zod";
import { getMessage } from "../../shared/localization/messages.ts";

export function normalizeVietnamesePhone(value: string): string {
  const compact = value.replace(/[\s()-]/g, "");
  if (compact.startsWith("+84")) return compact;
  if (compact.startsWith("84")) return `+${compact}`;
  if (compact.startsWith("0")) return `+84${compact.slice(1)}`;
  return compact;
}

export const phoneSchema = z.object({
  phone: z
    .string()
    .transform(normalizeVietnamesePhone)
    .refine((value) => /^\+84[35789]\d{8}$/.test(value), getMessage("vi", "phoneInvalid")),
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, getMessage("vi", "otpFormatInvalid")),
});

export type PhoneInput = z.input<typeof phoneSchema>;
export type PhoneValue = z.output<typeof phoneSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
