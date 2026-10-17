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
