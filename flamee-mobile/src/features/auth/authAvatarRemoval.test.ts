import assert from "node:assert/strict";
import test from "node:test";
import { AuthError, createAuthApi } from "./authApi.ts";
import { createAuthService } from "./authService.ts";

const user = { id: "account-a", email: "a@example.com", full_name: "An", username: "Mây", avatar_url: "https://media.example/a.jpg", created_at: "2026-10-26T00:00:00Z" };
const reply = (data: unknown) => new Response(JSON.stringify({ success: true, data }));
const credentials = { read: async () => null, write: async (_value: string) => undefined, clear: async () => undefined };

test("avatar removal uses authenticated DELETE and publishes the server-confirmed fallback", async () => {
  const auth = createAuthService({ credentials, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "access-a" });
    assert.equal(String(url), "https://api.example/auth/me/avatar");
    assert.equal(options?.method, "DELETE");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer access-a");
    assert.equal(options?.body, undefined);
    return reply({ ...user, avatar_url: null });
  }) as typeof fetch }) });
  await auth.login(user.email, "password");
  const result = await auth.removeAvatar();
  assert.equal(result.user.avatar_url, null);
  assert.equal(auth.getSessionSnapshot()?.user.avatar_url, null);
  assert.equal(auth.getSessionSnapshot()?.user.username, "Mây");
});

test("a successful HTTP response that still contains an avatar is not a confirmed removal", async () => {
  const auth = createAuthService({ credentials, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) =>
    String(url).endsWith("/login") ? reply({ user, access_token: "access-a" }) : reply(user)) as typeof fetch }) });
  await auth.login(user.email, "password");
  await assert.rejects(auth.removeAvatar(), error => error instanceof AuthError && error.code === "response");
  assert.equal(auth.getSessionSnapshot()?.user.avatar_url, user.avatar_url);
});

test("an avatar removal response belonging to another account cannot replace the current profile", async () => {
  const auth = createAuthService({ credentials, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) =>
    String(url).endsWith("/login") ? reply({ user, access_token: "access-a" }) : reply({ ...user, id: "account-b", avatar_url: null })) as typeof fetch }) });
  await auth.login(user.email, "password");
  await assert.rejects(auth.removeAvatar(), error => error instanceof AuthError && error.code === "response");
  assert.equal(auth.getSessionSnapshot()?.accountId, user.id);
  assert.equal(auth.getSessionSnapshot()?.user.avatar_url, user.avatar_url);
});

test("a stale profile read cannot restore an avatar after confirmed removal", async () => {
  let resolve!: (value: Response) => void;
  const held = new Promise<Response>(done => { resolve = done; });
  const auth = createAuthService({ credentials, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url, options) => {
    if (String(url).endsWith("/login")) return reply({ user, access_token: "access-a" });
    if (options?.method === "DELETE") return reply({ ...user, avatar_url: null });
    return held;
  }) as typeof fetch }) });
  await auth.login(user.email, "password");
  const reading = auth.refreshCurrentSession();
  await auth.removeAvatar();
  resolve(reply(user));
  await reading;
  assert.equal(auth.getSessionSnapshot()?.user.avatar_url, null);
});
