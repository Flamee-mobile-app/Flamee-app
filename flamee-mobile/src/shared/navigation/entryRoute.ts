export type EntryRouteHref = "/(auth)" | "/(onboarding)" | "/(invite)" | "/(waiting)" | "/(main)";

export type EntryRouteSnapshot = {
  bootstrapped: boolean;
  accountId: string | null;
  setupStatus: "pending" | "completed" | "deferred" | null;
  inviteIntent: boolean;
  coupleStatus: "none" | "waiting" | "paired" | "ended" | null;
};

export function resolveEntryRoute(snapshot: EntryRouteSnapshot): EntryRouteHref | null {
  if (!snapshot.bootstrapped) return null;
  if (!snapshot.accountId) return "/(auth)";
  if (snapshot.setupStatus === "pending") return "/(onboarding)";
  if (snapshot.inviteIntent) return "/(invite)";
  return "/(main)";
}
