import { Bell } from "@tamagui/lucide-icons-2/icons/Bell";
import { Database } from "@tamagui/lucide-icons-2/icons/Database";
import { HeartHandshake } from "@tamagui/lucide-icons-2/icons/HeartHandshake";
import { HelpCircle } from "@tamagui/lucide-icons-2/icons/HelpCircle";
import { Moon } from "@tamagui/lucide-icons-2/icons/Moon";
import { Settings } from "@tamagui/lucide-icons-2/icons/Settings";
import { UserRound } from "@tamagui/lucide-icons-2/icons/UserRound";
import { useRouter } from "expo-router";
import { Children, Fragment, type PropsWithChildren } from "react";
import { Text, YStack } from "tamagui";
import { AppHeader, AppMenuRow, AppScreen, SectionCard } from "../../../shared/components";
import { featureTokens, menuTokens } from "../../../shared/constants/tokens";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";
import { useFabActions } from "../../main-navigation";
import { profileSettingsSections } from "../settingsSections";

const rowDetails: Record<(typeof profileSettingsSections)[number], { key: MessageKey; icon: typeof UserRound }> = {
  profile: { key: "profileEditTitle", icon: UserRound },
  care: { key: "careSettingsTitle", icon: HeartHandshake },
  notifications: { key: "notificationSettingsTitle", icon: Bell },
  data: { key: "dataSettingsTitle", icon: Database },
  support: { key: "supportSettingsTitle", icon: HelpCircle },
  account: { key: "accountSettingsTitle", icon: Settings },
};

const menuGroups = [
  { title: "profileMenuAccountGroup", sections: ["profile", "notifications"] },
  { title: "profileMenuConnectionGroup", sections: ["care", "account"] },
  { title: "profileMenuSupportGroup", sections: ["support", "data"] },
] as const;

function MenuGroup({ title, tone = "default", children }: PropsWithChildren<{ title: string; tone?: "default" | "peach" }>) {
  const rows = Children.toArray(children);
  return (
    <YStack gap="$sm">
      <Text role="heading" aria-level={2} fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textSecondary" paddingHorizontal="$xs">
        {title}
      </Text>
      <SectionCard tone={tone} density="compact">
        <YStack>
          {rows.map((row, index) => (
            <Fragment key={index}>
              {index > 0 ? <YStack height={1} marginLeft={menuTokens.separatorInset} backgroundColor="$border" aria-hidden={true} /> : null}
              {row}
            </Fragment>
          ))}
        </YStack>
      </SectionCard>
    </YStack>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { quickActions } = useFabActions("accent");

  return (
    <AppScreen contentProps={{ width: "100%", maxWidth: featureTokens.maxWidth, alignSelf: "center", paddingBottom: featureTokens.navigationClearance }}>
      <AppHeader title={getMessage("vi", "profileMenuTitle")} />
      <YStack gap="$lg">
        {menuGroups.map((group) => (
          <MenuGroup key={group.title} title={getMessage("vi", group.title)}>
              {group.sections.map((section) => {
                const { key, icon: Icon } = rowDetails[section];
                return (
                  <AppMenuRow
                    key={section}
                    testID={`profile-menu-${section}`}
                    label={getMessage("vi", key)}
                    icon={<Icon size={menuTokens.iconSize} color="$textSecondary" aria-hidden={true} />}
                    onPress={() => router.push({ pathname: "/settings", params: { section } })}
                  />
                );
              })}
              {group.title === "profileMenuAccountGroup" ? (
                <AppMenuRow
                  testID="profile-menu-dark-mode"
                  label={getMessage("vi", "profileDarkMode")}
                  icon={<Moon size={menuTokens.iconSize} color="$textSecondary" aria-hidden={true} />}
                  onPress={() => undefined}
                />
              ) : null}
          </MenuGroup>
        ))}
        <MenuGroup title={getMessage("vi", "profileAlsoFlameeGroup")}>
            {quickActions.map((action) => (
              <AppMenuRow key={action.key} testID={`profile-quick-${action.key}`} label={action.label} icon={action.icon} onPress={action.onPress} />
            ))}
        </MenuGroup>
      </YStack>
    </AppScreen>
  );
}
