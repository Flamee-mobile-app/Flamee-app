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
    bootstrapStatus: "pending",
    bootstrapAttempt: 0,
    membershipRevision: 0,
  });
}

test("authenticated session stores account and server couple together", () => {
  resetStore();

  useSessionStore.getState().setActiveAccount("account-a", "couple-a");

  assert.equal(useSessionStore.getState().activeAccountId, "account-a");
  assert.equal(useSessionStore.getState().activeCoupleId, "couple-a");
});

test("a recoverable bootstrap error preserves identity and remains retryable", () => {
  resetStore();
  const revision = useSessionStore.getState().sessionId;
  useSessionStore.getState().setBootstrapError(revision);
  assert.equal(useSessionStore.getState().bootstrapStatus, "error");
  assert.equal(useSessionStore.getState().isBootstrapped, false);
  assert.equal(useSessionStore.getState().sessionId, revision);
  useSessionStore.getState().retryBootstrap();
  assert.equal(useSessionStore.getState().bootstrapStatus, "pending");
  assert.equal(useSessionStore.getState().bootstrapAttempt, 1);
});

test("late bootstrap success reconciles an error without treating its deadline as logout", () => {
  resetStore();
  const revision = useSessionStore.getState().sessionId;
  useSessionStore.getState().setBootstrapError(revision);
  useSessionStore.getState().setBootstrap("account-a", "couple-a", revision);
  assert.equal(useSessionStore.getState().bootstrapStatus, "ready");
  assert.equal(useSessionStore.getState().activeAccountId, "account-a");
  assert.equal(useSessionStore.getState().activeCoupleId, "couple-a");
});

test("routine session synchronization preserves identity generation and newly confirmed membership", () => {
  resetStore();
  useSessionStore.getState().setActiveAccount("account-a", null);
  const revision = useSessionStore.getState().membershipRevision;
  const sessionId = useSessionStore.getState().sessionId;
  useSessionStore.getState().setActiveCouple("confirmed-couple");
  useSessionStore.getState().syncActiveSession("account-a", null, "avatar", revision);
  assert.equal(useSessionStore.getState().activeCoupleId, "confirmed-couple");
  assert.equal(useSessionStore.getState().activeAvatarUrl, "avatar");
  assert.equal(useSessionStore.getState().sessionId, sessionId);
  useSessionStore.getState().syncActiveSession("account-a", "new-couple", "avatar", useSessionStore.getState().membershipRevision);
  assert.equal(useSessionStore.getState().activeCoupleId, "new-couple");
  assert.equal(useSessionStore.getState().sessionId, sessionId);
});

test("a stale bootstrap failure cannot replace an account activated during restoration", () => {
  resetStore();
  const revision = useSessionStore.getState().sessionId;
  useSessionStore.getState().setActiveAccount("account-a", "couple-a");
  useSessionStore.getState().setBootstrapError(revision);
  assert.equal(useSessionStore.getState().bootstrapStatus, "ready");
});

test("activating an already synchronized identity does not invalidate its queries twice", () => {
  resetStore();
  useSessionStore.getState().syncActiveSession("account-a", "couple-a", null, 0);
  const generation = useSessionStore.getState().sessionId;
  useSessionStore.getState().setActiveAccount("account-a", "couple-a");
  assert.equal(useSessionStore.getState().sessionId, generation);
  useSessionStore.getState().reset();
  useSessionStore.getState().setActiveAccount("account-a", "couple-a");
  assert.ok(useSessionStore.getState().sessionId > generation);
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
