import { z } from "zod";

const moodSchema = z.object({
  id: z.string().min(1), mood: z.string().min(1),
  created_at: z.string().datetime({ offset: true }),
  intensity: z.number(), mood_score: z.number().int().min(1).max(5),
  note: z.string().nullable(), reasons: z.array(z.string()).nullable(),
  is_private: z.boolean(), share_level: z.enum(["all", "mood_only", "private"]),
});
export type ServerMood = z.infer<typeof moodSchema>;
const partnerSchema = z.object({ partner_id: z.string().min(1), latest_mood: moodSchema.refine((mood) => !mood.is_private && mood.share_level !== "private")
  .transform((mood) => mood.share_level === "mood_only" ? { ...mood, note: null, reasons: null } : mood).nullable() }).nullable();
export type ServerPartnerMood = z.infer<typeof partnerSchema>;
export class MoodApiError extends Error {
  readonly code: "unauthorized" | "network" | "timeout" | "response" | "server" | "configuration";
  constructor(code: MoodApiError["code"]) { super(code); this.code = code; }
}

export function createMoodApi({ baseUrl, fetcher = fetch, timeoutMs = 12000 }: { baseUrl: string; fetcher?: typeof fetch; timeoutMs?: number }) {
    async function read<T>(token: string, path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
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
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal: controller.signal,
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
    history: (token: string, page: { limit: number; offset: number }, signal?: AbortSignal) => read(token, `/moods?limit=${page.limit}&offset=${page.offset}`, z.array(moodSchema), signal),
    partner: (token: string, signal?: AbortSignal) => read(token, "/moods/partner/latest", partnerSchema, signal),
  };
}
