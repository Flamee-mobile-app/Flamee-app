import { z } from "zod";

const remoteImage = z.string().url().refine((value) => /^https?:\/\//i.test(value));
const photoSchema = z.object({
  id: z.string().min(1), url: remoteImage,
  thumbnail_url: remoteImage.nullable().optional(),
  width: z.number().positive().nullable(), height: z.number().positive().nullable(),
  url_expires_at: z.number().int().positive().nullable().optional(),
});
const memorySchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  category: z.string(),
  memory_date: z.string(),
  location: z.string().nullable(),
  is_pinned: z.boolean(),
  thumbnail_url: remoteImage.nullable(),
  image_count: z.number().int().nonnegative(),
  cover_image: photoSchema.nullable().optional(),
  description: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  author: z.object({ id: z.string().min(1), full_name: z.string(), username: z.string().nullable().optional(), avatar_url: remoteImage.nullable().optional() }).nullable().optional(),
});
const listSchema = z.object({ items: z.array(memorySchema), total: z.number().int().nonnegative(), limit: z.number().int().positive().optional(), offset: z.number().int().nonnegative().optional(), has_more: z.boolean().optional() });
const detailSchema = z.object({
  id: z.string().min(1), title: z.string(), description: z.string().nullable(), memory_date: z.string(), location: z.string().nullable(),
  images: z.array(photoSchema),
});
export type MemorySummary = z.infer<typeof memorySchema>;
export type MemoryList = z.infer<typeof listSchema>;
export type MemoryDetail = z.infer<typeof detailSchema>;
const createdSchema = detailSchema.extend({ created_by: z.string().min(1) });
const uploadedSchema = z.object({ id: z.string().min(1), url: remoteImage, thumbnail_url: remoteImage });
export type MemoryCreated = z.infer<typeof createdSchema>;
export type MemoryUpload = z.infer<typeof uploadedSchema>;
export type MemoryCreateInput = { title: string; category: string; memory_date: string; description?: string | null };
export type MemoryUploadFile = Blob | { uri: string; name: string; type: string };

export class MemoryApiError extends Error {
  readonly code: "configuration" | "unauthorized" | "network" | "timeout" | "server" | "response" | "validation" | "conflict";
  constructor(code: MemoryApiError["code"]) {
    super(code);
    this.name = "MemoryApiError";
    this.code = code;
  }
}

/** Server-authoritative album API. Uploads send actual File/Blob bytes. */
export function createMemoryApi({ baseUrl, fetcher = fetch, timeoutMs = 12000, fileFromUri }: {
  baseUrl: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  fileFromUri?: (file: { uri: string; name: string; type: string }) => Blob;
}) {
  const request = async <T>(token: string, path: string, schema: z.ZodType<T>, options?: { json?: unknown; form?: FormData; key?: string; signal?: AbortSignal }): Promise<T> => {
    const root = baseUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//.test(root)) throw new MemoryApiError("configuration");
    if (!token) throw new MemoryApiError("unauthorized");
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (options?.signal?.aborted) { const error = new Error("cancelled"); error.name = "AbortError"; throw error; }
    options?.signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => controller.abort(), options?.form ? 60_000 : timeoutMs);
    try {
      const response = await fetcher(`${root}${path}`, {
        method: options?.json !== undefined || options?.form ? "POST" : "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(options?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...(options?.key ? { "Idempotency-Key": options.key } : {}) },
        body: options?.form ?? (options?.json !== undefined ? JSON.stringify(options.json) : undefined),
        signal: controller.signal,
      });
      if (!response.ok) throw new MemoryApiError(response.status === 401 ? "unauthorized" : response.status === 409 ? "conflict" : [400, 413, 422].includes(response.status) ? "validation" : "server");
      let body: unknown;
      try { body = await response.json(); } catch { throw new MemoryApiError("response"); }
      const parsed = z.object({ success: z.literal(true), data: schema }).safeParse(body);
      if (!parsed.success) throw new MemoryApiError("response");
      return parsed.data.data;
    } catch (error) {
      if (options?.signal?.aborted) { const cancelled = new Error("cancelled"); cancelled.name = "AbortError"; throw cancelled; }
      if (error instanceof MemoryApiError) throw error;
      throw new MemoryApiError(controller.signal.aborted ? "timeout" : "network");
    } finally { clearTimeout(timer); options?.signal?.removeEventListener("abort", abort); }
  };
  return {
    list: (token: string, page?: { limit: number; offset: number }, signal?: AbortSignal): Promise<MemoryList> => request(token, `/memories${page ? `?limit=${page.limit}&offset=${page.offset}` : ""}`, listSchema, { signal }),
    detail: (token: string, id: string, signal?: AbortSignal): Promise<MemoryDetail> => request(token, `/memories/${encodeURIComponent(id)}`, detailSchema, { signal }),
    create: (token: string, input: MemoryCreateInput, key: string): Promise<MemoryCreated> => request(token, "/memories", createdSchema, { json: input, key }),
    async upload(token: string, id: string, file: MemoryUploadFile, key: string): Promise<MemoryUpload> {
      const form = new FormData();
      if ("uri" in file) {
        if (!fileFromUri) throw new MemoryApiError("configuration");
        form.append("file", fileFromUri(file), file.name);
      } else form.append("file", file, "memory.jpg");
      return request(token, `/memories/${encodeURIComponent(id)}/images`, uploadedSchema, { form, key });
    },
  };
}
