export type EntryRouteHref = "/(auth)" | "/(onboarding)" | "/(invite)" | "/(waiting)" | "/(main)";

export type EntryRouteSnapshot = {
  bootstrapped: boolean;
  accountId: string | null;
  onboardingStep: "consent" | "profile" | "care" | "relation" | "complete" | null;
  inviteIntent: boolean;
  coupleStatus: "none" | "waiting" | "paired" | "ended" | null;
};

export function resolveEntryRoute(snapshot: EntryRouteSnapshot): EntryRouteHref | null {
  if (!snapshot.bootstrapped) return null;
  if (!snapshot.accountId) return "/(auth)";
  if (snapshot.onboardingStep !== "complete") return "/(onboarding)";
  if (snapshot.inviteIntent) return "/(invite)";
  if (snapshot.coupleStatus === "paired") return "/(main)";
  if (snapshot.coupleStatus === "waiting") return "/(waiting)";
  return "/(invite)";
}
