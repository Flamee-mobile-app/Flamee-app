import { useLocalSearchParams } from "expo-router";
import { HomeScreen } from "../../src/features/home";

export default function TimelineRoute() {
  const { view, momentRequest, momentKind } = useLocalSearchParams<{
    view?: string | string[];
    momentRequest?: string;
    momentKind?: "text" | "voice" | "photo" | "signal";
  }>();
  return <HomeScreen view={view} momentRequest={momentRequest} momentKind={momentKind} />;
}
