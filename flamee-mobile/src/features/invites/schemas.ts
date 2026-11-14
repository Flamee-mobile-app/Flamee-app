import { z } from "zod";
import { getMessage } from "../../shared/localization/messages.ts";

export const inviteCodeSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\s/g, "").toUpperCase())
    .refine((value) => /^[A-Z0-9]{6}$/.test(value), getMessage("vi", "inviteCodeInvalid")),
});

export type InviteCodeInput = z.input<typeof inviteCodeSchema>;
export type InviteCodeValue = z.output<typeof inviteCodeSchema>;
