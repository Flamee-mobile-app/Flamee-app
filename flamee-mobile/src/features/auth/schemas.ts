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

export const emailLoginSchema = z.object({
  email: z.string().trim().min(1, getMessage("vi", "requiredField")).email(getMessage("vi", "loginEmailInvalid")).max(254, getMessage("vi", "loginEmailInvalid")),
  password: z.string().min(1, getMessage("vi", "loginPasswordRequired")).max(128, getMessage("vi", "loginPasswordTooLong")),
});

export type EmailLoginInput = z.input<typeof emailLoginSchema>;

export const registerSchema = emailLoginSchema.extend({
  fullName: z.string().trim().min(1, getMessage("vi", "registerNameRequired")).max(100, getMessage("vi", "registerNameTooLong")),
  password: z.string().min(8, getMessage("vi", "registerPasswordMinimum")).max(128, getMessage("vi", "loginPasswordTooLong")),
  confirmPassword: z.string().min(1, getMessage("vi", "registerConfirmRequired")),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"], message: getMessage("vi", "registerPasswordMismatch"),
});

export type RegisterInput = z.input<typeof registerSchema>;
