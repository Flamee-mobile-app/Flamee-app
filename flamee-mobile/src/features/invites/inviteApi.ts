import { z } from "zod";

export type InviteApiErrorCode =
  | "configuration" | "network" | "timeout" | "unauthorized" | "response" | "server"
  | "invite_not_found" | "invite_expired" | "invite_cancelled" | "invite_used"
  | "already_paired" | "inviter_already_paired" | "self_invite";

export class InviteApiError extends Error {
  readonly code: InviteApiErrorCode;
  constructor(code: InviteApiErrorCode, message: string = code) {
    super(message);
    this.name = "InviteApiError";
    this.code = code;
  }
}

const inviteSchema = z.object({
  code: z.string().length(6),
  expires_at: z.string(),
  status: z.enum(["pending", "accepted", "expired", "cancelled"]),
  is_pending: z.boolean(),
});
const memberSchema = z.object({ id: z.string(), full_name: z.string(), avatar_url: z.string().nullable().optional() });
const previewSchema = z.object({ code: z.string().length(6), expires_at: z.string(), inviter: memberSchema });
const coupleSchema = z.object({ id: z.string(), status: z.string() }).passthrough();

export type ServerInvite = z.infer<typeof inviteSchema>;
export type InvitePreview = z.infer<typeof previewSchema>;
export type AcceptedCouple = z.infer<typeof coupleSchema>;

export function createInviteApi({ baseUrl, fetcher = fetch, timeoutMs = 12000 }: { baseUrl: string; fetcher?: typeof fetch; timeoutMs?: number }) {
  const request = async (path: string, token: string, method: "GET" | "POST" | "DELETE", body?: unknown) => {
    const root = baseUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//.test(root)) throw new InviteApiError("configuration");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(`${root}${path}`, {
        method,
        headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      let payload: unknown;
      try { payload = await response.json(); } catch { throw new InviteApiError("response"); }
      if (!response.ok) {
        const parsed = z.object({ error: z.object({ code: z.string(), message: z.string() }) }).safeParse(payload);
        if (response.status === 401) throw new InviteApiError("unauthorized");
        if (parsed.success) throw new InviteApiError(parsed.data.error.code as InviteApiErrorCode, parsed.data.error.message);
        throw new InviteApiError("server");
      }
      const envelope = z.object({ success: z.literal(true), data: z.unknown() }).safeParse(payload);
      if (!envelope.success) throw new InviteApiError("response");
      return envelope.data.data;
    } catch (error) {
      if (error instanceof InviteApiError) throw error;
      throw new InviteApiError(controller.signal.aborted ? "timeout" : "network");
    } finally { clearTimeout(timer); }
  };
  const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
    const result = schema.safeParse(value);
    if (!result.success) throw new InviteApiError("response");
    return result.data;
  };
  return {
    async create(token: string) { return parse(inviteSchema, await request("/couple/invite-code", token, "POST", {})); },
    async current(token: string) { return parse(inviteSchema.nullable(), await request("/couple/invite-code", token, "GET")); },
    async revoke(token: string) { return parse(inviteSchema, await request("/couple/invite-code", token, "DELETE")); },
    async preview(token: string, code: string) { return parse(previewSchema, await request("/couple/validate-invite", token, "POST", { code: code.trim().toUpperCase() })); },
    async accept(token: string, code: string) { return parse(coupleSchema, await request("/couple/accept-invite", token, "POST", { code: code.trim().toUpperCase() })); },
  };
}

export type InviteApi = ReturnType<typeof createInviteApi>;
