import { Redirect, useLocalSearchParams } from "expo-router";
import { HomeScreen } from "../../src/features/home";

export default function HomeRoute() {
  const { view, checkInRequest, momentRequest, momentKind } = useLocalSearchParams<{
    view?: string | string[];
    checkInRequest?: string;
    momentRequest?: string;
    momentKind?: "text" | "voice" | "photo" | "signal";
  }>();
  if ((Array.isArray(view) ? view[0] : view) === "memories") return <Redirect href={{ pathname: "/(main)/memories", params: { momentRequest } }} />;
  return <HomeScreen view="timeline" checkInRequest={checkInRequest} momentRequest={momentRequest} momentKind={momentKind} />;
}
