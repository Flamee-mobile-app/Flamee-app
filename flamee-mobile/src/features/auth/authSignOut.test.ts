import assert from "node:assert/strict";
import test from "node:test";
import { AuthError, createAuthApi } from "./authApi.ts";
import { createAuthService } from "./authService.ts";

const user = { id: "account-a", email: "a@example.com", full_name: "An", couple_id: null, created_at: "2026-10-26T00:00:00Z" };
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

test("logout sends POST with only the captured bearer credential and requires server acknowledgement", async () => {
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    assert.equal(String(url), "https://api.example/auth/logout");
    assert.equal(options?.method, "POST");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer access-a");
    assert.equal(options?.body, undefined);
    return reply({ logged_out: true });
  }) as typeof fetch });
  await api.logout("access-a");
  const malformed = createAuthApi({ baseUrl: "https://api.example", fetcher: (async () => reply({ logged_out: false })) as typeof fetch });
  await assert.rejects(malformed.logout("access-a"), error => error instanceof AuthError && error.code === "response");
});

test("sign-out hides identity and removes credentials while remote revocation is pending", async () => {
  const held = deferred<Response>();
  const store = credentials();
  const auth = createAuthService({ credentials: store, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) =>
    String(url).endsWith("/login") ? reply({ user, access_token: "access-a", refresh_token: "refresh-a" }) : held.promise) as typeof fetch }) });
  await auth.login(user.email, "password", true);
  const signingOut = auth.signOut();
  assert.equal(auth.getSessionSnapshot(), null);
  assert.equal(auth.getAccessToken(), null);
  assert.equal(await auth.getCurrentSession(), null);
  await Promise.resolve();
  assert.equal(await store.read(), null);
  held.resolve(reply({ logged_out: true }));
  assert.deepEqual(await signingOut, { kind: "revoked" });
});

test("offline logout removes local access and reports that remote revocation is unconfirmed", async () => {
  const store = credentials();
  const auth = createAuthService({ credentials: store, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "access-a" });
    throw new TypeError("offline");
  }) as typeof fetch }) });
  await auth.login(user.email, "password", true);
  assert.deepEqual(await auth.signOut(), { kind: "localOnly" });
  assert.equal(await store.read(), null);
  assert.equal(await auth.getCurrentSession(), null);
});

test("an expired access token is renewed solely to revoke the old account session", async () => {
  const tokens: string[] = [];
  const store = credentials();
  const auth = createAuthService({ credentials: store, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "expired-a", refresh_token: "refresh-a" });
    if (String(url).endsWith("/refresh")) {
      assert.deepEqual(JSON.parse(String(options?.body)), { refresh_token: "refresh-a" });
      return reply({ user, access_token: "rotated-a", refresh_token: "rotated-refresh-a" });
    }
    const token = new Headers(options?.headers).get("Authorization")!;
    tokens.push(token);
    return token === "Bearer expired-a" ? reply(null, 401) : reply({ logged_out: true });
  }) as typeof fetch }) });
  await auth.login(user.email, "password", true);
  assert.deepEqual(await auth.signOut(), { kind: "revoked" });
  assert.deepEqual(tokens, ["Bearer expired-a", "Bearer rotated-a"]);
  assert.equal(auth.getSessionSnapshot(), null);
  assert.equal(await store.read(), null);
});

test("a late logout failure for account A cannot remove a newly signed-in account B", async () => {
  const held = deferred<Response>();
  let logins = 0;
  const store = credentials();
  const auth = createAuthService({ credentials: store, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) {
      logins += 1;
      return reply({ user: { ...user, id: logins === 1 ? "account-a" : "account-b" }, access_token: logins === 1 ? "access-a" : "access-b" });
    }
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer access-a");
    return held.promise;
  }) as typeof fetch }) });
  await auth.login(user.email, "password", true);
  const signingOut = auth.signOut();
  await auth.login("b@example.com", "password", true);
  held.resolve(reply(null, 503));
  assert.deepEqual(await signingOut, { kind: "localOnly" });
  assert.equal(auth.getSessionSnapshot()?.accountId, "account-b");
  assert.equal(auth.getAccessToken(), "access-b");
  assert.equal(await store.read(), "access-b");
});

test("refresh credentials issued after logout are revoked without restoring identity", async () => {
  const held = deferred<Response>();
  const started = deferred<void>();
  const revoked: string[] = [];
  const auth = createAuthService({ credentials: credentials(), api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "access-a", refresh_token: "refresh-a" });
    if (String(url).endsWith("/me")) return reply(null, 401);
    if (String(url).endsWith("/refresh")) { started.resolve(); return held.promise; }
    revoked.push(new Headers(options?.headers).get("Authorization")!);
    return reply({ logged_out: true });
  }) as typeof fetch }) });
  await auth.login(user.email, "password");
  const refreshing = auth.refreshCurrentSession();
  const cancelled = assert.rejects(refreshing, error => error instanceof AuthError && error.code === "cancelled");
  await started.promise;
  await auth.signOut();
  held.resolve(reply({ user, access_token: "late-a", refresh_token: "late-refresh-a" }));
  await cancelled;
  assert.deepEqual(revoked, ["Bearer access-a", "Bearer late-a"]);
  assert.equal(auth.getSessionSnapshot(), null);
});

test("a login that finishes after logout has its issued server session revoked", async () => {
  const held = deferred<Response>();
  const revoked: string[] = [];
  const auth = createAuthService({ credentials: credentials(), api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return held.promise;
    revoked.push(new Headers(options?.headers).get("Authorization")!);
    return reply({ logged_out: true });
  }) as typeof fetch }) });
  const login = auth.login(user.email, "password");
  const cancelled = assert.rejects(login, error => error instanceof AuthError && error.code === "cancelled");
  await auth.signOut();
  held.resolve(reply({ user, access_token: "late-login", refresh_token: "late-refresh" }));
  await cancelled;
  assert.deepEqual(revoked, ["Bearer late-login"]);
  assert.equal(auth.getSessionSnapshot(), null);
});

test("signing out without an active session does not make a network request", async () => {
  const auth = createAuthService({ credentials: credentials(), api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async () => {
    assert.fail("no credential must not trigger a request");
  }) as typeof fetch }) });
  assert.deepEqual(await auth.signOut(), { kind: "noSession" });
});

test("logout while login credentials are being written also revokes the unpublished server session", async () => {
  const writing = deferred<void>();
  const release = deferred<void>();
  const revoked: string[] = [];
  const store = credentials();
  const auth = createAuthService({ credentials: { ...store, write: async value => { writing.resolve(); await release.promise; await store.write(value); } },
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
      if (String(url).endsWith("/login")) return reply({ user, access_token: "unpublished-a" });
      revoked.push(new Headers(options?.headers).get("Authorization")!);
      return reply({ logged_out: true });
    }) as typeof fetch }),
  });
  const login = auth.login(user.email, "password", true);
  const cancelled = assert.rejects(login, error => error instanceof AuthError && error.code === "cancelled");
  await writing.promise;
  const signingOut = auth.signOut();
  release.resolve();
  await signingOut;
  await cancelled;
  assert.deepEqual(revoked, ["Bearer unpublished-a"]);
  assert.equal(await store.read(), null);
  assert.equal(auth.getSessionSnapshot(), null);
});

test("a rejected logout without a refresh token does not claim server revocation", async () => {
  const auth = createAuthService({ credentials: credentials(), api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) =>
    String(url).endsWith("/login") ? reply({ user, access_token: "expired-a" }) : reply(null, 401)) as typeof fetch }) });
  await auth.login(user.email, "password");
  assert.deepEqual(await auth.signOut(), { kind: "localOnly" });
  assert.equal(auth.getSessionSnapshot(), null);
});
