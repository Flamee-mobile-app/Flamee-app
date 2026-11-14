import { z } from "zod";

export type OnboardingStatus = "pending" | "skipped" | "completed";
export class OnboardingError extends Error {
  readonly code: "configuration" | "unauthorized" | "network" | "timeout" | "server" | "response";
  constructor(code: OnboardingError["code"]) { super(code); this.name = "OnboardingError"; this.code = code; }
}
const envelope = z.object({ success: z.literal(true), data: z.object({ status: z.enum(["pending", "skipped", "completed"]) }) });

export function createOnboardingApi({ baseUrl, fetcher = fetch, timeoutMs = 12000 }: { baseUrl: string; fetcher?: typeof fetch; timeoutMs?: number }) {
  const request = async (token: string, skip: boolean, signal?: AbortSignal): Promise<OnboardingStatus> => {
    const root = baseUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//.test(root)) throw new OnboardingError("configuration");
    if (!token) throw new OnboardingError("unauthorized");
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) { const error = new Error("cancelled"); error.name = "AbortError"; throw error; }
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      const response = await fetcher(`${root}/users/me/onboarding${skip ? "/skip" : ""}`, { method: skip ? "POST" : "GET", headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal: controller.signal });
      if (!response.ok) throw new OnboardingError(response.status === 401 ? "unauthorized" : "server");
      const parsed = envelope.safeParse(await response.json().catch(() => null));
      if (!parsed.success || skip && parsed.data.data.status === "pending") throw new OnboardingError("response");
      return parsed.data.data.status;
    } catch (error) {
      if (signal?.aborted) { const cancelled = new Error("cancelled"); cancelled.name = "AbortError"; throw cancelled; }
      if (error instanceof OnboardingError) throw error;
      throw new OnboardingError(controller.signal.aborted ? "timeout" : "network");
    } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  };
  return { read: (token: string, signal?: AbortSignal) => request(token, false, signal), skip: (token: string, signal?: AbortSignal) => request(token, true, signal) };
}
