import assert from "node:assert/strict";
import test from "node:test";
import * as entryRoutes from "./entryRoute.ts";
import { resolveEntryRoute, type EntryRouteSnapshot } from "./entryRoute.ts";

const snapshot = (overrides: Partial<EntryRouteSnapshot>): EntryRouteSnapshot => ({
  bootstrapped: true,
  accountId: "account-a",
  setupStatus: "pending",
  inviteIntent: false,
  coupleStatus: "none",
  ...overrides,
});

test("signed-out account routes to login", () => {
  assert.equal(resolveEntryRoute(snapshot({ accountId: null })), "/(auth)");
});

test("authenticated account without a couple routes to invite setup", () => {
  assert.equal(resolveEntryRoute(snapshot({ coupleStatus: "none" })), "/(invite)");
});

test("authenticated account with a server couple routes to home", () => {
  assert.equal(resolveEntryRoute(snapshot({ coupleStatus: "paired" })), "/(main)");
});

test("post-login navigation targets an explicit route group instead of ambiguous root", () => {
  const resolvePostAuthRoute = (entryRoutes as typeof entryRoutes & {
    resolvePostAuthRoute?: (coupleId: string | null | undefined) => "/(invite)" | "/(main)";
  }).resolvePostAuthRoute;

  assert.ok(resolvePostAuthRoute);
  assert.equal(resolvePostAuthRoute(null), "/(invite)");
  assert.equal(resolvePostAuthRoute("couple-a"), "/(main)");
});
