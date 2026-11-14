import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { AppButton, FeatureScreen } from "../../../shared/components";
import { missionPreviews } from "../previewContent";
import { copy, MissionText } from "../components/MissionViews";
import { TinyMissionContent } from "../components/TinyMissionContent";

export function TinyMissionDetailScreen() {
  const params = useLocalSearchParams<{ mission?: string }>();
  const router = useRouter();
  const focused = useIsFocused();
  const mission = missionPreviews.find(item => item.id === params.mission);
  const back = () => router.canGoBack() ? router.back() : router.replace("/(main)/tasks");
  return <FeatureScreen title={copy("missionDetails")} showBack onBack={back} withBottomNavigation={false}>
    {mission ? <TinyMissionContent mission={mission} active={focused} onDetails={() => undefined} />
      : <><MissionText secondary>{copy("missionNotFound")}</MissionText><AppButton depth="flat" fill onPress={back}>{copy("back")}</AppButton></>}
  </FeatureScreen>;
}
