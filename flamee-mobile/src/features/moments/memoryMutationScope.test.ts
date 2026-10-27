import assert from "node:assert/strict";
import test from "node:test";
import { isMemoryMutationScopeCurrent, runScopedMemoryMutation } from "./memoryMutationScope.ts";

test("memory mutation results belong to the original session, account and couple only", () => {
  const scope = { accountId: "a", coupleId: "ab", sessionId: 7 };
  const current = { activeAccountId: "a", activeCoupleId: "ab", sessionId: 7 };
  assert.equal(isMemoryMutationScopeCurrent(scope, current), true);
  for (const changed of [{ ...current, activeAccountId: "b" }, { ...current, activeCoupleId: "ac" }, { ...current, sessionId: 8 }, { ...current, activeCoupleId: null }]) {
    assert.equal(isMemoryMutationScopeCurrent(scope, changed), false);
  }
  assert.equal(isMemoryMutationScopeCurrent({ accountId: null, coupleId: null, sessionId: 7 }, { activeAccountId: null, activeCoupleId: null, sessionId: 7 }), false);
});

test("a late mutation acknowledgement cannot publish after its scope ended", async () => {
  let current = true;
  let acknowledge!: (value: string) => void;
  const pending = runScopedMemoryMutation(() => current, () => new Promise<string>((resolve) => { acknowledge = resolve; }));
  current = false;
  acknowledge("server-confirmed");
  await assert.rejects(pending, /cancelled/);
});

test("token retries cannot send mutations from an ended membership", async () => {
  let current = true;
  let calls = 0;
  const operation = () => runScopedMemoryMutation(() => current, async () => { calls++; throw new Error("unauthorized"); });
  await assert.rejects(operation(), /unauthorized/);
  current = false;
  await assert.rejects(operation(), /cancelled/);
  assert.equal(calls, 1);
});
