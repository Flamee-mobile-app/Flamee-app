import { z } from "zod";
import { getMessage } from "../../shared/localization/messages.ts";

export const inviteCodeSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\s/g, "").toUpperCase())
    .refine((value) => /^[A-Z0-9]{6}$/.test(value), getMessage("vi", "inviteCodeInvalid")),
});

const localMediaUri = z.string().regex(/^(file|content):\/\//i, "A real local media URI is required.");

export const inviteGiftSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string().trim().min(1).max(200) }),
  z.object({
    kind: z.literal("photo"),
    uri: localMediaUri,
    caption: z.string().trim().max(100),
  }),
  z.object({
    kind: z.literal("voice"),
    uri: localMediaUri,
    durationSeconds: z.number().min(1).max(30),
  }),
]);

export type InviteCodeInput = z.input<typeof inviteCodeSchema>;
export type InviteCodeValue = z.output<typeof inviteCodeSchema>;
export type InviteGiftInput = z.infer<typeof inviteGiftSchema>;
