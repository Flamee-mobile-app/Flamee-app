import type { MessageKey } from "../../shared/localization/messages.ts";

export const headerDestinations = [
  { id: "timeline", titleKey: "timelineFeed", action: "memory" },
  { id: "memories", titleKey: "timelineMemories", action: "memory" },
  { id: "moments", titleKey: "moodPreviewTitle", action: "checkin" },
  { id: "tasks", titleKey: "tasksTitle", action: "nudge" },
  { id: "profile", titleKey: "profileMenuTitle", action: "profile" },
] as const satisfies readonly { id: string; titleKey: MessageKey; action: string }[];
export type HeaderDestination = typeof headerDestinations[number]["id"];

export function resolveHeaderDestination(route: string, homeView?: string): HeaderDestination {
  const parts = route.split("/").filter(Boolean);
  if (parts.includes("moments") || parts[0] === "mood") return "moments";
  if (parts.includes("tasks") || parts[0] === "nudge") return "tasks";
  if (parts.includes("profile") || parts[0] === "settings") return "profile";
  return homeView === "memories" ? "memories" : "timeline";
}

export function getHeaderDestinationRoute(id: HeaderDestination) {
  switch (id) {
    case "timeline": case "memories": return { pathname: "/(main)" as const, params: { view: id } };
    case "moments": return { pathname: "/(main)/moments" as const };
    case "tasks": return { pathname: "/(main)/tasks" as const };
    case "profile": return { pathname: "/(main)/profile" as const };
  }
}

export function isHomeHeaderRoute(route: string) {
  return ["(main)", "(main)/index", "(main)/timeline"].includes(route);
}
