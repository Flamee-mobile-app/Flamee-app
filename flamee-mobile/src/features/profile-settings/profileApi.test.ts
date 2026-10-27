import assert from "node:assert/strict";
import test from "node:test";
import { createAuthApi, AuthError } from "../auth/authApi.ts";

const user = { id: "server-user", email: "an@example.com", full_name: "An", username: "Mây", created_at: "2026-10-17T00:00:00Z" };

test("profile updates send authenticated fields to the server and decode its response", async () => {
  const api = createAuthApi({ baseUrl: "https://api.example.com/api/v1", fetcher: async (url, options) => {
    assert.equal(url, "https://api.example.com/api/v1/auth/me");
    assert.equal(options?.method, "PUT");
    assert.equal((options?.headers as Record<string, string>).Authorization, "Bearer session-token");
    assert.deepEqual(JSON.parse(options?.body as string), { full_name: "An", username: "Mây" });
    return new Response(JSON.stringify({ success: true, data: user }));
  } });
  assert.deepEqual(await api.updateProfile("session-token", { full_name: "An", username: "Mây" }), user);
});

test("failed or malformed profile responses cannot become a local save", async () => {
  for (const response of [new Response("{}", { status: 503 }), new Response(JSON.stringify({ success: true, data: { full_name: "An" } }))]) {
    const api = createAuthApi({ baseUrl: "https://api.example.com", fetcher: async () => response });
    await assert.rejects(api.updateProfile("token", { full_name: "An", username: "" }), (error) => error instanceof AuthError);
  }
});

test("avatar multipart has a 60 second budget while profile reads keep 12 seconds", async (context) => {
  const delays: number[] = [];
  const original = globalThis.setTimeout;
  context.mock.method(globalThis, "setTimeout", (callback: () => void, delay: number) => {
    delays.push(delay);
    return original(callback, delay);
  });
  const api = createAuthApi({ baseUrl: "https://api.example.test", fetcher: async () => new Response(JSON.stringify({ success: true, data: { ...user, avatar_url: "https://image.example.test/avatar.jpg" } })) });
  await api.uploadAvatar("token", new Blob(["bytes"]));
  await api.me("token");
  assert.deepEqual(delays, [60_000, 12_000]);
});
