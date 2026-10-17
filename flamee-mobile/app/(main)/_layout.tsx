import { Tabs } from "expo-router";
import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { House } from "@tamagui/lucide-icons-2/icons/House";
import { Sparkles } from "@tamagui/lucide-icons-2/icons/Sparkles";
import { UserRound } from "@tamagui/lucide-icons-2/icons/UserRound";
import { BottomNavigationBar } from "../../src/shared/components";
import { getMessage } from "../../src/shared/localization/messages";
import { getNavigationIconEmphasis } from "../../src/shared/navigation/bottomNavigationModel";
import { flameeSymbolAsset } from "../../src/features/startup";
import { useFabActions } from "../../src/features/main-navigation";

export default function MainLayout() {
  const { quickActions, onFabPress } = useFabActions();

  return (
    <Tabs tabBar={(props) => (
      <BottomNavigationBar
        {...props}
        closeMenuAccessibilityLabel={getMessage("vi", "closeQuickActions")}
        fabAccessibilityLabel={getMessage("vi", "fabMomentLabel")}
        fabAccessibilityHint={getMessage("vi", "fabMomentHint")}
        fabIcon={flameeSymbolAsset}
        fabSelected={props.state.routes[props.state.index].name === "timeline"}
        onFabPress={onFabPress}
        quickActions={quickActions}
        tabRouteNames={["index", "moments", "tasks", "profile"]}
      />
    )} screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: getMessage("vi", "homeTitle"), tabBarIcon: ({ focused, size }) => <House color="$white" size={size} strokeWidth={getNavigationIconEmphasis(focused).strokeWidth} /> }} />
      <Tabs.Screen name="moments" options={{ title: getMessage("vi", "activityTitle"), tabBarIcon: ({ focused, size }) => <Heart color="$white" size={size} strokeWidth={getNavigationIconEmphasis(focused).strokeWidth} /> }} />
      <Tabs.Screen name="tasks" options={{ title: getMessage("vi", "tasksTitle"), tabBarIcon: ({ focused, size }) => <Sparkles color="$white" size={size} strokeWidth={getNavigationIconEmphasis(focused).strokeWidth} /> }} />
      <Tabs.Screen name="profile" options={{ title: getMessage("vi", "profileNavTitle"), tabBarIcon: ({ focused, size }) => <UserRound color="$white" size={size} strokeWidth={getNavigationIconEmphasis(focused).strokeWidth} /> }} />
      <Tabs.Screen name="timeline" options={{ title: getMessage("vi", "timelineTitle"), href: null }} />
    </Tabs>
  );
}
