import assert from "node:assert/strict";
import test from "node:test";
import { observeStartupSession } from "./startupSessionDeadline.ts";
import { useSessionStore } from "../shared/state/sessionStore.ts";

test("a deadline reports recovery and a late successful restore still reconciles the same generation", async () => {
  useSessionStore.setState({ activeAccountId: null, activeCoupleId: null, isBootstrapped: false, bootstrapStatus: "pending", sessionId: 0 });
  let release!: (value: string) => void;
  let deadline!: () => void;
  const deadlineReached = new Promise<void>((resolve) => { deadline = resolve; });
  const pending = new Promise<string>((resolve) => { release = resolve; });
  const stop = observeStartupSession(pending, 5, {
    onSuccess: (accountId) => useSessionStore.getState().setBootstrap(accountId, "couple-a", 0),
    onFailure: () => assert.fail("must not reject the pending operation"),
    onDeadline: () => { useSessionStore.getState().setBootstrapError(0); deadline(); },
  });
  await deadlineReached;
  assert.equal(useSessionStore.getState().bootstrapStatus, "error");
  assert.equal(useSessionStore.getState().isBootstrapped, false);
  release("account-a");
  await pending;
  await Promise.resolve();
  assert.equal(useSessionStore.getState().activeAccountId, "account-a");
  assert.equal(useSessionStore.getState().bootstrapStatus, "ready");
  stop();
});

test("a transient restore rejection exposes an error without publishing a signed-out result", async () => {
  let failed!: () => void;
  const failure = new Promise<void>((resolve) => { failed = resolve; });
  const stop = observeStartupSession(Promise.reject(new Error("offline")), 20, {
    onSuccess: () => assert.fail("must not manufacture a null session"),
    onFailure: failed,
    onDeadline: () => assert.fail("settled operations must clear their timer"),
  });
  await failure;
  stop();
});

test("disposed startup observers ignore late results from an obsolete retry", async () => {
  let release!: (value: null) => void;
  const pending = new Promise<null>((resolve) => { release = resolve; });
  const stop = observeStartupSession(pending, 20, {
    onSuccess: () => assert.fail("disposed observer published"),
    onFailure: () => assert.fail("disposed observer failed"),
    onDeadline: () => assert.fail("disposed observer timed out"),
  });
  stop();
  release(null);
  await pending;
  await Promise.resolve();
});
