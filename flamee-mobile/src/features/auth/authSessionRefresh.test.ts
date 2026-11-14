import assert from "node:assert/strict";
import test from "node:test";
import { AuthError, createAuthApi } from "./authApi.ts";
import { createAuthService } from "./authService.ts";
import { createInviteApi } from "../invites/inviteApi.ts";
import { createInviteService } from "../invites/inviteServiceCore.ts";

const user = { id: "account-a", email: "an@example.com", full_name: "An", couple_id: null, created_at: "2026-10-18T00:00:00Z" };
const reply = (data: unknown, status = 200) => new Response(JSON.stringify({ success: status < 400, data }), { status });
function credentials() {
  let value: string | null = null;
  return { read: async () => value, write: async (next: string) => { value = next; }, clear: async () => { value = null; } };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

test("a rejected legacy session is cleared once instead of being reused for more requests", async () => {
  let reads = 0;
  let expired = 0;
  const store = credentials();
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "legacy" });
    reads += 1;
    return reply(null, 401);
  }) as typeof fetch });
  const auth = createAuthService({ api, credentials: store, onSessionExpired: () => { expired += 1; } });
  await auth.login(user.email, "password", true);
  await assert.rejects(auth.refreshCurrentSession(), (error) => error instanceof AuthError && error.code === "credentials");
  assert.equal(auth.getAccessToken(), null);
  assert.equal(auth.getSessionSnapshot(), null);
  assert.equal(await store.read(), null);
  assert.equal(await auth.refreshCurrentSession(), null);
  assert.equal(reads, 1);
  assert.equal(expired, 1);
});

test("concurrent 401s share one refresh and retry with the rotated access token", async () => {
  let refreshes = 0;
  const store = credentials();
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "old", refresh_token: "refresh-old", expires_at: "2026-10-19T00:00:00Z" });
    if (String(url).endsWith("/refresh")) {
      refreshes += 1;
      assert.deepEqual(JSON.parse(String(options?.body)), { refresh_token: "refresh-old" });
      await new Promise((resolve) => setTimeout(resolve, 5));
      return reply({ user, access_token: "new", refresh_token: "refresh-new", expires_at: "2026-10-20T00:00:00Z" });
    }
    return new Headers(options?.headers).get("Authorization") === "Bearer new" ? reply(user) : reply(null, 401);
  }) as typeof fetch });
  const auth = createAuthService({ api, credentials: store });
  await auth.login(user.email, "password", true);
  const results = await Promise.all([auth.refreshCurrentSession(), auth.refreshCurrentSession()]);
  assert.equal(refreshes, 1);
  assert.equal(results[0]?.accountId, user.id);
  assert.equal(results[1]?.accountId, user.id);
  assert.equal(auth.getAccessToken(), "new");
  assert.equal(JSON.parse((await store.read())!).refresh_token, "refresh-new");
});

test("a temporary refresh network failure keeps the confirmed session for retry", async () => {
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "old", refresh_token: "refresh-old" });
    if (String(url).endsWith("/refresh")) throw new TypeError("offline");
    return reply(null, 401);
  }) as typeof fetch });
  const auth = createAuthService({ api, credentials: credentials() });
  await auth.login(user.email, "password");
  await assert.rejects(auth.refreshCurrentSession(), (error) => error instanceof AuthError && error.code === "network");
  assert.equal(auth.getSessionSnapshot()?.accountId, user.id);
});

test("failed secure storage after token rotation revokes the unpublished rotated session", async () => {
  const store = credentials();
  let writes = 0;
  const revoked: string[] = [];
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "old", refresh_token: "refresh-old" });
    if (String(url).endsWith("/refresh")) return reply({ user, access_token: "rotated", refresh_token: "refresh-new" });
    if (String(url).endsWith("/logout")) { revoked.push(new Headers(options?.headers).get("Authorization")!); return reply({ logged_out: true }); }
    return reply(null, 401);
  }) as typeof fetch });
  const auth = createAuthService({ api, credentials: { ...store, write: async (value) => { if (++writes > 1) throw new Error("storage unavailable"); await store.write(value); } } });
  await auth.login(user.email, "password", true);
  await assert.rejects(auth.refreshCurrentSession(), (error) => error instanceof AuthError && error.code === "storage");
  assert.deepEqual(revoked, ["Bearer rotated"]);
  assert.equal(auth.getSessionSnapshot(), null);
  assert.equal(auth.getAccessToken(), null);
  assert.equal(await store.read(), null);
});

test("a rotated credential written after a failed replacement login is removed and revoked", async () => {
  const store = credentials();
  const writing = deferred<void>();
  const release = deferred<void>();
  const revoked: string[] = [];
  let writes = 0;
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return JSON.parse(String(options?.body)).email === "b@example.com" ? reply(null, 401) : reply({ user, access_token: "old", refresh_token: "refresh-old" });
    if (String(url).endsWith("/refresh")) return reply({ user, access_token: "rotated", refresh_token: "refresh-new" });
    if (String(url).endsWith("/logout")) { revoked.push(new Headers(options?.headers).get("Authorization")!); return reply({ logged_out: true }); }
    return reply(null, 401);
  }) as typeof fetch });
  const auth = createAuthService({ api, credentials: { ...store, write: async value => { if (++writes === 2) { writing.resolve(); await release.promise; } await store.write(value); } } });
  await auth.login(user.email, "password", true);
  const refreshing = auth.refreshCurrentSession();
  const cancelled = assert.rejects(refreshing, error => error instanceof AuthError && error.code === "cancelled");
  await writing.promise;
  await assert.rejects(auth.login("b@example.com", "wrong", true), error => error instanceof AuthError && error.code === "credentials");
  release.resolve();
  await cancelled;
  assert.equal(await store.read(), null);
  assert.deepEqual(revoked, ["Bearer rotated"]);
});

test("a rotated session for another account is rejected, revoked and cannot leave stale credentials", async () => {
  const store = credentials();
  const revoked: string[] = [];
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "old", refresh_token: "refresh-old" });
    if (String(url).endsWith("/refresh")) return reply({ user: { ...user, id: "account-b" }, access_token: "wrong-owner", refresh_token: "refresh-b" });
    if (String(url).endsWith("/logout")) { revoked.push(new Headers(options?.headers).get("Authorization")!); return reply({ logged_out: true }); }
    return reply(null, 401);
  }) as typeof fetch });
  const auth = createAuthService({ api, credentials: store });
  await auth.login(user.email, "password", true);
  await assert.rejects(auth.refreshCurrentSession(), (error) => error instanceof AuthError && error.code === "response");
  assert.deepEqual(revoked, ["Bearer wrong-owner"]);
  assert.equal(auth.getSessionSnapshot(), null);
  assert.equal(auth.getAccessToken(), null);
  assert.equal(await store.read(), null);
});

test("invite requests recover through the same coordinator and persist rotated credentials across restart", async () => {
  let refreshes = 0;
  const store = credentials();
  const fetcher = (async (url, options) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "old", refresh_token: "refresh-old" });
    if (String(url).endsWith("/refresh")) { refreshes += 1; return reply({ user, access_token: "new", refresh_token: "refresh-new" }); }
    if (new Headers(options?.headers).get("Authorization") !== "Bearer new") return new Response("Unauthorized", { status: 401 });
    return reply(String(url).endsWith("/invite-code") ? null : user);
  }) as typeof fetch;
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher });
  const auth = createAuthService({ api, credentials: store });
  await auth.login(user.email, "password", true);
  const invites = createInviteService(createInviteApi({ baseUrl: "https://api.example", fetcher }), auth);
  assert.equal(await invites.current(), null);
  assert.equal(refreshes, 1);
  const restarted = createAuthService({ api, credentials: store });
  assert.equal((await restarted.getCurrentSession())?.accountId, user.id);
  assert.equal(restarted.getAccessToken(), "new");
  assert.equal(refreshes, 1);
});

test("revoked refresh credentials clear concurrent requests without a retry loop", async () => {
  let refreshes = 0;
  let expirations = 0;
  const store = credentials();
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "old", refresh_token: "revoked" });
    if (String(url).endsWith("/refresh")) { refreshes += 1; await new Promise((resolve) => setTimeout(resolve, 5)); }
    return reply(null, 401);
  }) as typeof fetch });
  const auth = createAuthService({ api, credentials: store, onSessionExpired: () => { expirations += 1; } });
  await auth.login(user.email, "password", true);
  const results = await Promise.allSettled([auth.refreshCurrentSession(), auth.refreshCurrentSession()]);
  assert(results.every((result) => result.status === "rejected"));
  assert.equal(refreshes, 1);
  assert.equal(expirations, 1);
  assert.equal(await store.read(), null);
  assert.equal(await auth.refreshCurrentSession(), null);
});

test("a response from an ended session cannot reach an authenticated feature", async () => {
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => { release = resolve; });
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async () => reply({ user, access_token: "old" })) as typeof fetch });
  const auth = createAuthService({ api, credentials: credentials() });
  await auth.login(user.email, "password");
  const request = auth.withAccessToken(async () => { await held; return "account-private-result"; });
  const rejection = assert.rejects(request, (error) => error instanceof AuthError && error.code === "cancelled");
  await auth.signOut();
  release();
  await rejection;
});
