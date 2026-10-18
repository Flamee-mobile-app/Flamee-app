import { z } from "zod";

const remoteImage = z.string().url().refine((value) => /^https?:\/\//i.test(value));
const memorySchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  category: z.string(),
  memory_date: z.string(),
  location: z.string().nullable(),
  is_pinned: z.boolean(),
  thumbnail_url: remoteImage.nullable(),
  image_count: z.number().int().nonnegative(),
});
const listSchema = z.object({ items: z.array(memorySchema), total: z.number().int().nonnegative() });
export type MemorySummary = z.infer<typeof memorySchema>;
export type MemoryList = z.infer<typeof listSchema>;

export class MemoryApiError extends Error {
  readonly code: "configuration" | "unauthorized" | "network" | "timeout" | "server" | "response";
  constructor(code: MemoryApiError["code"]) {
    super(code);
    this.name = "MemoryApiError";
    this.code = code;
  }
}

/** Read-only album API; no local success, fallback records or upload side effects. */
export function createMemoryApi({ baseUrl, fetcher = fetch, timeoutMs = 12000 }: {
  baseUrl: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}) {
  return {
    async list(token: string): Promise<MemoryList> {
      const root = baseUrl.trim().replace(/\/+$/, "");
      if (!/^https?:\/\//.test(root)) throw new MemoryApiError("configuration");
      if (!token) throw new MemoryApiError("unauthorized");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetcher(`${root}/memories`, {
          method: "GET",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new MemoryApiError(response.status === 401 ? "unauthorized" : "server");
        let body: unknown;
        try { body = await response.json(); } catch { throw new MemoryApiError("response"); }
        const parsed = z.object({ success: z.literal(true), data: listSchema }).safeParse(body);
        if (!parsed.success) throw new MemoryApiError("response");
        return parsed.data.data;
      } catch (error) {
        if (error instanceof MemoryApiError) throw error;
        throw new MemoryApiError(controller.signal.aborted ? "timeout" : "network");
      } finally { clearTimeout(timer); }
    },
  };
}
