import { Tabs, useRouter, useSegments } from "expo-router";
import { BottomNavigationBar, BottomNavigationIcon } from "../../src/shared/components";
import { getMessage } from "../../src/shared/localization/messages";
import { flameeSymbolAsset } from "../../src/features/startup";
import { ProfileNavigationIcon } from "../../src/features/main-navigation";
import { NotificationBell } from "../../src/features/conversations";
import { Text, XStack } from "tamagui";
import { MainScreenHeaderContext } from "../../src/shared/navigation/mainScreenHeaderContext";

export default function MainLayout() {
  const router = useRouter();
  const segments = useSegments();
  const tab = segments[1];
  const titleKey = tab === "memories" ? "timelineMemories" : tab === "moments" ? "moodPreviewTitle" : tab === "tasks" ? "tasksTitle" : tab === "profile" ? "profileMenuTitle" : "timelineFeed";
  const header = <XStack testID="main-screen-header" alignItems="center" justifyContent="space-between" gap="$md" paddingVertical="$sm">
    <Text flex={1} minWidth={0} role="heading" aria-level={1} fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary">{getMessage("vi", titleKey)}</Text>
    <NotificationBell />
  </XStack>;
  return (
    <MainScreenHeaderContext.Provider value={header}>
    <Tabs tabBar={(props) => (
      <BottomNavigationBar
        {...props}
        fabAccessibilityLabel={getMessage("vi", "moodPreviewTitle")}
        fabAccessibilityHint={getMessage("vi", "fabHint")}
        fabIcon={flameeSymbolAsset}
        onFabPress={() => router.navigate("/(main)/moments")}
        tabRouteNames={["index", "memories", "tasks", "profile"]}
      />
    )} screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: getMessage("vi", "homeTitle"), tabBarIcon: ({ focused, size }) => <BottomNavigationIcon name="home" focused={focused} size={size} /> }} />
      <Tabs.Screen name="memories" options={{ title: getMessage("vi", "timelineMemories"), tabBarIcon: ({ focused, size }) => <BottomNavigationIcon name="memories" focused={focused} size={size} /> }} />
      <Tabs.Screen name="tasks" options={{ title: getMessage("vi", "tasksTitle"), tabBarIcon: ({ focused, size }) => <BottomNavigationIcon name="tasks" focused={focused} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: getMessage("vi", "profileNavTitle"), tabBarIcon: ({ focused, size }) => <ProfileNavigationIcon focused={focused} size={size} /> }} />
      <Tabs.Screen name="timeline" options={{ title: getMessage("vi", "timelineTitle"), href: null }} />
      <Tabs.Screen name="moments" options={{ title: getMessage("vi", "moodPreviewTitle") }} />
    </Tabs>
    </MainScreenHeaderContext.Provider>
  );
}
