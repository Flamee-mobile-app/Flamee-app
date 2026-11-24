import assert from "node:assert/strict";
import test from "node:test";
import { createDualNudgeApi } from "./dualNudgeApi.ts";

const nudge = { id: "n1", couple_id: "c1", receiver_id: "u1", partner_id: "u2", status: "new", observation: "o", action_type: "text", draft: "d", reason: "r", tone: "gentle", version: 2, dual_mood_generated: true, source_mood_id: "m2", receiver_mood_id: "m1", snooze_count: 1, snoozed_until: "2099-01-01T00:00:00Z" };
function api(data: unknown) { return createDualNudgeApi({ baseUrl: "https://example.test", fetcher: (async () => new Response(JSON.stringify({ success: true, data }), { status: 200 })) as typeof fetch }); }

test("snooze requires the server's actual new status and a confirmed snooze", async () => {
  assert.equal((await api(nudge).act("token", "n1", "snoozed", 1)).snooze_count, 1);
  await assert.rejects(api({ ...nudge, snooze_count: 0, snoozed_until: null }).act("token", "n1", "snoozed", 1));
  await assert.rejects(api({ ...nudge, id: "other" }).act("token", "n1", "snoozed", 1));
});
