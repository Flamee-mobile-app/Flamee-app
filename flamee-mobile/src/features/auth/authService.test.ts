import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createAuthApi, AuthError } from "./authApi.ts";
import { createAuthService } from "./authService.ts";
import { createLocalOnboardingService } from "../onboarding/localOnboardingService.ts";

const user = { id: "server-account-a", email: "an@example.com", full_name: "An", avatar_url: null, couple_id: null, created_at: "2026-10-14T00:00:00Z" };

function credentials(initial: string | null = null) {
  let stored = initial;
  return {
    read: async () => stored,
    write: async (token: string) => { stored = token; },
    clear: async () => { stored = null; },
  };
}

async function withServer(handler: (req: IncomingMessage, res: ServerResponse, body: unknown) => unknown, run: (baseUrl: string) => Promise<void>) {
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    res.setHeader("Content-Type", "application/json");
    const raw = Buffer.concat(chunks).toString();
    await handler(req, res, raw ? JSON.parse(raw) : null);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try { await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`); }
  finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("register sends the backend contract and starts only the returned account", async () => {
  await withServer((req, res, body) => {
    assert.equal(req.url, "/api/v1/auth/register");
    assert.equal(req.method, "POST");
    assert.deepEqual(body, { email: "an@example.com", password: "Secret123", full_name: "An" });
    res.statusCode = 201;
    res.end(JSON.stringify({ success: true, data: { user, access_token: "test-token" } }));
  }, async (baseUrl) => {
    const store = credentials();
    const auth = createAuthService({ api: createAuthApi({ baseUrl }), credentials: store });
    const session = await auth.register("an@example.com", "Secret123", "An");
    assert.equal(session.accountId, "server-account-a");
    assert.equal(session.user.full_name, "An");
    assert.equal(await store.read(), null);
    assert.equal(auth.getAccessToken(), "test-token");
    assert.ok(!("access_token" in session));
    assert.deepEqual(await auth.getCurrentSession(), session);
  });
});

test("remembered login restores identity through authenticated me and sign-out clears it", async () => {
  await withServer((req, res, body) => {
    if (req.url === "/api/v1/auth/login") {
      assert.deepEqual(body, { email: "an@example.com", password: "Secret123" });
      res.end(JSON.stringify({ success: true, data: { user, access_token: "remembered-token" } }));
    } else {
      assert.equal(req.url, "/api/v1/auth/me");
      assert.equal(req.headers.authorization, "Bearer remembered-token");
      assert.equal(req.method, "GET");
      res.end(JSON.stringify({ success: true, data: user }));
    }
  }, async (baseUrl) => {
    const store = credentials();
    const api = createAuthApi({ baseUrl });
    await createAuthService({ api, credentials: store }).login("an@example.com", "Secret123", true);
    assert.equal(await store.read(), "remembered-token");
    const restarted = createAuthService({ api, credentials: store });
    assert.equal((await restarted.getCurrentSession())?.accountId, "server-account-a");
    await restarted.signOut();
    assert.equal(restarted.getAccessToken(), null);
    assert.equal(await store.read(), null);
    assert.equal(await restarted.getCurrentSession(), null);
  });
});

test("unremembered login removes old credentials instead of restoring the previous account", async () => {
  await withServer((_req, res) => res.end(JSON.stringify({ success: true, data: { user, access_token: "new-token" } })), async (baseUrl) => {
    const store = credentials("old-account-token");
    const api = createAuthApi({ baseUrl });
    const auth = createAuthService({ api, credentials: store });
    await auth.login("an@example.com", "Secret123", false);
    assert.equal(await store.read(), null);
    assert.equal(await createAuthService({ api, credentials: store }).getCurrentSession(), null);
  });
});

test("wrong credentials and duplicate email never manufacture a mobile session", async () => {
  await withServer((req, res) => {
    res.statusCode = req.url?.endsWith("register") ? 409 : 401;
    res.end(JSON.stringify({ success: false, error: { code: "not_allowed", message: "fixture" } }));
  }, async (baseUrl) => {
    const store = credentials();
    const auth = createAuthService({ api: createAuthApi({ baseUrl }), credentials: store });
    await assert.rejects(auth.login("an@example.com", "wrong"), (error) => error instanceof AuthError && error.code === "credentials");
    await assert.rejects(auth.register("an@example.com", "Secret123", "An"), (error) => error instanceof AuthError && error.code === "duplicateEmail");
    assert.equal(await auth.getCurrentSession(), null);
    assert.equal(await store.read(), null);
  });
});

test("expired stored token is removed while network/server failures preserve it for retry", async () => {
  let status = 503;
  await withServer((_req, res) => { res.statusCode = status; res.end("{}"); }, async (baseUrl) => {
    const store = credentials("expired-token");
    const auth = createAuthService({ api: createAuthApi({ baseUrl }), credentials: store });
    await assert.rejects(auth.getCurrentSession(), (error) => error instanceof AuthError && error.code === "server");
    assert.equal(await store.read(), "expired-token");
    status = 401;
    assert.equal(await auth.getCurrentSession(), null);
    assert.equal(await store.read(), null);
  });
});

test("malformed successful response cannot create an authenticated identity", async () => {
  await withServer((_req, res) => res.end(JSON.stringify({ success: true, data: { access_token: "token-without-user" } })), async (baseUrl) => {
    const auth = createAuthService({ api: createAuthApi({ baseUrl }), credentials: credentials() });
    await assert.rejects(auth.login("an@example.com", "Secret123"), (error) => error instanceof AuthError && error.code === "response");
    assert.equal(await auth.getCurrentSession(), null);
  });
});

test("a login response arriving after sign-out cannot resurrect credentials or session", async () => {
  let release: () => void = () => undefined;
  let arrived: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => { arrived = resolve; });
  const held = new Promise<void>((resolve) => { release = resolve; });
  await withServer(async (_req, res) => {
    arrived(); await held;
    res.end(JSON.stringify({ success: true, data: { user, access_token: "late-token" } }));
  }, async (baseUrl) => {
    const store = credentials();
    const auth = createAuthService({ api: createAuthApi({ baseUrl }), credentials: store });
    const login = auth.login("an@example.com", "Secret123", true);
    const rejection = assert.rejects(login, (error) => error instanceof AuthError && error.code === "cancelled");
    await ready; await auth.signOut(); release(); await rejection;
    assert.equal(await store.read(), null);
    assert.equal(await auth.getCurrentSession(), null);
  });
});

test("a storage failure does not open a session", async () => {
  await withServer((_req, res) => res.end(JSON.stringify({ success: true, data: { user, access_token: "token" } })), async (baseUrl) => {
    const store = credentials();
    const auth = createAuthService({ api: createAuthApi({ baseUrl }), credentials: { ...store, write: async () => { throw new Error("storage failure"); } } });
    await assert.rejects(auth.login("an@example.com", "Secret123", true), (error) => error instanceof AuthError && error.code === "storage");
    assert.equal(await auth.getCurrentSession(), null);
  });
});

test("authenticated profile comes from the server without completing optional setup", async () => {
  const onboarding = createLocalOnboardingService({ timezone: () => "UTC" });
  const account = await onboarding.initializeAuthenticatedAccount(user.id, { displayName: user.full_name, avatarUri: null });
  assert.equal(account.accountId, "server-account-a");
  assert.equal(account.profile.displayName, "An");
  assert.equal(account.setupStatus, "pending");
  assert.equal(account.consentedAt, null);
});
