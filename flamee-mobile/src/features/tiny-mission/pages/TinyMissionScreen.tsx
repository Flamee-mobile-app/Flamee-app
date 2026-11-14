import { useIsFocused, useRouter } from "expo-router";
import { FeatureScreen } from "../../../shared/components";
import { missionTokens } from "../../../shared/constants/tokens";
import { copy } from "../components/MissionViews";
import { TinyMissionContent } from "../components/TinyMissionContent";

/** Frontend preview: screen state never records a mission, point or redemption. */
export function TinyMissionScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  return <FeatureScreen title={copy("missionTitle")} surfaceProps={{ padding: missionTokens.surfacePadding, gap: "$lg" }}>
    <TinyMissionContent mission={null} active={focused} onDetails={(mission) => router.push({ pathname: "/tiny-mission/[mission]", params: { mission: mission.id } })} />
  </FeatureScreen>;
}
