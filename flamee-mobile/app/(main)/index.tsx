import { useLocalSearchParams } from "expo-router";
import { HomeScreen } from "../../src/features/home";

export default function HomeRoute() {
  const { view, checkInRequest, momentRequest, momentKind } = useLocalSearchParams<{
    view?: string | string[];
    checkInRequest?: string;
    momentRequest?: string;
    momentKind?: "text" | "voice" | "photo" | "signal";
  }>();
  return <HomeScreen view={view} checkInRequest={checkInRequest} momentRequest={momentRequest} momentKind={momentKind} />;
}
