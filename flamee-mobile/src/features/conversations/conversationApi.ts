import { z } from "zod";

const author = z.object({ id: z.string().min(1), full_name: z.string(), username: z.string().nullable() });
export const commentSchema = z.object({ id: z.string().min(1), memory_id: z.string().min(1), parent_id: z.string().nullable(), body: z.string(), deleted: z.boolean(), version: z.number().int().nonnegative(), created_at: z.string(), updated_at: z.string(), author, parent_author: z.string().nullable(), heart_count: z.number().int().nonnegative(), hearted: z.boolean() });
export const commentsSchema = z.object({ items: z.array(commentSchema), total: z.number().int().nonnegative(), comment_count: z.number().int().nonnegative() });
export const noticeSchema = z.object({ id: z.string().min(1), kind: z.enum(["comment", "reply", "heart"]), memory_id: z.string().nullable(), comment_id: z.string().nullable(), available: z.boolean(), actor_name: z.string(), created_at: z.string(), read_at: z.string().nullable() });
export const inboxSchema = z.object({ items: z.array(noticeSchema), total: z.number().int().nonnegative(), unread_count: z.number().int().nonnegative() });
export type MemoryComment = z.infer<typeof commentSchema>;
export type CoupleNotice = z.infer<typeof noticeSchema>;
export class ConversationError extends Error {
  readonly code: "network" | "timeout" | "unavailable" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "response";
  constructor(code: ConversationError["code"]) { super(code); this.code = code; }
}

export function createConversationApi({ baseUrl, fetcher = fetch, timeoutMs = 12000 }: { baseUrl: string; fetcher?: typeof fetch; timeoutMs?: number }) {
  async function request<T>(token: string, path: string, schema: z.ZodType<T>, method = "GET", body?: unknown, key?: string, signal?: AbortSignal): Promise<T> {
    if (!/^https?:\/\//.test(baseUrl)) throw new ConversationError("unavailable");
    if (!token) throw new ConversationError("unauthorized");
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) { const cancelled = new Error("Cancelled"); cancelled.name = "AbortError"; throw cancelled; }
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      const response = await fetcher(`${baseUrl.replace(/\/+$/, "")}${path}`, { method, signal: controller.signal, headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      if (!response.ok) throw new ConversationError(response.status === 401 ? "unauthorized" : response.status === 404 ? "not_found" : response.status === 403 ? "forbidden" : response.status === 409 ? "conflict" : "unavailable");
      let payload: unknown;
      try { payload = await response.json(); } catch { throw new ConversationError("response"); }
      const parsed = z.object({ success: z.literal(true), data: schema }).safeParse(payload);
      if (!parsed.success) throw new ConversationError("response");
      return parsed.data.data;
    } catch (error) {
      if (signal?.aborted) { const cancelled = new Error("Cancelled"); cancelled.name = "AbortError"; throw cancelled; }
      if (error instanceof ConversationError) throw error;
      throw new ConversationError(controller.signal.aborted ? "timeout" : "network");
    } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  }
  const path = (id: string, commentId?: string) => `/memories/${encodeURIComponent(id)}/comments${commentId ? `/${encodeURIComponent(commentId)}` : ""}`;
  const acknowledgement = async (promise: Promise<MemoryComment>, id: string, commentId?: string) => {
    const result = await promise;
    if (result.memory_id !== id || commentId && result.id !== commentId) throw new ConversationError("response");
    return result;
  };
  return {
    list: (token: string, id: string, offset = 0, signal?: AbortSignal) => request(token, `${path(id)}?limit=20&offset=${offset}`, commentsSchema, "GET", undefined, undefined, signal),
    comment: (token: string, id: string, commentId: string, signal?: AbortSignal) => acknowledgement(request(token, path(id, commentId), commentSchema, "GET", undefined, undefined, signal), id, commentId),
    send: async (token: string, id: string, body: string, parent_id: string | null, key: string) => {
      const result = await acknowledgement(request(token, path(id), commentSchema, "POST", { body, parent_id }, key), id);
      if (result.parent_id !== parent_id) throw new ConversationError("response");
      return result;
    },
    edit: async (token: string, id: string, commentId: string, body: string, version: number) => {
      const result = await acknowledgement(request(token, path(id, commentId), commentSchema, "PUT", { body, version }), id, commentId);
      if (result.deleted || result.body !== body.trim() || result.version !== version + 1) throw new ConversationError("response");
      return result;
    },
    remove: async (token: string, id: string, commentId: string, version: number) => {
      const result = await acknowledgement(request(token, `${path(id, commentId)}?version=${version}`, commentSchema, "DELETE"), id, commentId);
      if (!result.deleted) throw new ConversationError("response");
      return result;
    },
    heart: async (token: string, id: string, commentId: string, desired: boolean) => {
      const result = await acknowledgement(request(token, `${path(id, commentId)}/heart`, commentSchema, desired ? "PUT" : "DELETE"), id, commentId);
      if (result.deleted || result.hearted !== desired) throw new ConversationError("response");
      return result;
    },
    inbox: (token: string, offset = 0, signal?: AbortSignal) => request(token, `/notifications?limit=20&offset=${offset}`, inboxSchema, "GET", undefined, undefined, signal),
    read: (token: string, id?: string) => request(token, id ? `/notifications/${encodeURIComponent(id)}/read` : "/notifications/read-all", inboxSchema, "PUT"),
  };
}
