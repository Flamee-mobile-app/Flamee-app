import assert from "node:assert/strict";
import test from "node:test";
import { AuthError, createAuthApi } from "./authApi.ts";
import { createAuthService } from "./authService.ts";
import { synchronizeAuthSession } from "./authSessionSync.ts";
import { useSessionStore } from "../../shared/state/sessionStore.ts";

const user = { id: "account-a", email: "an@example.com", full_name: "An", couple_id: null, created_at: "2026-10-19T00:00:00Z" };
const reply = (data: unknown) => new Response(JSON.stringify({ success: true, data }));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function credentialStore(value: string | null = "remembered-token") {
  return { read: async () => value, write: async (next: string) => { value = next; }, clear: async () => { value = null; } };
}

test("concurrent cold restores share native storage and one identity request", async () => {
  const held = deferred<Response>();
  let reads = 0;
  let requests = 0;
  const stored = credentialStore();
  const auth = createAuthService({
    credentials: { ...stored, read: async () => { reads += 1; return stored.read(); } },
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async () => { requests += 1; return (await held.promise).clone(); }) as typeof fetch }),
  });
  const first = auth.getCurrentSession();
  const second = auth.getCurrentSession();
  await Promise.resolve();
  held.resolve(reply(user));
  assert.equal((await first)?.accountId, user.id);
  assert.equal((await second)?.accountId, user.id);
  assert.equal(reads, 1);
  assert.equal(requests, 1);
});

test("concurrent profile refreshes share one request and publish once", async () => {
  const held = deferred<Response>();
  let requests = 0;
  let publications = 0;
  const auth = createAuthService({
    credentials: credentialStore(), onSessionChanged: () => { publications += 1; },
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
      if (String(url).endsWith("/login")) return reply({ user, access_token: "token" });
      requests += 1; return (await held.promise).clone();
    }) as typeof fetch }),
  });
  await auth.login(user.email, "password");
  publications = 0;
  const results = Promise.all([auth.refreshCurrentSession(), auth.refreshCurrentSession()]);
  held.resolve(reply(user));
  await results;
  assert.equal(requests, 1);
  assert.equal(publications, 1);
});

test("a temporary restore error preserves credentials and a later retry verifies the session", async () => {
  let offline = true;
  const stored = credentialStore();
  const auth = createAuthService({ credentials: stored, api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async () => {
    if (offline) throw new TypeError("offline");
    return reply(user);
  }) as typeof fetch }) });
  await assert.rejects(auth.getCurrentSession(), (error) => error instanceof AuthError && error.code === "network");
  assert.equal(await stored.read(), "remembered-token");
  offline = false;
  assert.equal((await auth.getCurrentSession())?.accountId, user.id);
});

test("an identity response from before sign-out cannot publish a restored account", async () => {
  const held = deferred<Response>();
  const started = deferred<void>();
  const published: unknown[] = [];
  const auth = createAuthService({ credentials: credentialStore(), onSessionChanged: (session) => published.push(session),
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
      if (String(url).endsWith("/logout")) return reply({ logged_out: true });
      started.resolve(); return held.promise;
    }) as typeof fetch }),
  });
  const restore = auth.getCurrentSession();
  await started.promise;
  await auth.signOut();
  held.resolve(reply(user));
  await assert.rejects(restore, (error) => error instanceof AuthError && error.code === "cancelled");
  assert.equal(auth.getSessionSnapshot(), null);
  assert.deepEqual(published, [null]);
});

test("a profile refresh during cold restoration joins the same pending verification", async () => {
  const held = deferred<Response>();
  let requests = 0;
  const auth = createAuthService({ credentials: credentialStore(),
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async () => { requests += 1; return (await held.promise).clone(); }) as typeof fetch }),
  });
  const restore = auth.getCurrentSession();
  const refresh = auth.refreshCurrentSession();
  held.resolve(reply(user));
  assert.equal((await refresh)?.accountId, user.id);
  await restore;
  assert.equal(requests, 1);
});

test("a membership confirmed during a profile read remains in the service snapshot and publication", async () => {
  const held = deferred<Response>();
  let membership = { accountId: user.id, coupleId: null as string | null, revision: 0 };
  let publishedCouple: string | null | undefined;
  const auth = createAuthService({ credentials: credentialStore(),
    getMembershipRevision: () => membership.revision,
    getMembershipSnapshot: () => membership,
    onSessionChanged: (session) => { publishedCouple = session?.user.couple_id; },
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
      if (String(url).endsWith("/login")) return reply({ user, access_token: "token" });
      return held.promise;
    }) as typeof fetch }),
  });
  await auth.login(user.email, "password");
  const refresh = auth.refreshCurrentSession();
  membership = { accountId: user.id, coupleId: "newly-confirmed-couple", revision: 1 };
  held.resolve(reply(user));
  const result = await refresh;
  assert.equal(result?.user.couple_id, membership.coupleId);
  assert.equal(auth.getSessionSnapshot()?.user.couple_id, membership.coupleId);
  assert.equal(publishedCouple, membership.coupleId);
});

test("explicit sign-out clears published identity even when secure storage removal fails", async () => {
  useSessionStore.getState().reset();
  let rejectClear = false;
  const stored = credentialStore();
  const auth = createAuthService({
    credentials: { ...stored, clear: async () => { if (rejectClear) throw new Error("native storage unavailable"); await stored.clear(); } },
    onSessionChanged: synchronizeAuthSession,
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => reply(String(url).endsWith("/login") ? { user, access_token: "token" } : user)) as typeof fetch }),
  });
  await auth.login(user.email, "password", true);
  rejectClear = true;
  await assert.rejects(auth.signOut(), (error) => error instanceof AuthError && error.code === "storage");
  assert.equal(auth.getSessionSnapshot(), null);
  assert.equal(useSessionStore.getState().activeAccountId, null);
  assert.equal(useSessionStore.getState().activeCoupleId, null);
  assert.equal(await auth.getCurrentSession(), null, "a credential whose removal failed must not restore the ended session in this process");
});

test("expiry synchronization leaves the active identity available to its routing callback", async () => {
  useSessionStore.getState().reset();
  let expiredAccount: string | null = null;
  const auth = createAuthService({ credentials: credentialStore(), onSessionChanged: synchronizeAuthSession,
    onSessionExpired: () => { expiredAccount = useSessionStore.getState().activeAccountId; useSessionStore.getState().reset(); },
    api: createAuthApi({ baseUrl: "https://api.example", fetcher: (async (url) => {
      if (String(url).endsWith("/login")) return reply({ user, access_token: "token" });
      return new Response("Unauthorized", { status: 401 });
    }) as typeof fetch }),
  });
  await auth.login(user.email, "password");
  await assert.rejects(auth.refreshCurrentSession());
  assert.equal(expiredAccount, user.id);
  assert.equal(useSessionStore.getState().activeAccountId, null);
});
