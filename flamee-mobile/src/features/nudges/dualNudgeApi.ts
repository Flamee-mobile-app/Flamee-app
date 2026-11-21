import { z } from "zod";

const schema = z.object({ id: z.string().min(1), couple_id: z.string().min(1), receiver_id: z.string().min(1), partner_id: z.string().nullable(), status: z.enum(["new", "completed", "snoozed", "dismissed", "expired"]), observation: z.string(), action_type: z.string(), draft: z.string(), reason: z.string(), tone: z.string(), version: z.number().int().positive(), dual_mood_generated: z.literal(true), source_mood_id: z.string().min(1), receiver_mood_id: z.string().min(1), snooze_count: z.number().int().nonnegative(), snoozed_until: z.string().nullable() });
export type DualNudge = z.infer<typeof schema>;
export type NudgeAction = "completed" | "snoozed" | "dismissed";
export class DualNudgeError extends Error {
  readonly code: "unauthorized" | "network" | "server" | "response";
  constructor(code: "unauthorized" | "network" | "server" | "response") { super(code); this.code = code; }
}
export function createDualNudgeApi({ baseUrl, fetcher = fetch, timeoutMs = 12000 }: { baseUrl: string; fetcher?: typeof fetch; timeoutMs?: number }) {
  async function request(token: string, path: string, nullable: boolean, action?: { action: NudgeAction; version: number }, signal?: AbortSignal) {
    if (!/^https?:\/\//.test(baseUrl)) throw new DualNudgeError("server");
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort(); else signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      if (signal?.aborted) throw new Error("cancelled");
      const response = await fetcher(`${baseUrl.replace(/\/+$/, "")}${path}`, { method: action ? "POST" : "GET", headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(action ? { "Content-Type": "application/json" } : {}) }, ...(action ? { body: JSON.stringify(action) } : {}), signal: controller.signal });
      if (!response.ok) throw new DualNudgeError(response.status === 401 ? "unauthorized" : "server");
      const json = await response.json();
      const parsed = z.object({ success: z.literal(true), data: nullable ? schema.nullable() : schema }).safeParse(json);
      if (!parsed.success) throw new DualNudgeError("response");
      return parsed.data.data;
    } catch (error) {
      if (signal?.aborted) { const cancelled = new Error("cancelled"); cancelled.name = "AbortError"; throw cancelled; }
      if (error instanceof DualNudgeError) throw error;
      throw new DualNudgeError("network");
    } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  }
  return {
    active: (token: string, signal?: AbortSignal) => request(token, "/moods/nudge", true, undefined, signal),
    detail: async (token: string, id: string, signal?: AbortSignal) => { const result = await request(token, `/nudges/${encodeURIComponent(id)}`, false, undefined, signal); if (!result || result.id !== id) throw new DualNudgeError("response"); return result; },
    act: async (token: string, id: string, action: NudgeAction, version: number) => { const result = await request(token, `/nudges/${encodeURIComponent(id)}/action`, false, { action, version }); const confirmed = action === "snoozed" ? result?.status === "new" && result.snooze_count > 0 && !!result.snoozed_until && Number.isFinite(Date.parse(result.snoozed_until)) : result?.status === action; if (!result || result.id !== id || !confirmed || result.version <= version) throw new DualNudgeError("response"); return result; },
  };
}
