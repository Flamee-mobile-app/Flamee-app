import assert from "node:assert/strict";
import test from "node:test";
import { useSessionStore } from "./sessionStore.ts";

function resetStore() {
  useSessionStore.setState({
    isBootstrapped: false,
    activeAccountId: null,
    activeCoupleId: null,
    activeAvatarUrl: null,
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

test("server-confirmed avatar is available to navigation and clears with the account", () => {
  resetStore();

  useSessionStore.getState().setActiveAccount("account-a", "couple-a", "https://storage.example/avatar.jpg");
  assert.equal(useSessionStore.getState().activeAvatarUrl, "https://storage.example/avatar.jpg");

  useSessionStore.getState().setActiveAvatar("https://storage.example/avatar-new.jpg");
  assert.equal(useSessionStore.getState().activeAvatarUrl, "https://storage.example/avatar-new.jpg");

  useSessionStore.getState().reset();
  assert.equal(useSessionStore.getState().activeAvatarUrl, null);
});
