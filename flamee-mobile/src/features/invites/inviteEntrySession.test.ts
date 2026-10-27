import assert from "node:assert/strict";
import test from "node:test";
import { createAuthApi } from "../auth/authApi.ts";
import { createAuthService } from "../auth/authService.ts";
import { synchronizeAuthSession } from "../auth/authSessionSync.ts";
import { useSessionStore } from "../../shared/state/sessionStore.ts";
import { readInviteEntrySession } from "./inviteEntrySession.ts";

const user = { id: "account-a", email: "an@example.com", full_name: "An", couple_id: null, created_at: "2026-10-19T00:00:00Z" };
const reply = (data: unknown) => new Response(JSON.stringify({ success: true, data }));

test("reopening an invitation preserves a newly connected couple through cached identity and a late profile refresh", async () => {
  useSessionStore.getState().reset();
  let release!: (response: Response) => void;
  const profile = new Promise<Response>((resolve) => { release = resolve; });
  const auth = createAuthService({
    credentials: { read: async () => null, write: async () => undefined, clear: async () => undefined },
    onSessionChanged: synchronizeAuthSession,
    getMembershipRevision: () => useSessionStore.getState().membershipRevision,
    getMembershipSnapshot: () => {
      const state = useSessionStore.getState();
      return { accountId: state.activeAccountId, coupleId: state.activeCoupleId, revision: state.membershipRevision };
    },
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => String(url).endsWith("/login")
      ? reply({ user, access_token: "token" }) : profile) as typeof fetch }),
  });
  await auth.login(user.email, "password");
  const refresh = auth.refreshCurrentSession();
  useSessionStore.getState().setActiveCouple("confirmed-couple");
  assert.equal(auth.getSessionSnapshot()?.user.couple_id, null);
  const entry = await readInviteEntrySession(user.id, auth, useSessionStore.getState);
  try {
    assert.equal(entry?.coupleId, "confirmed-couple");
    assert.equal(useSessionStore.getState().activeCoupleId, "confirmed-couple");
  } finally { release(reply(user)); await refresh; }
  assert.equal(auth.getSessionSnapshot()?.user.couple_id, "confirmed-couple");
  assert.equal(useSessionStore.getState().activeCoupleId, "confirmed-couple");
});

test("invitation entry ignores an identity belonging to another account", async () => {
  const entry = await readInviteEntrySession("account-b", {
    getSessionSnapshot: () => ({ accountId: user.id, user }),
    getCurrentSession: async () => assert.fail("an existing snapshot requires no extra identity request"),
  }, () => ({ activeAccountId: "account-b", activeCoupleId: "couple-b" }));
  assert.equal(entry, null);
});
