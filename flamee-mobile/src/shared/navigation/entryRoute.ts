export type EntryRouteHref = "/(auth)" | "/(onboarding)" | "/(invite)" | "/(waiting)" | "/(main)";

export type EntryRouteSnapshot = {
  bootstrapped: boolean;
  accountId: string | null;
  setupStatus: "pending" | "completed" | "deferred" | null;
  inviteIntent: boolean;
  coupleStatus: "none" | "waiting" | "paired" | "ended" | null;
};

export function resolvePostAuthRoute(coupleId: string | null | undefined): "/(invite)" | "/(main)" {
  return coupleId ? "/(main)" : "/(invite)";
}

export function resolveEntryRoute(snapshot: EntryRouteSnapshot): EntryRouteHref | null {
  if (!snapshot.bootstrapped) return null;
  if (!snapshot.accountId) return "/(auth)";
  return resolvePostAuthRoute(snapshot.coupleStatus === "paired" ? "paired" : null);
}
