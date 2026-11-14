import { z } from "zod";
import { momentReactions } from "./types.ts";

const caption = z.string().max(100);
const place = z.string().max(80);
const localMediaUri = z.string().regex(/^(file|content):\/\//i, "A real local media URI is required.");

export const momentDraftSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string().trim().min(1).max(200) }),
  z.object({ kind: z.literal("signal"), text: z.string().trim().min(1).max(60) }),
  z.object({ kind: z.literal("photo"), mediaUri: localMediaUri, caption, place }),
  z.object({
    kind: z.literal("voice"),
    mediaUri: localMediaUri,
    durationSeconds: z.number().positive().max(30),
    caption,
    place,
  }),
]);

export const reactionSchema = z.enum(momentReactions);
