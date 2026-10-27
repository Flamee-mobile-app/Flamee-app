import { AsyncStateView, FeatureScreen } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { AccountLifecycleScreen } from "../../account-lifecycle";
import { NotificationSettingsScreen } from "./NotificationSettingsScreen";
import { ProfileEditScreen } from "./ProfileEditScreen";
import { PasswordChangeScreen } from "./PasswordChangeScreen";
import { resolveSettingsSection } from "../settingsSections";

export function SettingsScreen({ initialSection = "menu" }: { initialSection?: string }) {
  const section = resolveSettingsSection(initialSection);
  if (section === "profile") return <ProfileEditScreen />;
  if (section === "password") return <PasswordChangeScreen />;
  const title = section === "care" ? "careSettingsTitle" : section === "notifications" ? "notificationSettingsTitle" : section === "data" ? "dataSettingsTitle" : section === "support" ? "supportSettingsTitle" : section === "account" ? "accountSettingsTitle" : "settingsTitle";
  return <FeatureScreen title={getMessage("vi", title)} showBack withBottomNavigation={false}>
    {section === "care" || section === "menu" ? <AsyncStateView variant="pending" title="featureNotConnectedTitle" description="featureNotConnectedBody" /> : null}
    {section === "notifications" ? <NotificationSettingsScreen /> : null}
    {section === "data" || section === "support" || section === "account" ? <AccountLifecycleScreen mode={section} /> : null}
  </FeatureScreen>;
}
