import { useEffect, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppField, AppHeader, AppScreen, ChoiceChip, SectionCard, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { carePreferenceIds } from "../../onboarding";
import { AccountLifecycleScreen } from "../../account-lifecycle";
import { NotificationSettingsScreen } from "./NotificationSettingsScreen";
import { PrivacyScreen } from "./PrivacyScreen";
import { localSettingsService, type LocalSettingsSnapshot } from "../localSettingsService";

export type SettingsSection = "menu" | "profile" | "care" | "notifications" | "privacy" | "data" | "support" | "account";
const settingsSections: readonly SettingsSection[] = ["menu", "profile", "care", "notifications", "privacy", "data", "support", "account"];

export function SettingsScreen({ initialSection = "menu" }: { initialSection?: string }) {
  const accountId = useSessionStore((session) => session.activeAccountId);
  const section: SettingsSection = settingsSections.includes(initialSection as SettingsSection) ? initialSection as SettingsSection : "menu";
  const [settings, setSettings] = useState<LocalSettingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [partnerNickname, setPartnerNickname] = useState("");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [care, setCare] = useState<string[]>([]);
  const [careNote, setCareNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const loadSettings = async () => {
    if (!accountId) { setLoading(false); setLoadFailed(true); return; }
    setLoading(true);
    setLoadFailed(false);
    try {
      const result = await localSettingsService.getSettings(accountId);
      setSettings(result);
      setDisplayName(result.profile.displayName);
      setPartnerNickname(result.profile.partnerNickname);
      setTimezone(result.profile.timezone);
      setCare(result.profile.carePreferences);
      setCareNote(result.profile.careNote);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (section === "profile" || section === "care") void loadSettings();
    else setLoading(false);
  }, [accountId, section]);

  const saveProfile = async () => {
    if (!accountId) { setError(true); return; }
    setBusy(true); setSaved(false);
    const result = await localSettingsService.updateProfile(accountId, { displayName, partnerNickname, timezone });
    setBusy(false); setError(result.kind !== "updated"); setSaved(result.kind === "updated");
    if (result.kind === "updated") setSettings(result.settings);
  };
  const saveCare = async () => {
    if (!accountId) { setError(true); return; }
    setBusy(true); setSaved(false);
    const result = await localSettingsService.updateCarePreferences(accountId, care, careNote);
    setBusy(false); setError(result.kind !== "updated"); setSaved(result.kind === "updated");
    if (result.kind === "updated") setSettings(result.settings);
  };
  const toggleCare = (id: string) => setCare((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  if ((section === "profile" || section === "care") && (loading || (!loadFailed && accountId !== null && settings?.accountId !== accountId))) {
    return <AppScreen><AppHeader showBack title={getMessage("vi", "settingsTitle")} /><StatusBanner tone="info" title={getMessage("vi", "loadingTitle")} description={getMessage("vi", "loadingDescription")} /></AppScreen>;
  }
  if ((section === "profile" || section === "care") && (loadFailed || !settings)) {
    return <AppScreen><AppHeader showBack title={getMessage("vi", "settingsTitle")} /><StatusBanner tone="warning" title={getMessage("vi", "settingsLoadError")} /><AppButton variant="secondary" onPress={() => void loadSettings()}>{getMessage("vi", "retry")}</AppButton></AppScreen>;
  }

  return (
    <AppScreen>
      <AppHeader showBack title={getMessage("vi", section === "profile" ? "profileEditTitle" : section === "care" ? "careSettingsTitle" : section === "notifications" ? "notificationSettingsTitle" : section === "privacy" ? "privacySettingsTitle" : "settingsTitle")} />
      {section === "profile" ? <YStack gap="$lg"><AppField label={getMessage("vi", "displayNameLabel")} value={displayName} onChangeText={setDisplayName} maxLength={40} /><AppField label={getMessage("vi", "nicknameLabel")} value={partnerNickname} onChangeText={setPartnerNickname} maxLength={40} /><AppField label={getMessage("vi", "timezoneLabel")} value={timezone} onChangeText={setTimezone} /><AppButton disabled={busy} onPress={() => void saveProfile()}>{getMessage("vi", "save")}</AppButton></YStack> : null}
      {section === "care" ? <YStack gap="$lg"><SectionCard description={getMessage("vi", "careSettingsBody")}><XStack flexWrap="wrap" gap="$sm">{carePreferenceIds.map((id) => <ChoiceChip key={id} label={getMessage("vi", id === "encouragement" ? "careEncouragement" : id === "voice" ? "careVoice" : id === "photo" ? "carePhoto" : id === "call" ? "careCall" : id === "space" ? "careSpace" : "careGift")} selected={care.includes(id)} onPress={() => toggleCare(id)} />)}</XStack><AppField multiline label={getMessage("vi", "careNoteLabel")} value={careNote} onChangeText={setCareNote} maxLength={140} characterCount={`${careNote.length}/140`} /><Text fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "carePartnerVisibility")}</Text></SectionCard><AppButton disabled={busy} onPress={() => void saveCare()}>{getMessage("vi", "save")}</AppButton></YStack> : null}
      {section === "notifications" ? <NotificationSettingsScreen /> : null}
      {section === "privacy" ? <PrivacyScreen /> : null}
      {section === "data" ? <AccountLifecycleScreen mode="data" /> : null}
      {section === "support" ? <AccountLifecycleScreen mode="support" /> : null}
      {section === "account" ? <AccountLifecycleScreen mode="account" /> : null}
      {section === "menu" ? <SectionCard title={getMessage("vi", "settingsChooseTitle")} description={getMessage("vi", "settingsChooseBody")} /> : null}
      {error ? <StatusBanner tone="warning" title={getMessage("vi", "settingsValidationError")} /> : null}
      {saved ? <StatusBanner tone="success" title={getMessage("vi", "settingsSaved")} /> : null}
    </AppScreen>
  );
}
