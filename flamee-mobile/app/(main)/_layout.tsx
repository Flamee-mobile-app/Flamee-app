import { Tabs, useRouter } from "expo-router";
import { BottomNavigationBar, BottomNavigationIcon } from "../../src/shared/components";
import { getMessage } from "../../src/shared/localization/messages";
import { flameeSymbolAsset } from "../../src/features/startup";
import { ProfileNavigationIcon } from "../../src/features/main-navigation";
import { NotificationBell } from "../../src/features/conversations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { spacing } from "../../src/shared/constants/tokens";

export default function MainLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <YStack flex={1}>
    <Tabs tabBar={(props) => (
      <BottomNavigationBar
        {...props}
        fabAccessibilityLabel={getMessage("vi", "moodStartCheckIn")}
        fabAccessibilityHint={getMessage("vi", "fabHint")}
        fabIcon={flameeSymbolAsset}
        onFabPress={() => router.navigate("/mood/check-in")}
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
      <Tabs.Screen name="moments" options={{ title: getMessage("vi", "activityTitle"), href: null }} />
    </Tabs>
    <YStack position="absolute" right={insets.right + spacing.page} top={insets.top + spacing.sm}><NotificationBell /></YStack>
    </YStack>
  );
}
