import { useLocalSearchParams } from "expo-router";
import { NudgeScreen } from "../../src/features/nudges";

export default function NudgeRoute() {
  const { nudgeId } = useLocalSearchParams<{ nudgeId: string }>();
  return <NudgeScreen nudgeId={nudgeId} />;
}
