import assert from "node:assert/strict";
import test from "node:test";
import { AuthError, createAuthApi } from "./authApi.ts";
import { createAuthService } from "./authService.ts";

const user = { id: "account-a", email: "a@example.com", full_name: "An", created_at: "2026-10-26T00:00:00Z" };
const reply = (data: unknown) => new Response(JSON.stringify({ success: true, data }));
function store() {
  let value: string | null = null;
  return { read: async () => value, write: async (next: string) => { value = next; }, clear: async () => { value = null; } };
}

test("changing password sends exact secret values then clears the acknowledged revoked session", async () => {
  const credentials = store();
  const auth = createAuthService({ credentials, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "access-a", refresh_token: "refresh-a" });
    assert.equal(String(url), "https://api.example/auth/change-password");
    assert.equal(options?.method, "POST");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer access-a");
    assert.deepEqual(JSON.parse(String(options?.body)), { current_password: " old password ", new_password: " new password " });
    return reply({ updated: true });
  }) as typeof fetch }) });
  await auth.login(user.email, "old password", true);
  assert.deepEqual(await auth.changePassword(" old password ", " new password "), { credentialsCleared: true });
  assert.equal(auth.getSessionSnapshot(), null);
  assert.equal(await credentials.read(), null);
});

test("wrong current password leaves identity and refresh credentials intact without refreshing", async () => {
  const credentials = store();
  const auth = createAuthService({ credentials, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "access-a", refresh_token: "refresh-a" });
    assert.equal(String(url), "https://api.example/auth/change-password");
    return new Response(JSON.stringify({ success: false, error: { code: "current_password_invalid", message: "invalid" } }), { status: 400 });
  }) as typeof fetch }) });
  await auth.login(user.email, "password", true);
  await assert.rejects(auth.changePassword("wrong", "new-password"), error => error instanceof AuthError && error.code === "currentPassword");
  assert.equal(auth.getSessionSnapshot()?.accountId, user.id);
  assert.equal(JSON.parse((await credentials.read())!).refresh_token, "refresh-a");
});

test("malformed acknowledgement cannot end the session or claim a password change", async () => {
  const auth = createAuthService({ credentials: store(), api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) =>
    String(url).endsWith("/login") ? reply({ user, access_token: "access-a" }) : reply({ updated: false })) as typeof fetch }) });
  await auth.login(user.email, "password");
  await assert.rejects(auth.changePassword("password", "new-password"), error => error instanceof AuthError && error.code === "response");
  assert.equal(auth.getSessionSnapshot()?.accountId, user.id);
});

test("a password response from account A cannot sign out account B", async () => {
  let resolve!: (value: Response) => void;
  const held = new Promise<Response>(done => { resolve = done; });
  let logins = 0;
  const auth = createAuthService({ credentials: store(), api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
    if (String(url).endsWith("/login")) { logins += 1; return reply({ user: { ...user, id: logins === 1 ? "account-a" : "account-b" }, access_token: logins === 1 ? "access-a" : "access-b" }); }
    return held;
  }) as typeof fetch }) });
  await auth.login(user.email, "password");
  const changing = auth.changePassword("password", "new-password");
  const cancelled = assert.rejects(changing, error => error instanceof AuthError && error.code === "cancelled");
  await auth.login("b@example.com", "password");
  resolve(reply({ updated: true }));
  await cancelled;
  assert.equal(auth.getSessionSnapshot()?.accountId, "account-b");
});

test("storage failure after server confirmation keeps access closed and reports cleanup separately", async () => {
  let failClear = false;
  const credentials = store();
  const auth = createAuthService({ credentials: { ...credentials, clear: async () => { if (failClear) throw new Error("storage"); await credentials.clear(); } },
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) =>
      String(url).endsWith("/login") ? reply({ user, access_token: "access-a" }) : reply({ updated: true })) as typeof fetch }),
  });
  await auth.login(user.email, "password", true);
  failClear = true;
  assert.deepEqual(await auth.changePassword("password", "new-password"), { credentialsCleared: false });
  assert.equal(auth.getSessionSnapshot(), null);
  assert.equal(await auth.getCurrentSession(), null);
});

test("account switch between password acknowledgement and local cleanup does not cancel the new login", async () => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let started!: () => void;
  const startedB = new Promise<void>(resolve => { started = resolve; });
  let logins = 0;
  const api = createAuthApi({ baseUrl: "https://api.example", fetcher: (async () => {
    logins += 1;
    return reply({ user: { ...user, id: logins === 1 ? "account-a" : "account-b" }, access_token: logins === 1 ? "access-a" : "access-b" });
  }) as typeof fetch });
  const auth = createAuthService({ credentials: store(), api: { ...api, changePassword: () => held } });
  await auth.login(user.email, "password");
  let loginB: Promise<unknown> | undefined;
  // Queue B after the inner authenticated request checks its generation,
  // but before the outer password operation performs local cleanup.
  void held.then(() => queueMicrotask(() => {
    loginB = auth.login("b@example.com", "password").catch(error => error);
    started();
  }));
  const changing = auth.changePassword("password", "new-password");
  const cancelled = assert.rejects(changing, error => error instanceof AuthError && error.code === "cancelled");
  release();
  await startedB;
  const result = await loginB;
  await cancelled;
  assert.equal(result instanceof Error, false);
  assert.equal(auth.getSessionSnapshot()?.accountId, "account-b");
});
