import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { AppButton, FeatureScreen } from "../../../shared/components";
import { missionCopy as copy, MissionBody } from "../components/ServerMissionViews";
import { ServerTinyMissionContent } from "../components/ServerTinyMissionContent";
import { useMissionScope } from "../useMissionScope";
import { missionKey } from "../missionServiceCore";

export function TinyMissionDetailScreen() {
  const params = useLocalSearchParams<{ mission?: string }>();
  const router = useRouter();
  const focused = useIsFocused();
  const scope = useMissionScope();
  const missionId = typeof params.mission === "string" && /^[A-Za-z0-9_-]{1,120}$/.test(params.mission) ? params.mission : null;
  const back = () => router.canGoBack() ? router.back() : router.replace("/(main)/tasks");
  return <FeatureScreen title={copy("missionDetails")} showBack onBack={back} withBottomNavigation={false}>
    {missionId ? <ServerTinyMissionContent key={`${missionKey(scope).join(":")}:${missionId}`} scope={scope} missionId={missionId} active={focused} onDetails={() => undefined} />
      : <><MissionBody muted>{copy("missionLiveNotFound")}</MissionBody><AppButton depth="flat" fill onPress={back}>{copy("back")}</AppButton></>}
  </FeatureScreen>;
}
