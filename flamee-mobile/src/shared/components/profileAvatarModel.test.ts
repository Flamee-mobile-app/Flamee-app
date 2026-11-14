import assert from "node:assert/strict";
import test from "node:test";
import { resolveProfileAvatar } from "./profileAvatarModel.ts";

test("an uploaded image wins over the local illustration", () => {
  assert.deepEqual(resolveProfileAvatar("https://example.test/me.jpg", null, "account-a"), { kind: "remote", uri: "https://example.test/me.jpg" });
});

test("missing, blank or failed images use an account-stable illustration", () => {
  const fallback = resolveProfileAvatar(null, null, "account-a");
  assert.equal(fallback.kind, "default");
  assert.deepEqual(resolveProfileAvatar("  ", null, "account-a"), fallback);
  assert.deepEqual(resolveProfileAvatar("https://example.test/broken.jpg", "https://example.test/broken.jpg", "account-a"), fallback);
  assert.notDeepEqual(resolveProfileAvatar(null, null, "account-b"), fallback);
  assert.deepEqual(resolveProfileAvatar("https://example.test/new.jpg", "https://example.test/old.jpg", "account-a"), { kind: "remote", uri: "https://example.test/new.jpg" });
});
