import { useIsFocused, useRouter } from "expo-router";
import { FeatureScreen } from "../../../shared/components";
import { missionTokens } from "../../../shared/constants/tokens";
import { missionCopy as copy } from "../components/ServerMissionViews";
import { ServerTinyMissionContent } from "../components/ServerTinyMissionContent";
import { useMissionScope } from "../useMissionScope";
import { missionKey } from "../missionServiceCore";

/** Server-owned assignments, points and rewards; no preview fallback. */
export function TinyMissionScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  const scope = useMissionScope();
  return <FeatureScreen title={copy("missionTitle")} surfaceProps={{ padding: missionTokens.surfacePadding, gap: "$lg" }}>
    <ServerTinyMissionContent key={missionKey(scope).join(":")} scope={scope} active={focused} onDetails={(id) => router.push({ pathname: "/tiny-mission/[mission]", params: { mission: id } })} />
  </FeatureScreen>;
}
