import assert from "node:assert/strict";
import test from "node:test";
import { openInviteCreation } from "./openInviteCreation.ts";

const pending = { code: "ABC123", expires_at: "2099-01-01T00:00:00Z", status: "pending" as const, is_pending: true };
const couple = { id: "couple", status: "active" as const, partner1: { id: "one", full_name: "One" }, partner2: { id: "two", full_name: "Two" } };

test("opening create reuses the server's pending code instead of invalidating it", async () => {
  let creates = 0;
  const result = await openInviteCreation({ current: async () => pending, create: async () => { creates++; return pending; }, connection: async () => couple }, () => true);
  assert.deepEqual(result, { kind: "invite", invite: pending });
  assert.equal(creates, 0);
});

test("opening create creates a real invite only when the server has none", async () => {
  let creates = 0;
  const result = await openInviteCreation({ current: async () => null, create: async () => { creates++; return pending; }, connection: async () => couple }, () => true);
  assert.deepEqual(result, { kind: "invite", invite: pending });
  assert.equal(creates, 1);
});

test("an accepted invite reads the actual couple without creating another invitation", async () => {
  const result = await openInviteCreation({ current: async () => ({ ...pending, status: "accepted" }), create: async () => { assert.fail("must not create"); }, connection: async () => couple }, () => true);
  assert.deepEqual(result, { kind: "connected", couple });
});

test("leaving the screen while reading the code prevents a later create request", async () => {
  let active = true;
  const result = await openInviteCreation({ current: async () => { active = false; return null; }, create: async () => { assert.fail("must not create after leaving"); }, connection: async () => couple }, () => active);
  assert.deepEqual(result, { kind: "cancelled" });
});
