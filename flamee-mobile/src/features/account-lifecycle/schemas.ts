import { z } from "zod";

export const supportRequestSchema = z.object({
  kind: z.enum(["contact", "bug", "content"]),
  message: z.string().trim().min(10).max(500),
});

export const destructiveConfirmationSchema = z.object({
  acknowledged: z.literal(true),
  confirmation: z.string().trim().min(1),
});
