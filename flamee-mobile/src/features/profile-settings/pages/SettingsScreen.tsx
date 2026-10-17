import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { YStack } from "tamagui";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AppButton, AppField, AsyncStateView, FeatureScreen, StatusBanner, appToast } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { authService, type AuthSession } from "../../auth";
import { AccountLifecycleScreen } from "../../account-lifecycle";
import { NotificationSettingsScreen } from "./NotificationSettingsScreen";
import { resolveSettingsSection } from "../settingsSections";

export function SettingsScreen({ initialSection = "menu" }: { initialSection?: string }) {
  const accountId = useSessionStore((session) => session.activeAccountId);
  const section = resolveSettingsSection(initialSection);
  const [profile, setProfile] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const revision = useRef(0);
  const pending = useRef(false);
  const load = useCallback(async () => {
    const request = ++revision.current;
    setLoading(true); setFailed(false); setProfile(null); setSaveFailed(false);
    try {
      const session = await authService.refreshCurrentSession();
      if (request !== revision.current || useSessionStore.getState().activeAccountId !== accountId) return;
      if (!session || session.accountId !== accountId) throw new Error("Session unavailable");
      setProfile(session);
      setDisplayName(session.user.full_name);
      setUsername(session.user.username ?? "");
    } catch { if (request === revision.current) setFailed(true); }
    finally { if (request === revision.current) setLoading(false); }
  }, [accountId]);
  useFocusEffect(useCallback(() => {
    if (section === "profile") void load();
    return () => { revision.current += 1; };
  }, [section, load]));

  const invalid = !displayName.trim() || displayName.trim().length > 120 || Array.from(username.trim()).length > 40;
  const save = async () => {
    if (pending.current || invalid || profile?.accountId !== accountId) return;
    pending.current = true; setBusy(true); setSaveFailed(false);
    const request = revision.current;
    try {
      const session = await authService.updateProfile({ full_name: displayName.trim(), username: username.trim() });
      if (request !== revision.current || useSessionStore.getState().activeAccountId !== accountId) return;
      setProfile(session); setDisplayName(session.user.full_name); setUsername(session.user.username ?? "");
      appToast.success(getMessage("vi", "settingsSaved"));
    } catch { if (request === revision.current) setSaveFailed(true); }
    finally { pending.current = false; setBusy(false); }
  };
  const title = section === "profile" ? "profileEditTitle" : section === "care" ? "careSettingsTitle" : section === "notifications" ? "notificationSettingsTitle" : section === "data" ? "dataSettingsTitle" : section === "support" ? "supportSettingsTitle" : section === "account" ? "accountSettingsTitle" : "settingsTitle";
  return <FeatureScreen title={getMessage("vi", title)} showBack withBottomNavigation={false}>
    {section === "profile" ? loading ? <AsyncStateView variant="loading" /> : failed || profile?.accountId !== accountId ? <AsyncStateView variant="error" title="settingsLoadError" actionLabel="retry" onAction={() => void load()} /> : <YStack gap="$lg">
      <AppField label={getMessage("vi", "displayNameLabel")} value={displayName} onChangeText={setDisplayName} maxLength={120} editable={!busy} />
      <AppField label={getMessage("vi", "profileUsernameLabel")} value={username} onChangeText={setUsername} maxLength={80} editable={!busy} />
      {invalid ? <StatusBanner tone="warning" title={getMessage("vi", "settingsValidationError")} /> : null}
      {saveFailed ? <StatusBanner tone="warning" title={getMessage("vi", "profileSaveFailed")} /> : null}
      <AppButton disabled={invalid || busy} loading={busy} onPress={() => void save()}>{getMessage("vi", "save")}</AppButton>
    </YStack> : null}
    {section === "care" || section === "menu" ? <AsyncStateView variant="pending" title="featureNotConnectedTitle" description="featureNotConnectedBody" /> : null}
    {section === "notifications" ? <NotificationSettingsScreen /> : null}
    {section === "data" || section === "support" || section === "account" ? <AccountLifecycleScreen mode={section} /> : null}
  </FeatureScreen>;
}
