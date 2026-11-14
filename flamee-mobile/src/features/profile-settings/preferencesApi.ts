import { z } from "zod";
import { carePreferenceIds } from "../onboarding/index.ts";

const text = (maximum: number) => z.string().refine((value) => Array.from(value).length <= maximum);
const preferencesSchema = z.object({
  timezone: z.string().min(1).max(100),
  locale: z.enum(["vi", "en"]),
  care_preferences: z.array(z.enum(carePreferenceIds)).max(6).refine((items) => new Set(items).size === items.length),
  care_note: text(140),
  partner_nickname: text(40),
  relationship_type: z.enum(["long_distance", "same_city"]).nullable(),
  revision: z.number().int().nonnegative(),
  onboarding_completed_at: z.string().nullable(),
}).strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export type PreferencesErrorCode = "configuration" | "unauthorized" | "network" | "timeout" | "conflict" | "validation" | "server" | "response";
export class PreferencesError extends Error {
  readonly code: PreferencesErrorCode;
  constructor(code: PreferencesErrorCode) { super(code); this.name = "PreferencesError"; this.code = code; }
}

export function createPreferencesApi({ baseUrl, fetcher = fetch, timeoutMs = 12_000 }: { baseUrl: string; fetcher?: typeof fetch; timeoutMs?: number }) {
  const request = async (token: string, input?: Preferences, signal?: AbortSignal): Promise<Preferences> => {
    const root = baseUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//.test(root)) throw new PreferencesError("configuration");
    if (!token) throw new PreferencesError("unauthorized");
    if (input && !preferencesSchema.safeParse(input).success) throw new PreferencesError("validation");
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) { const error = new Error("cancelled"); error.name = "AbortError"; throw error; }
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      const body = input ? { timezone: input.timezone, locale: input.locale, care_preferences: input.care_preferences, care_note: input.care_note, partner_nickname: input.partner_nickname, relationship_type: input.relationship_type, revision: input.revision, complete_onboarding: false } : undefined;
      const response = await fetcher(`${root}/users/me/preferences`, {
        method: input ? "PUT" : "GET", headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined, signal: controller.signal,
      });
      if (!response.ok) throw new PreferencesError(response.status === 401 ? "unauthorized" : response.status === 409 ? "conflict" : response.status === 400 || response.status === 422 ? "validation" : "server");
      const json: unknown = await response.json().catch(() => null);
      const parsed = z.object({ success: z.literal(true), data: preferencesSchema }).safeParse(json);
      if (!parsed.success) throw new PreferencesError("response");
      const saved = parsed.data.data;
      if (input && (saved.revision !== input.revision + 1 || saved.timezone !== input.timezone || saved.locale !== input.locale || saved.care_note !== input.care_note || saved.partner_nickname !== input.partner_nickname || saved.relationship_type !== input.relationship_type || saved.onboarding_completed_at !== input.onboarding_completed_at || JSON.stringify(saved.care_preferences) !== JSON.stringify(input.care_preferences))) throw new PreferencesError("response");
      return saved;
    } catch (error) {
      if (signal?.aborted) { const cancelled = new Error("cancelled"); cancelled.name = "AbortError"; throw cancelled; }
      if (error instanceof PreferencesError) throw error;
      throw new PreferencesError(controller.signal.aborted ? "timeout" : "network");
    } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  };
  return { read: (token: string, signal?: AbortSignal) => request(token, undefined, signal), save: (token: string, input: Preferences, signal?: AbortSignal) => request(token, input, signal) };
}
