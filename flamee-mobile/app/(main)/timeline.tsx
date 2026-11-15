import { Redirect, useLocalSearchParams } from "expo-router";

export default function TimelineRoute() {
  const { view, momentRequest, momentKind } = useLocalSearchParams<{
    view?: string | string[];
    momentRequest?: string;
    momentKind?: "text" | "voice" | "photo" | "signal";
  }>();
  const calendar = (Array.isArray(view) ? view[0] : view) === "memories";
  return <Redirect href={{ pathname: calendar ? "/(main)/memories" : "/(main)", params: { momentRequest, momentKind } }} />;
}
