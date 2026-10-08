import { useLocalSearchParams } from "expo-router";
import { SettingsScreen } from "../../src/features/profile-settings";

export default function SettingsRoute() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  return <SettingsScreen initialSection={section} />;
}
