import assert from "node:assert/strict";
import test from "node:test";
import { createOnboardingApi, OnboardingError } from "./onboardingApi.ts";
import { createOnboardingService } from "./onboardingServiceCore.ts";
import { createAuthApi, AuthError } from "../auth/authApi.ts";
import { createAuthService } from "../auth/authService.ts";

test("reads and persists the user's onboarding decision via authenticated API", async () => {
  const calls: string[] = [];
  const api = createOnboardingApi({ baseUrl: "https://api.example/api/v1/", fetcher: async (url, options) => {
    calls.push(`${options?.method} ${url}`);
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer token");
    return Response.json({ success: true, data: { status: options?.method === "POST" ? "skipped" : "pending" } });
  } });
  assert.equal(await api.read("token"), "pending");
  assert.equal(await api.skip("token"), "skipped");
  assert.deepEqual(calls, ["GET https://api.example/api/v1/users/me/onboarding", "POST https://api.example/api/v1/users/me/onboarding/skip"]);
});

test("a failed or unconfirmed skip cannot become a saved choice", async () => {
  for (const result of [Response.json({ success: true, data: { status: "pending" } }), new Response("error", { status: 503 })]) {
    const api = createOnboardingApi({ baseUrl: "https://api.example", fetcher: async () => result });
    await assert.rejects(api.skip("token"), (error) => error instanceof OnboardingError);
  }
});

test("an expired session is reported to the auth coordinator and cancellation stays cancellation", async () => {
  const unauthorized = createOnboardingApi({ baseUrl: "https://api.example", fetcher: async () => new Response("unauthorized", { status: 401 }) });
  await assert.rejects(unauthorized.read("token"), (error) => error instanceof OnboardingError && error.code === "unauthorized");
  const signal = new AbortController();
  signal.abort();
  await assert.rejects(unauthorized.read("token", signal.signal), (error) => error instanceof Error && error.name === "AbortError");
});

test("late onboarding responses from an earlier session cannot route a new account", async () => {
  for (const operation of ["read", "skip"] as const) {
    let release!: (response: Response) => void;
    let started!: () => void;
    const pending = new Promise<Response>((resolve) => { release = resolve; });
    const ready = new Promise<void>((resolve) => { started = resolve; });
    let loginCount = 0;
    const api = createAuthApi({ baseUrl: "https://api.example", fetcher: async () => {
      loginCount++;
      return Response.json({ success: true, data: { user: { id: loginCount === 1 ? "a" : "b", email: "test@example.com", full_name: "Test", created_at: "2026-11-14" }, access_token: `token-${loginCount}` } });
    } });
    const auth = createAuthService({ api, credentials: { read: async () => null, write: async () => {}, clear: async () => {} } });
    await auth.login("a@example.com", "password");
    const service = createOnboardingService(createOnboardingApi({ baseUrl: "https://api.example", fetcher: async () => { started(); return pending; } }), auth);
    const result = operation === "read" ? service.read() : service.skip();
    const rejected = assert.rejects(result, (error) => error instanceof AuthError && error.code === "cancelled");
    await ready;
    await auth.login("b@example.com", "password");
    release(Response.json({ success: true, data: { status: "skipped" } }));
    await rejected;
    assert.equal(auth.getSessionSnapshot()?.accountId, "b");
  }
});
