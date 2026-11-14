import { AsyncStateView, FeatureScreen } from "../../../shared/components";
import { useState } from "react";
import { getMessage, type Locale } from "../../../shared/localization/messages";
import { AccountLifecycleScreen } from "../../account-lifecycle";
import { NotificationSettingsScreen } from "./NotificationSettingsScreen";
import { ProfileEditScreen } from "./ProfileEditScreen";
import { PasswordChangeScreen } from "./PasswordChangeScreen";
import { CareSettingsForm } from "../components/CareSettingsForm";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { getCareSettingsCopy, resolveCareLocale } from "../careSettingsLocale";
import { resolveSettingsSection } from "../settingsSections";

export function SettingsScreen({ initialSection = "menu" }: { initialSection?: string }) {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const [careLanguage, setCareLanguage] = useState<{ accountId: string | null; sessionId: number; locale: Locale } | null>(null);
  const careLocale = resolveCareLocale(careLanguage?.accountId === accountId && careLanguage.sessionId === sessionId ? careLanguage.locale : null);
  const careCopy = getCareSettingsCopy(careLocale);
  const section = resolveSettingsSection(initialSection);
  if (section === "profile") return <ProfileEditScreen />;
  if (section === "password") return <PasswordChangeScreen />;
  const title = section === "care" ? "careSettingsTitle" : section === "notifications" ? "notificationSettingsTitle" : section === "data" ? "dataSettingsTitle" : section === "support" ? "supportSettingsTitle" : section === "account" ? "accountSettingsTitle" : "settingsTitle";
  return <FeatureScreen title={section === "care" ? careCopy.title : getMessage("vi", title)} backLabel={section === "care" ? careCopy.back : undefined} showBack withBottomNavigation={false}>
    {section === "care" ? <CareSettingsForm key={`${sessionId}:${accountId}`} accountId={accountId} sessionId={sessionId} locale={careLocale} onLocaleChange={(locale) => setCareLanguage({ accountId, sessionId, locale })} /> : null}
    {section === "menu" ? <AsyncStateView variant="pending" title="featureNotConnectedTitle" description="featureNotConnectedBody" /> : null}
    {section === "notifications" ? <NotificationSettingsScreen /> : null}
    {section === "data" || section === "support" || section === "account" ? <AccountLifecycleScreen mode={section} /> : null}
  </FeatureScreen>;
}
