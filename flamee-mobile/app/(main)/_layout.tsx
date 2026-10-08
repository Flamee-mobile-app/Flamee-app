import { Tabs } from "expo-router";
import { Heart, House, UserRound } from "@tamagui/lucide-icons-2";
import { colors } from "../../src/shared/constants/tokens";
import { getMessage } from "../../src/shared/localization/messages";

export default function MainLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: { height: 72, paddingTop: 8, paddingBottom: 10, backgroundColor: colors.white, borderTopColor: colors.supportPeach },
      tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
    }}>
      <Tabs.Screen name="index" options={{ title: getMessage("vi", "homeTitle"), tabBarIcon: ({ focused, size }) => <House color={focused ? "$primary" : "$textSecondary"} size={size} /> }} />
      <Tabs.Screen name="moments" options={{ title: getMessage("vi", "momentsTitle"), tabBarIcon: ({ focused, size }) => <Heart color={focused ? "$primary" : "$textSecondary"} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: getMessage("vi", "profileTitle"), tabBarIcon: ({ focused, size }) => <UserRound color={focused ? "$primary" : "$textSecondary"} size={size} /> }} />
    </Tabs>
  );
}
