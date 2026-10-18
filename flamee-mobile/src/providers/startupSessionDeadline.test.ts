import assert from "node:assert/strict";
import test from "node:test";
import { settleBeforeStartupDeadline } from "./startupSessionDeadline.ts";

test("returns a completed startup session without waiting for the fallback", async () => {
  const session = { accountId: "account-a" };
  assert.equal(await settleBeforeStartupDeadline(Promise.resolve(session), 20), session);
});

test("falls back when native storage or session restore never settles", async () => {
  const pending = new Promise<never>(() => undefined);
  assert.equal(await settleBeforeStartupDeadline(pending, 5), null);
});
