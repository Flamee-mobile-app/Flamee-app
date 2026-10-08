import { useLocalSearchParams } from "expo-router";
import { MomentsScreen } from "../../src/features/moments";

export default function MomentsRoute() {
  const { draft, nudgeId, kind } = useLocalSearchParams<{ draft?: string; nudgeId?: string; kind?: "text" | "voice" | "photo" | "signal" }>();
  return <MomentsScreen initialText={draft} initialKind={kind} fromNudgeId={nudgeId} />;
}
