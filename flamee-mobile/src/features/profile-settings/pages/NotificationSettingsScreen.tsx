import { BellRing } from "@tamagui/lucide-icons-2";
import { useEffect, useState } from "react";
import { Label, Switch, Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppField, SectionCard, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { localNotificationAdapter } from "../../notifications";
import type { NotificationSettings } from "../../notifications";

export function NotificationSettingsScreen() {
  const accountId = useSessionStore((session) => session.activeAccountId);
  const [draft, setDraft] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [needsFirstCheckIn, setNeedsFirstCheckIn] = useState(false);

  const load = async () => {
    if (!accountId) { setLoading(false); setLoadFailed(true); return; }
    setLoading(true);
    setLoadFailed(false);
    try {
      setDraft(await localNotificationAdapter.getSettings(accountId));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [accountId]);

  const save = async () => {
    if (!accountId || !draft) return;
    const result = await localNotificationAdapter.setDailyReminder(accountId, draft.reminderEnabled, draft.reminderTime);
    setDraft(result.settings);
    setError(result.kind === "invalid_time" || result.kind === "unavailable");
    setNeedsFirstCheckIn(result.kind === "permission_required" && !result.settings.firstCheckInCompleted);
    setSaved(result.kind === "updated");
  };
  const requestPermission = async () => {
    if (!accountId || !draft) return;
    const result = await localNotificationAdapter.requestPermissionAfterFirstCheckIn(accountId);
    setDraft(result.settings);
    setNeedsFirstCheckIn(result.kind === "not_requested" && !result.settings.firstCheckInCompleted);
    setError(result.kind === "unavailable");
    setSaved(result.kind === "granted");
  };

  if (loading) return <YStack gap="$lg"><StatusBanner tone="info" title={getMessage("vi", "loadingTitle")} description={getMessage("vi", "loadingDescription")} /></YStack>;
  if (loadFailed || !draft) return <YStack gap="$lg"><StatusBanner tone="warning" title={getMessage("vi", "notificationReminderError")} /><AppButton variant="secondary" onPress={() => void load()}>{getMessage("vi", "retry")}</AppButton></YStack>;

  return (
    <YStack gap="$lg">
      <StatusBanner tone="info" title={getMessage("vi", "notificationLocalOnlyTitle")} description={getMessage("vi", "notificationLocalOnlyBody")} />
      <SectionCard title={getMessage("vi", "notificationPermissionTitle")} description={getMessage("vi", "notificationPermissionBody")}>
        <StatusBanner tone={draft.permission === "granted" ? "success" : draft.permission === "denied" ? "warning" : "info"} title={getMessage("vi", draft.permission === "granted" ? "permissionGranted" : draft.permission === "denied" ? "permissionDenied" : draft.permission === "unavailable" ? "permissionUnavailable" : "permissionNotRequested")} />
        {!draft.firstCheckInCompleted ? <Text fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "notificationFirstCheckInNeeded")}</Text> : null}
        {draft.permission === "not_requested" && draft.firstCheckInCompleted ? <AppButton icon={<BellRing size={18} />} onPress={() => void requestPermission()}>{getMessage("vi", "allowNotifications")}</AppButton> : null}
        {draft.permission === "denied" ? <Text fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "openOsSettingsGuide")}</Text> : null}
      </SectionCard>
      <SectionCard title={getMessage("vi", "notificationScheduleTitle")} description={getMessage("vi", "notificationScheduleBody")}>
        <XStack alignItems="center" justifyContent="space-between" gap="$md">
          <Label flex={1} fontSize="$bodyM" color="$textPrimary">{getMessage("vi", "notificationReminderEnabled")}</Label>
          <Switch accessibilityLabel={getMessage("vi", "notificationReminderEnabled")} disabled={!draft.firstCheckInCompleted} checked={draft.reminderEnabled} onCheckedChange={(reminderEnabled) => setDraft({ ...draft, reminderEnabled })}><Switch.Thumb /></Switch>
        </XStack>
        <AppField label={getMessage("vi", "reminderTimeLabel")} value={draft.reminderTime} onChangeText={(reminderTime) => setDraft({ ...draft, reminderTime })} placeholder="20:00" />
        {needsFirstCheckIn ? <StatusBanner tone="info" title={getMessage("vi", "notificationFirstCheckInNeeded")} /> : null}
      </SectionCard>
      {error ? <StatusBanner tone="warning" title={getMessage("vi", "notificationReminderError")} /> : null}
      {saved ? <StatusBanner tone="success" title={getMessage("vi", "notificationReminderSaved")} /> : null}
      <AppButton onPress={save}>{getMessage("vi", "save")}</AppButton>
    </YStack>
  );
}
