import { Tabs } from "expo-router";
import { BottomNavigationBar, BottomNavigationIcon } from "../../src/shared/components";
import { getMessage } from "../../src/shared/localization/messages";
import { flameeSymbolAsset } from "../../src/features/startup";
import { ProfileNavigationIcon } from "../../src/features/main-navigation";

export default function MainLayout() {
  return (
    <Tabs tabBar={(props) => (
      <BottomNavigationBar
        {...props}
        fabAccessibilityLabel={getMessage("vi", "fabLabel")}
        fabAccessibilityHint={getMessage("vi", "fabHint")}
        fabIcon={flameeSymbolAsset}
        tabRouteNames={["index", "moments", "tasks", "profile"]}
      />
    )} screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: getMessage("vi", "homeTitle"), tabBarIcon: ({ focused, size }) => <BottomNavigationIcon name="home" focused={focused} size={size} /> }} />
      <Tabs.Screen name="moments" options={{ title: getMessage("vi", "activityTitle"), tabBarIcon: ({ focused, size }) => <BottomNavigationIcon name="activity" focused={focused} size={size} /> }} />
      <Tabs.Screen name="tasks" options={{ title: getMessage("vi", "tasksTitle"), tabBarIcon: ({ focused, size }) => <BottomNavigationIcon name="tasks" focused={focused} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: getMessage("vi", "profileNavTitle"), tabBarIcon: ({ focused, size }) => <ProfileNavigationIcon focused={focused} size={size} /> }} />
      <Tabs.Screen name="timeline" options={{ title: getMessage("vi", "timelineTitle"), href: null }} />
    </Tabs>
  );
}
