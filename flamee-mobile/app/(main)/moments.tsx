import { useLocalSearchParams } from "expo-router";
import { MomentsScreen } from "../../src/features/moments";

export default function MomentsRoute() {
  const { composeRequest, draft, nudgeId, kind } = useLocalSearchParams<{ composeRequest?: string; draft?: string; nudgeId?: string; kind?: "text" | "voice" | "photo" | "signal" }>();
  return <MomentsScreen composerRequest={composeRequest} initialText={draft} initialKind={kind} fromNudgeId={nudgeId} />;
}
