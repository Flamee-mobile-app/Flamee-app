export type FabAction = "emotion" | "nudge" | "moment" | "connection";

export function getFabIntent(action: FabAction, requestId: string) {
  switch (action) {
    case "emotion": return { pathname: "/mood/check-in" as const };
    case "nudge": return { pathname: "/(main)/tasks" as const };
    case "moment": return { pathname: "/(main)/moments" as const, params: { composeRequest: requestId } };
    case "connection": return { pathname: "/connection" as const };
  }
}
