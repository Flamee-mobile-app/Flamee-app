import { useLocalSearchParams } from "expo-router";
import { HomeScreen } from "../../src/features/home";

export default function MemoriesRoute() {
  const { momentRequest } = useLocalSearchParams<{ momentRequest?: string }>();
  return <HomeScreen view="memories" momentRequest={momentRequest} />;
}
