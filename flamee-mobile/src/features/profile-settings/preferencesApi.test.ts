import assert from "node:assert/strict";
import test from "node:test";
import { createPreferencesApi, PreferencesError } from "./preferencesApi.ts";
import { createPreferencesService } from "./preferencesServiceCore.ts";
import { createAuthApi, AuthError } from "../auth/authApi.ts";
import { createAuthService } from "../auth/authService.ts";

const record = { timezone: "Asia/Tokyo", locale: "en", care_preferences: ["voice", "space"], care_note: "private", partner_nickname: "Moon", relationship_type: "long_distance", revision: 4, onboarding_completed_at: null } as const;
const response = (data: unknown, status = 200) => Response.json({ success: status < 400, data }, { status });

test("preferences read and save use bearer identity and retain unedited server fields and revision", async () => {
  const api = createPreferencesApi({ baseUrl: "https://api.example/api/v1/", fetcher: async (url, options) => {
    assert.equal(url, "https://api.example/api/v1/users/me/preferences");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer token");
    if (options?.method === "PUT") {
      const { onboarding_completed_at: _completed, ...values } = record;
      assert.deepEqual(JSON.parse(String(options.body)), { ...values, care_note: "updated", complete_onboarding: false });
      return response({ ...record, care_note: "updated", revision: 5 });
    }
    return response(record);
  } });
  const loaded = await api.read("token");
  const saved = await api.save("token", { ...loaded, care_note: "updated" });
  assert.equal(saved.revision, 5);
  assert.equal(saved.care_note, "updated");
});

test("conflicts, unauthorized and malformed responses do not report success", async () => {
  for (const [result, expected] of [[response(null, 409), "conflict"], [response(null, 401), "unauthorized"], [response({ ...record, revision: 4 }), "response"]] as const) {
    const api = createPreferencesApi({ baseUrl: "https://api.example", fetcher: async () => result });
    await assert.rejects(api.save("token", { ...record, care_preferences: [...record.care_preferences] }), (error) => error instanceof PreferencesError && error.code === expected);
  }
});

test("unknown server fields, duplicated preferences and mismatched acknowledgements are rejected", async () => {
  for (const invalid of [{ ...record, unexpected: "new" }, { ...record, care_preferences: ["voice", "voice"] }]) {
    const api = createPreferencesApi({ baseUrl: "https://api.example", fetcher: async () => response(invalid) });
    await assert.rejects(api.read("token"), (error) => error instanceof PreferencesError && error.code === "response");
  }
  const api = createPreferencesApi({ baseUrl: "https://api.example", fetcher: async () => response({ ...record, revision: 5 }) });
  await assert.rejects(api.save("token", { ...record, care_preferences: [...record.care_preferences], care_note: "new" }), (error) => error instanceof PreferencesError && error.code === "response");
});

test("saving preferences cannot silently change onboarding completion", async () => {
  for (const [before, after] of [[null, "2026-11-14T00:00:00Z"], ["2026-11-14T00:00:00Z", null], ["2026-11-14T00:00:00Z", "2026-11-15T00:00:00Z"]] as const) {
    const api = createPreferencesApi({ baseUrl: "https://api.example", fetcher: async () => response({ ...record, onboarding_completed_at: after, revision: 5 }) });
    await assert.rejects(api.save("token", { ...record, care_preferences: [...record.care_preferences], onboarding_completed_at: before }), (error) => error instanceof PreferencesError && error.code === "response");
  }
});

test("unchanged onboarding completion is accepted whether pending or completed", async () => {
  for (const value of [null, "2026-11-14T00:00:00Z"] as const) {
    const api = createPreferencesApi({ baseUrl: "https://api.example", fetcher: async () => response({ ...record, onboarding_completed_at: value, revision: 5 }) });
    const saved = await api.save("token", { ...record, care_preferences: [...record.care_preferences], onboarding_completed_at: value });
    assert.equal(saved.onboarding_completed_at, value);
  }
});

test("timeout and explicit cancellation do not turn into confirmed preferences", async () => {
  const fetcher = (async (_url, options) => new Promise<Response>((_resolve, reject) => {
    options?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  })) as typeof fetch;
  const api = createPreferencesApi({ baseUrl: "https://api.example", fetcher, timeoutMs: 5 });
  await assert.rejects(api.read("token"), (error) => error instanceof PreferencesError && error.code === "timeout");
  const controller = new AbortController();
  const pending = api.read("token", controller.signal);
  controller.abort();
  await assert.rejects(pending, (error) => error instanceof Error && error.name === "AbortError");
});

test("responses from a previous login cannot reach preferences after an account switch", async () => {
  for (const operation of ["read", "save"] as const) {
    let resolve!: (value: Response) => void;
    let started!: () => void;
    const pending = new Promise<Response>((done) => { resolve = done; });
    const ready = new Promise<void>((done) => { started = done; });
    let count = 0;
    const authApi = createAuthApi({ baseUrl: "https://api.example", fetcher: async () => {
      count++;
      return response({ user: { id: count === 1 ? "a" : "b", email: "a@example.com", full_name: "A", created_at: "2026-11-14" }, access_token: count === 1 ? "token-a" : "token-b" });
    } });
    const auth = createAuthService({ api: authApi, credentials: { read: async () => null, write: async () => {}, clear: async () => {} } });
    await auth.login("a@example.com", "password");
    const service = createPreferencesService(createPreferencesApi({ baseUrl: "https://api.example", fetcher: async () => { started(); return pending; } }), auth);
    const result = operation === "read" ? service.read() : service.save({ ...record, care_preferences: [...record.care_preferences] });
    const rejected = assert.rejects(result, (error) => error instanceof AuthError && error.code === "cancelled");
    await ready;
    await auth.login("b@example.com", "password");
    resolve(response({ ...record, revision: operation === "save" ? 5 : 4 }));
    await rejected;
    assert.equal(auth.getSessionSnapshot()?.accountId, "b");
  }
});
