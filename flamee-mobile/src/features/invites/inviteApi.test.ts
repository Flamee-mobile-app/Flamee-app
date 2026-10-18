import assert from "node:assert/strict";
import test from "node:test";
import { createInviteApi, InviteApiError } from "./inviteApi.ts";

test("invite api sends bearer token and parses create response", async () => {
  let request: RequestInit | undefined;
  const api = createInviteApi({
    baseUrl: "https://example.test/api/v1",
    fetcher: (async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ success: true, data: { code: "ABC123", expires_at: "2026-10-17T00:00:00+00:00", status: "pending", is_pending: true } }), { status: 201 });
    }) as typeof fetch,
  });
  const invite = await api.create("token");
  assert.equal(invite.code, "ABC123");
  assert.equal((request?.headers as Record<string, string>).Authorization, "Bearer token");
});

test("invite api preserves domain error code", async () => {
  const api = createInviteApi({
    baseUrl: "https://example.test/api/v1",
    fetcher: (async () => new Response(JSON.stringify({ success: false, error: { code: "invite_expired", message: "expired" } }), { status: 409 })) as typeof fetch,
  });
  await assert.rejects(() => api.preview("token", "abc123"), (error: unknown) => error instanceof InviteApiError && error.code === "invite_expired");
});

test("an unauthorized response still expires the session when its body is not JSON", async () => {
  const api = createInviteApi({ baseUrl: "https://example.test", fetcher: (async () => new Response("Unauthorized", { status: 401 })) as typeof fetch });
  await assert.rejects(api.current("old"), (error) => error instanceof InviteApiError && error.code === "unauthorized");
});

test("the success screen reads both real members from the authenticated couple endpoint", async () => {
  const couple = { id: "couple-a", status: "active", partner1: { id: "user-a", full_name: "An", avatar_url: "https://private.example/a.jpg" }, partner2: { id: "user-b", full_name: "Bình", avatar_url: null } };
  const api = createInviteApi({ baseUrl: "https://example.test/api/v1", fetcher: (async (url, options) => {
    assert.equal(String(url), "https://example.test/api/v1/couple");
    assert.equal(options?.method, "GET");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer token");
    return new Response(JSON.stringify({ success: true, data: couple }));
  }) as typeof fetch });
  assert.deepEqual(await api.connection("token"), couple);
});
