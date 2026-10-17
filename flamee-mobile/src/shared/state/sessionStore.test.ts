import assert from "node:assert/strict";
import test from "node:test";
import { useSessionStore } from "./sessionStore.ts";

function resetStore() {
  useSessionStore.setState({
    isBootstrapped: false,
    activeAccountId: null,
    activeCoupleId: null,
    sessionId: 0,
  });
}

test("authenticated session stores account and server couple together", () => {
  resetStore();

  useSessionStore.getState().setActiveAccount("account-a", "couple-a");

  assert.equal(useSessionStore.getState().activeAccountId, "account-a");
  assert.equal(useSessionStore.getState().activeCoupleId, "couple-a");
});

test("stale bootstrap result cannot clear a session created while restore was pending", () => {
  resetStore();
  const bootstrapRevision = useSessionStore.getState().sessionId;
  useSessionStore.getState().setActiveAccount("account-a", null);

  useSessionStore.getState().setBootstrap(null, null, bootstrapRevision);

  assert.equal(useSessionStore.getState().activeAccountId, "account-a");
  assert.equal(useSessionStore.getState().isBootstrapped, true);
});

test("current bootstrap result restores both account and server couple", () => {
  resetStore();
  const bootstrapRevision = useSessionStore.getState().sessionId;

  useSessionStore.getState().setBootstrap("account-a", "couple-a", bootstrapRevision);

  assert.equal(useSessionStore.getState().activeAccountId, "account-a");
  assert.equal(useSessionStore.getState().activeCoupleId, "couple-a");
});
