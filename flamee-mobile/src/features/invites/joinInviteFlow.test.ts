import assert from "node:assert/strict";
import test from "node:test";
import { joinInviteByCode, orderConnectedMembers } from "./joinInviteFlow.ts";

const couple = { id: "couple-a", status: "active" as const, partner1: { id: "sender", full_name: "An", avatar_url: null }, partner2: { id: "receiver", full_name: "Bình", avatar_url: null } };
const preview = { code: "ABC123", expires_at: "2026-10-21T00:00:00Z", inviter: couple.partner1 };

test("Connect validates then accepts and returns the server's two members", async () => {
  const calls: string[] = [];
  const result = await joinInviteByCode("ABC123", "receiver", () => true, {
    preview: async () => { calls.push("validate"); return preview; },
    accept: async () => { calls.push("accept"); return couple; },
  });
  assert.deepEqual(calls, ["validate", "accept"]);
  assert.deepEqual(result, { kind: "connected", couple });
  assert.deepEqual(orderConnectedMembers(couple, "receiver"), [couple.partner2, couple.partner1]);
});

test("leaving the flow during validation prevents automatic acceptance", async () => {
  let current = true;
  let accepted = false;
  const result = await joinInviteByCode("ABC123", "receiver", () => current, {
    preview: async () => { current = false; return preview; },
    accept: async () => { accepted = true; return couple; },
  });
  assert.equal(result.kind, "cancelled");
  assert.equal(accepted, false);
});

test("unrelated users and duplicate members cannot become success portraits", async () => {
  assert.equal(orderConnectedMembers(couple, "unrelated"), null);
  assert.equal(orderConnectedMembers({ ...couple, partner2: couple.partner1 }, "sender"), null);
  await assert.rejects(joinInviteByCode("ABC123", "unrelated", () => true, {
    preview: async () => preview,
    accept: async () => couple,
  }));
});
