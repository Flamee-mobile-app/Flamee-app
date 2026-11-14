import assert from "node:assert/strict";
import test from "node:test";
import { isInviteScopeCurrent } from "./inviteScope.ts";

test("a new session for the same account cannot accept an earlier invite response", () => {
  const scope = { accountId: "a", sessionId: 1 };
  assert.equal(isInviteScopeCurrent(scope, { activeAccountId: "a", sessionId: 1 }), true);
  assert.equal(isInviteScopeCurrent(scope, { activeAccountId: "a", sessionId: 2 }), false);
  assert.equal(isInviteScopeCurrent(scope, { activeAccountId: "b", sessionId: 1 }), false);
  assert.equal(isInviteScopeCurrent({ accountId: null, sessionId: 1 }, { activeAccountId: null, sessionId: 1 }), false);
});
