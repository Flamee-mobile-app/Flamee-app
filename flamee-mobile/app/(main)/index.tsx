import { useLocalSearchParams } from "expo-router";
import { HomeScreen } from "../../src/features/home";

export default function HomeRoute() {
  const { checkInRequest, momentRequest, momentKind } = useLocalSearchParams<{
    checkInRequest?: string;
    momentRequest?: string;
    momentKind?: "text" | "voice" | "photo" | "signal";
  }>();
  return <HomeScreen checkInRequest={checkInRequest} momentRequest={momentRequest} momentKind={momentKind} />;
}
