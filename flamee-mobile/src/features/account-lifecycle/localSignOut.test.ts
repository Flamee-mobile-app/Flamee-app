import assert from "node:assert/strict";
import test from "node:test";
import { performLocalSignOut } from "./localSignOut.ts";

test("local data and navigation clear before a pending credential removal and remain cleared on rejection", async () => {
  const events: string[] = [];
  let reject!: (reason: Error) => void;
  const pending = new Promise<void>((_resolve, failed) => { reject = failed; });
  const result = performLocalSignOut({
    signOut: () => { events.push("invalidate-session"); return pending; },
    clearInvite: () => { events.push("clear-invite"); },
    clearQueries: () => { events.push("clear-queries"); },
    clearNative: async () => { events.push("clear-native"); },
    replaceAuth: () => { events.push("navigate-auth"); },
  });
  assert.deepEqual(events, ["invalidate-session", "clear-invite", "clear-queries", "navigate-auth", "clear-native"]);
  reject(new Error("storage"));
  await assert.rejects(result, /storage/);
});
