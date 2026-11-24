import { z } from "zod";
import { MINIMUM_REWARD_POINTS } from "./rewardMilestones.ts";

const id = z.string().min(1);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const count = z.number().int().nonnegative();
const timestamp = z.string().refine((value) => Number.isFinite(Date.parse(value)));
export const assignmentSchema = z.object({
  id, couple_id: id, local_date: day, slot: z.number().int().min(1).max(4), kind: z.enum(["individual", "shared"]),
  assignee_id: id.nullable(), template_id: id, title_vi: id, title_en: id, description_vi: z.string(), description_en: z.string(),
  points: z.number().int().positive(), rule_version: z.number().int().positive(), version: count.max(1),
  awarded_at: timestamp.nullable(), completed_by: z.array(id),
}).refine((row) => (row.kind === "individual") === (row.assignee_id !== null) && new Set(row.completed_by).size === row.completed_by.length
  && row.completed_by.length <= (row.kind === "individual" ? 1 : 2)
  && (row.kind !== "individual" || row.completed_by.every((actor) => actor === row.assignee_id))
  && (!row.awarded_at || row.completed_by.length === (row.kind === "individual" ? 1 : 2)));
export type MissionAssignment = z.infer<typeof assignmentSchema>;
const todaySchema = z.object({ local_date: day, timezone: id, rule_version: z.number().int().positive(), assignments: z.array(assignmentSchema).length(4) })
  .refine((page) => new Set(page.assignments.map((row) => row.id)).size === 4 && new Set(page.assignments.map((row) => row.slot)).size === 4 && page.assignments.every((row) => row.local_date === page.local_date));
const walletSchema = z.object({ couple_id: id, balance: count, revision: count, timezone: id });
const periodSchema = z.object({ couple_id: id, kind: z.enum(["week", "month"]), start_date: day, end_date: day, target: z.number().int().positive(), bonus: count, completed_count: count, credited_at: timestamp.nullable() });
const ledgerSchema = z.object({ id, couple_id: id, delta: z.number().int(), source_kind: id, source_id: id, created_at: timestamp });
export const rewardSchema = z.object({ id, title_vi: id, title_en: id, description_vi: z.string(), description_en: z.string(), price_points: z.number().int().positive(), stock: count, active: z.boolean(), revision: count,
  fanpage_url: z.string().url().refine((value) => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }).nullable(),
});
export const redemptionSchema = z.object({ id, couple_id: id, actor_id: id, reward_id: id, price_points: z.number().int().positive(), reward_snapshot: rewardSchema,
  code: id, status: z.enum(["pending_fulfillment", "review", "shipped", "delivered", "cancelled", "expired"]), expires_at: timestamp, created_at: timestamp,
});
export type MissionToday = z.infer<typeof todaySchema>;
export type MissionWallet = z.infer<typeof walletSchema>;
export type MissionPeriod = z.infer<typeof periodSchema>;
export type MissionLedgerEntry = z.infer<typeof ledgerSchema>;
export type MissionReward = z.infer<typeof rewardSchema>;
export type MissionRedemption = z.infer<typeof redemptionSchema>;
export class MissionApiError extends Error {
  readonly code: "unauthorized" | "forbidden" | "conflict" | "unavailable" | "network" | "timeout" | "response" | "server";
  constructor(code: MissionApiError["code"]) { super(code); this.code = code; }
}

export function createMissionApi({ baseUrl, fetcher = fetch, timeoutMs = 12000 }: { baseUrl: string; fetcher?: typeof fetch; timeoutMs?: number }) {
  async function request<T>(token: string, path: string, schema: z.ZodType<T>, signal?: AbortSignal, write?: { body: unknown; key: string }) {
    const root = baseUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//.test(root)) throw new MissionApiError("unavailable");
    if (!token) throw new MissionApiError("unauthorized");
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    const timer = setTimeout(abort, timeoutMs);
    try {
      if (signal?.aborted) throw new Error("cancelled");
      const response = await fetcher(`${root}${path}`, { method: write ? "POST" : "GET", signal: controller.signal,
        headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(write ? { "Content-Type": "application/json", "Idempotency-Key": write.key } : {}) },
        ...(write ? { body: JSON.stringify(write.body) } : {}),
      });
      if (!response.ok) throw new MissionApiError(response.status === 401 ? "unauthorized" : response.status === 403 ? "forbidden" : response.status === 409 ? "conflict" : [404, 405, 501, 503].includes(response.status) ? "unavailable" : "server");
      const parsed = z.object({ success: z.literal(true), data: schema }).safeParse(await response.json().catch(() => null));
      if (!parsed.success) throw new MissionApiError("response");
      return parsed.data.data;
    } catch (error) {
      if (signal?.aborted) { const cancelled = new Error("cancelled"); cancelled.name = "AbortError"; throw cancelled; }
      if (error instanceof MissionApiError) throw error;
      throw new MissionApiError(controller.signal.aborted ? "timeout" : "network");
    } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  }
  return {
    today: (token: string, signal?: AbortSignal) => request(token, "/missions/today", todaySchema, signal),
    wallet: (token: string, signal?: AbortSignal) => request(token, "/wallet", walletSchema, signal),
    achievements: (token: string, signal?: AbortSignal) => request(token, "/missions/achievements", z.array(periodSchema), signal),
    ledger: (token: string, offset: number, signal?: AbortSignal) => request(token, `/wallet/ledger?limit=20&offset=${offset}`, z.array(ledgerSchema), signal),
    rewards: (token: string, offset: number, signal?: AbortSignal) => request(token, `/rewards?limit=20&offset=${offset}`, z.array(rewardSchema), signal),
    redemptions: (token: string, offset: number, signal?: AbortSignal) => request(token, `/redemptions?limit=20&offset=${offset}`, z.array(redemptionSchema), signal),
    redemption: async (token: string, orderId: string, signal?: AbortSignal) => {
      const result = await request(token, `/redemptions/${encodeURIComponent(orderId)}`, redemptionSchema, signal);
      if (result.id !== orderId) throw new MissionApiError("response");
      return result;
    },
    change: async (token: string, row: MissionAssignment, action: "complete" | "swap", actorId: string, key: string) => {
      const result = await request(token, `/missions/${encodeURIComponent(row.id)}/${action}`, assignmentSchema, undefined, { body: { version: row.version }, key });
      if (result.id !== row.id || result.couple_id !== row.couple_id || result.local_date !== row.local_date || result.assignee_id !== row.assignee_id || result.kind !== row.kind || result.points !== row.points
        || (action === "complete" ? !result.completed_by.includes(actorId) || result.template_id !== row.template_id || result.version !== row.version
          : result.version !== row.version + 1 || result.template_id === row.template_id || result.completed_by.length !== 0)) throw new MissionApiError("response");
      return result;
    },
    redeem: async (token: string, reward: MissionReward, key: string) => {
      if (reward.price_points < MINIMUM_REWARD_POINTS) throw new MissionApiError("unavailable");
      const result = await request(token, "/redemptions", redemptionSchema, undefined, { body: { reward_id: reward.id, expected_price: reward.price_points }, key });
      if (result.reward_id !== reward.id || result.price_points !== reward.price_points || result.reward_snapshot.id !== reward.id || result.status !== "pending_fulfillment") throw new MissionApiError("response");
      return result;
    },
  };
}
