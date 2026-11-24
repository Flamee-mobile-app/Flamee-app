import assert from "node:assert/strict";
import test from "node:test";
import { resolveProfileAvatar } from "./profileAvatarModel.ts";

test("an uploaded image wins over the local illustration", () => {
  assert.deepEqual(resolveProfileAvatar("https://example.test/me.jpg", null, "account-a"), { kind: "remote", uri: "https://example.test/me.jpg" });
});

test("renewing a signed avatar keeps the loaded photo but never keeps another account, replacement or removed avatar", () => {
  const old = "https://example.test/storage/v1/object/sign/media/avatar.jpg?token=old";
  const renewed = old.replace("token=old", "token=new");
  const loaded = { uri: old, seed: "account-a" };
  assert.deepEqual(resolveProfileAvatar(renewed, null, "account-a", loaded), { kind: "remote", uri: old });
  assert.deepEqual(resolveProfileAvatar(renewed, renewed, "account-a", loaded), { kind: "remote", uri: old });
  assert.deepEqual(resolveProfileAvatar(renewed, null, "account-b", loaded), { kind: "remote", uri: renewed });
  assert.equal(resolveProfileAvatar(null, null, "account-a", loaded).kind, "default");
  assert.deepEqual(resolveProfileAvatar("https://example.test/replacement.jpg", null, "account-a", loaded), { kind: "remote", uri: "https://example.test/replacement.jpg" });
});

test("missing, blank or failed images use an account-stable illustration", () => {
  const fallback = resolveProfileAvatar(null, null, "account-a");
  assert.equal(fallback.kind, "default");
  assert.deepEqual(resolveProfileAvatar("  ", null, "account-a"), fallback);
  assert.deepEqual(resolveProfileAvatar("https://example.test/broken.jpg", "https://example.test/broken.jpg", "account-a"), fallback);
  assert.notDeepEqual(resolveProfileAvatar(null, null, "account-b"), fallback);
  assert.deepEqual(resolveProfileAvatar("https://example.test/new.jpg", "https://example.test/old.jpg", "account-a"), { kind: "remote", uri: "https://example.test/new.jpg" });
});
