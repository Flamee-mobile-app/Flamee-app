import { Redirect } from "expo-router";

export function OnboardingScreen(_props: { start?: string }) {
  return <Redirect href="/(invite)" />;
}
