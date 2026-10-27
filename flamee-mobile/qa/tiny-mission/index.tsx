/** Isolated visual QA entry. Not an Expo route; no session or API is bypassed. */
import { registerRootComponent } from "expo";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScrollView, YStack } from "tamagui";
import { TamaguiProvider } from "../../src/providers/TamaguiProvider";
import { AppToastProvider, ContentSurface } from "../../src/shared/components";
import { FeatureTitle } from "../../src/shared/components/FeatureTitle";
import { colors, missionTokens, spacing } from "../../src/shared/constants/tokens";
import { TinyMissionContent } from "../../src/features/tiny-mission/components/TinyMissionContent";
import { copy } from "../../src/features/tiny-mission/components/MissionViews";
import type { MissionPreview } from "../../src/features/tiny-mission/previewContent";

function VisualQA() {
  const [mission, setMission] = useState<MissionPreview | null>(null);
  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}><TamaguiProvider><SafeAreaProvider><AppToastProvider>
    <YStack flex={1} width="100%" maxWidth={430} alignSelf="center" backgroundColor="$background" paddingTop="$lg">
      <FeatureTitle title={copy(mission ? "missionDetails" : "missionTitle")} onBack={mission ? () => setMission(null) : undefined} />
      <ScrollView key={mission?.id ?? "overview"} flex={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xl }}>
        <ContentSurface padding={mission ? "$lg" : missionTokens.surfacePadding}>
          <TinyMissionContent mission={mission} onDetails={setMission} />
        </ContentSurface>
      </ScrollView>
    </YStack>
  </AppToastProvider></SafeAreaProvider></TamaguiProvider></GestureHandlerRootView>;
}

registerRootComponent(VisualQA);
