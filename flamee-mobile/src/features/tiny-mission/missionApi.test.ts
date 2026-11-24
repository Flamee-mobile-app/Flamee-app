import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { createMissionApi, MissionApiError, type MissionAssignment, type MissionReward } from "./missionApi.ts";
import { createMissionService, missionKey, pruneMissionQueries } from "./missionServiceCore.ts";

const row: MissionAssignment = { id: "assignment-a", couple_id: "pair", local_date: "2026-11-21", slot: 1, kind: "individual", assignee_id: "a", template_id: "individual-rest", title_vi: "Nghỉ một chút", title_en: "Take a break", description_vi: "", description_en: "", points: 10, rule_version: 1, version: 0, awarded_at: null, completed_by: [] };
const reward: MissionReward = { id: "reward-a", title_vi: "Quà kiểm thử", title_en: "Test reward", description_vi: "", description_en: "", stock: 1, active: true, price_points: 100, revision: 1, fanpage_url: "https://example.invalid/reward" };
const scope = { accountId: "a", coupleId: "pair", sessionId: 1, revision: 2 };
const auth = { withAccessToken: async <T>(read: (token: string) => Promise<T>) => read("token") };
const ok = (data: unknown) => Response.json({ success: true, data });
const apiFor = (data: unknown) => createMissionApi({ baseUrl: "https://api.example", fetcher: (async () => ok(data)) as typeof fetch });

test("complete posts only version with bearer and a stable idempotency key; own acknowledgement is required", async () => {
  let calls = 0;
  const api = createMissionApi({ baseUrl: "https://api.example/", fetcher: (async (url, init) => {
    calls++; assert.equal(url, "https://api.example/missions/assignment-a/complete");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    assert.equal(new Headers(init?.headers).get("Idempotency-Key"), "same-key");
    assert.deepEqual(JSON.parse(String(init?.body)), { version: 0 });
    return ok({ ...row, completed_by: ["a"], awarded_at: "2026-11-21T01:00:00Z" });
  }) as typeof fetch });
  await api.change("token", row, "complete", "a", "same-key");
  await api.change("token", row, "complete", "a", "same-key");
  assert.equal(calls, 2);
  await assert.rejects(apiFor(row).change("token", row, "complete", "a", "same-key"), (error: MissionApiError) => error.code === "response");
});

test("swap acknowledgement must preserve assignment, price, owner and day while advancing version and template", async () => {
  const swapped = { ...row, version: 1, template_id: "individual-water" };
  assert.equal((await apiFor(swapped).change("token", row, "swap", "a", "key")).version, 1);
  for (const invalid of [{ ...swapped, points: 50 }, { ...swapped, id: "other" }, { ...swapped, assignee_id: "b" }, { ...swapped, template_id: row.template_id }, { ...swapped, local_date: "2026-11-20" }]) {
    await assert.rejects(apiFor(invalid).change("token", row, "swap", "a", "key"), MissionApiError);
  }
});

test("server failures and malformed data cannot become an empty catalog or fabricated wallet", async () => {
  for (const status of [401, 403, 409, 501, 503]) {
    const api = createMissionApi({ baseUrl: "https://api.example", fetcher: (async () => new Response(null, { status })) as typeof fetch });
    await assert.rejects(api.rewards("token", 0), MissionApiError);
  }
  await assert.rejects(apiFor({}).rewards("token", 0), MissionApiError);
  await assert.rejects(apiFor({ couple_id: "pair", balance: -1, revision: 0, timezone: "UTC" }).wallet("token"), MissionApiError);
  assert.deepEqual(await apiFor([]).rewards("token", 0), []);
});

test("today requires four distinct server assignments on the same local day", async () => {
  const assignments = [row, { ...row, id: "b", slot: 2, assignee_id: "b" }, ...[3, 4].map((slot) => ({ ...row, id: String(slot), slot, kind: "shared", assignee_id: null }))];
  assert.equal((await apiFor({ local_date: row.local_date, timezone: "Asia/Ho_Chi_Minh", rule_version: 1, assignments }).today("token")).assignments.length, 4);
  await assert.rejects(apiFor({ local_date: row.local_date, timezone: "UTC", rule_version: 1, assignments: [row, row, row, row] }).today("token"), MissionApiError);
});

const order = { id: "order-a", couple_id: "pair", actor_id: "a", reward_id: reward.id, price_points: 100, reward_snapshot: reward, code: "FM-TEST-ONLY", status: "pending_fulfillment", expires_at: "2026-12-21T00:00:00Z", created_at: "2026-11-21T00:00:00Z" };
test("redemption uses expected server price and accepts only a matching receipt and safe contact URL", async () => {
  const api = createMissionApi({ baseUrl: "https://api.example", fetcher: (async (_url, init) => { assert.deepEqual(JSON.parse(String(init?.body)), { reward_id: reward.id, expected_price: 100 }); return ok(order); }) as typeof fetch });
  assert.equal((await api.redeem("token", reward, "key")).code, "FM-TEST-ONLY");
  for (const invalid of [{ ...order, price_points: 19 }, { ...order, reward_id: "another" }, { ...order, status: "cancelled" }, { ...order, reward_snapshot: { ...reward, fanpage_url: "javascript:alert(1)" } }]) await assert.rejects(apiFor(invalid).redeem("token", reward, "key"), MissionApiError);
});

test("new redemptions below 100 points make no request; rewards without a fanpage remain readable", async () => {
  let calls = 0;
  const api = createMissionApi({ baseUrl: "https://api.example", fetcher: (async () => { calls++; return ok(order); }) as typeof fetch });
  await assert.rejects(api.redeem("token", { ...reward, price_points: 99 }, "key"), MissionApiError);
  assert.equal(calls, 0);
  assert.equal((await apiFor([{ ...reward, fanpage_url: null }]).rewards("token", 0))[0].fanpage_url, null);
});

test("a scope change while reading discards the late acknowledgement", async () => {
  let current = true;
  const api = createMissionApi({ baseUrl: "https://api.example", fetcher: (async () => { current = false; return ok({ couple_id: "pair", balance: 10, revision: 1, timezone: "UTC" }); }) as typeof fetch });
  await assert.rejects(createMissionService(api, auth, () => current).wallet(scope), (error: Error) => error.name === "AbortError");
});

test("another couple's wallet, receipt or mission cannot be displayed or confirmed", async () => {
  const service = createMissionService(apiFor({ couple_id: "another", balance: 10, revision: 0, timezone: "UTC" }), auth, () => true);
  await assert.rejects(service.wallet(scope), MissionApiError);
  await assert.rejects(service.change(scope, { ...row, assignee_id: "b" }, "complete", "key"), (error: MissionApiError) => error.code === "forbidden");
  await assert.rejects(createMissionService(apiFor({ ...order, couple_id: "another" }), auth, () => true).redeem(scope, reward, "key"), MissionApiError);
});

test("switching account or membership revision removes cached points and claim codes", () => {
  const client = new QueryClient();
  client.setQueryData([...missionKey(scope), "orders"], [order]);
  pruneMissionQueries(client, { ...scope, revision: 3 });
  assert.equal(client.getQueryData([...missionKey(scope), "orders"]), undefined);
  client.clear();
});

test("an already-aborted request performs no network call", async () => {
  let calls = 0; const controller = new AbortController(); controller.abort();
  const api = createMissionApi({ baseUrl: "https://api.example", fetcher: (async () => { calls++; return ok([]); }) as typeof fetch });
  await assert.rejects(api.rewards("token", 0, controller.signal), (error: Error) => error.name === "AbortError");
  assert.equal(calls, 0);
});
