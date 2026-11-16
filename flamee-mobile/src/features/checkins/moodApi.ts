import { z } from "zod";

const moodSchema = z.object({
  id: z.string().min(1), mood: z.string().min(1),
  created_at: z.string().datetime({ offset: true }),
  intensity: z.number(), mood_score: z.number().int().min(1).max(5),
  note: z.string().nullable(), reasons: z.array(z.string()).nullable(),
  is_private: z.boolean(), share_level: z.enum(["all", "mood_only", "private"]),
  draft_version: z.number().optional(), custom_emotion_label: z.string().nullable().optional(), mascot_sticker_id: z.string().nullable().optional(), sleep_hours: z.number().nullable().optional(), attachments: z.array(z.object({ kind: z.enum(["gif", "emoji", "sticker"]), id: z.string() })).optional(), timezone: z.string().optional(), local_date: z.string().nullable().optional(),
});
export type ServerMood = z.infer<typeof moodSchema>;
export type CreateMoodInput = { draft_version: 2; mood: string; intensity: number; mood_score: number; note: string; reasons: string[]; custom_emotion_label: string | null; mascot_sticker_id: string | null; sleep_hours: number | null; attachments: { kind: "gif" | "emoji" | "sticker"; id: string }[]; timezone: string; share_level: "all"; is_private: false };
const reminderSchema = z.object({ id: z.string().min(1), local_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), timezone: z.string().min(1), created_at: z.string().datetime({ offset: true }), read_at: z.string().datetime({ offset: true }).nullable() });
export type MoodReminder = z.infer<typeof reminderSchema>;
const partnerSchema = z.object({ partner_id: z.string().min(1), latest_mood: moodSchema.refine((mood) => !mood.is_private && mood.share_level !== "private")
  .transform((mood) => mood.share_level === "mood_only" ? { ...mood, note: null, reasons: null } : mood).nullable() }).nullable();
export type ServerPartnerMood = z.infer<typeof partnerSchema>;
export class MoodApiError extends Error {
  readonly code: "unauthorized" | "network" | "timeout" | "response" | "server" | "configuration" | "unavailable";
  constructor(code: MoodApiError["code"]) { super(code); this.code = code; }
}

export function createMoodApi({ baseUrl, fetcher = fetch, timeoutMs = 12000 }: { baseUrl: string; fetcher?: typeof fetch; timeoutMs?: number }) {
    async function read<T>(token: string, path: string, schema: z.ZodType<T>, signal?: AbortSignal, write?: { body?: unknown; key?: string; method?: "POST" | "PUT" }): Promise<T> {
      const root = baseUrl.trim().replace(/\/+$/, "");
      if (!/^https?:\/\//.test(root)) throw new MoodApiError("configuration");
      if (!token) throw new MoodApiError("unauthorized");
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) controller.abort();
      const timer = setTimeout(abort, timeoutMs);
      try {
        if (signal?.aborted) throw new Error("cancelled");
        const response = await fetcher(`${root}${path}`, {
          method: write?.method ?? (write ? "POST" : "GET"), headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(write?.body !== undefined ? { "Content-Type": "application/json" } : {}), ...(write?.key ? { "Idempotency-Key": write.key } : {}) }, ...(write?.body !== undefined ? { body: JSON.stringify(write.body) } : {}), signal: controller.signal,
        });
        if (!response.ok) throw new MoodApiError(response.status === 401 ? "unauthorized" : "server");
        let body: unknown;
        try { body = await response.json(); } catch { throw new MoodApiError("response"); }
        const parsed = z.object({ success: z.literal(true), data: schema }).safeParse(body);
        if (!parsed.success) throw new MoodApiError("response");
        return parsed.data.data;
      } catch (error) {
        if (signal?.aborted) { const cancelled = new Error("cancelled"); cancelled.name = "AbortError"; throw cancelled; }
        if (error instanceof MoodApiError) throw error;
        throw new MoodApiError(controller.signal.aborted ? "timeout" : "network");
      } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
    }
  return {
    capabilities: (token: string) => read(token, "/moods/capabilities", z.object({ dual_mood_nudge: z.boolean() })),
    ensureReminder: (token: string, timezone: string) => read(token, "/moods/reminders/ensure", z.object({ show_prompt: z.boolean(), reminder: reminderSchema.nullable() }).refine((value) => !value.show_prompt || value.reminder !== null), undefined, { body: { timezone } }),
    reminders: (token: string, offset: number, signal?: AbortSignal) => read(token, `/moods/reminders?limit=20&offset=${offset}`, z.object({ items: z.array(reminderSchema), total: z.number().int().nonnegative(), unread_count: z.number().int().nonnegative() }), signal),
    readReminder: (token: string, id: string) => read(token, `/moods/reminders/${encodeURIComponent(id)}/read`, reminderSchema, undefined, { method: "PUT" }),
    readAllReminders: (token: string) => read(token, "/moods/reminders/read-all", z.object({ unread_count: z.literal(0) }), undefined, { method: "PUT" }),
    create: async (token: string, body: CreateMoodInput, key: string) => {
      const result = await read(token, "/moods", moodSchema, undefined, { body, key });
      if (result.draft_version !== 2 || result.is_private || result.share_level !== "all" || result.mood !== body.mood || result.intensity !== body.intensity || result.mood_score !== body.mood_score || result.note !== body.note || result.custom_emotion_label !== body.custom_emotion_label || result.mascot_sticker_id !== body.mascot_sticker_id || result.sleep_hours !== body.sleep_hours || result.timezone !== body.timezone || !result.local_date || JSON.stringify(result.reasons ?? []) !== JSON.stringify(body.reasons) || JSON.stringify(result.attachments) !== JSON.stringify(body.attachments)) throw new MoodApiError("response");
      return result;
    },
    history: (token: string, page: { limit: number; offset: number }, signal?: AbortSignal) => read(token, `/moods?limit=${page.limit}&offset=${page.offset}`, z.array(moodSchema), signal),
    partner: (token: string, signal?: AbortSignal) => read(token, "/moods/partner/latest", partnerSchema, signal),
  };
}
