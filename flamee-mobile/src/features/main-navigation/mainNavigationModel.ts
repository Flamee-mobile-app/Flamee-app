export type FabAction = "timeline" | "emotion" | "nudge" | "moment" | "connection";

export function getFabIntent(action: FabAction, requestId: string) {
  switch (action) {
    case "timeline": return { pathname: "/(main)/timeline" as const };
    case "emotion": return { pathname: "/(main)" as const, params: { checkInRequest: requestId } };
    case "nudge": return { pathname: "/(main)/tasks" as const };
    case "moment": return { pathname: "/(main)/moments" as const, params: { composeRequest: requestId } };
    case "connection": return { pathname: "/connection" as const };
  }
}
