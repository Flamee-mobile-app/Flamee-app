import { z } from "zod";
import { getMessage } from "../../shared/localization/messages.ts";

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, getMessage("vi", "loginPasswordRequired")).max(128, getMessage("vi", "loginPasswordTooLong")),
  newPassword: z.string().min(8, getMessage("vi", "registerPasswordMinimum")).max(128, getMessage("vi", "loginPasswordTooLong")),
  confirmPassword: z.string().min(1, getMessage("vi", "registerConfirmRequired")),
}).refine(value => value.newPassword === value.confirmPassword, {
  path: ["confirmPassword"], message: getMessage("vi", "registerPasswordMismatch"),
});

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
