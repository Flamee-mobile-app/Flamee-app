import assert from "node:assert/strict";
import test from "node:test";
import { createMemorySync } from "./memorySync.ts";

test("foreground sync does not overlap reads and stops on background/scope disposal", async () => {
  let active = true;
  let calls = 0;
  let complete!: () => void;
  const sync = createMemorySync(() => { calls++; return new Promise<void>((resolve) => { complete = resolve; }); }, () => active);
  const first = sync.tick();
  await sync.tick();
  assert.equal(calls, 1);
  complete(); await first;
  active = false;
  await sync.tick();
  assert.equal(calls, 1);
  active = true;
  const resumed = sync.tick();
  assert.equal(calls, 2);
  sync.dispose(); complete(); await resumed;
  await sync.tick();
  assert.equal(calls, 2);
});

test("a failed read allows later recovery without a fabricated success payload", async () => {
  let calls = 0;
  const sync = createMemorySync(async () => { calls++; if (calls === 1) throw new Error("offline"); }, () => true);
  await sync.tick(); await sync.tick();
  assert.equal(calls, 2);
  sync.dispose();
});
