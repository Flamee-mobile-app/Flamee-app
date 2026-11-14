import { useEffect, useRef, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppField, AppFilterChip, AsyncStateView, appToast } from "../../../shared/components";
import type { Locale } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { PreferencesError, type Preferences } from "../preferencesApi";
import { preferencesService } from "../preferencesService";
import { getCareSettingsCopy } from "../careSettingsLocale";

const careLabels = {
  encouragement: "encouragement", voice: "voice", photo: "photo",
  call: "call", space: "space", gift: "gift",
} as const satisfies Record<Preferences["care_preferences"][number], keyof ReturnType<typeof getCareSettingsCopy>>;
const relationships = [
  { value: null, label: "none" },
  { value: "long_distance", label: "longDistance" },
  { value: "same_city", label: "sameCity" },
] as const;

export function CareSettingsForm({ accountId, sessionId, locale, onLocaleChange }: { accountId: string | null; sessionId: number; locale: Locale; onLocaleChange: (locale: Locale) => void }) {
  const copy = getCareSettingsCopy(locale);
  const [baseline, setBaseline] = useState<Preferences | null>(null);
  const [draft, setDraft] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reloadReason, setReloadReason] = useState<"conflict" | "unknown" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const live = useRef(false);
  const saving = useRef(false);
  const saveController = useRef<AbortController | null>(null);
  const current = () => {
    const session = useSessionStore.getState();
    return live.current && Boolean(accountId) && session.activeAccountId === accountId && session.sessionId === sessionId;
  };
  useEffect(() => {
    live.current = true;
    const controller = new AbortController();
    setLoading(true); setFailed(false); setReloadReason(null); setBaseline(null); setDraft(null);
    if (!accountId) { setLoading(false); setFailed(true); }
    else void preferencesService.read(controller.signal).then((data) => {
      if (current() && !controller.signal.aborted) { setBaseline(data); setDraft(data); onLocaleChange(data.locale); }
    }, () => {
      if (current() && !controller.signal.aborted) setFailed(true);
    }).finally(() => { if (current() && !controller.signal.aborted) setLoading(false); });
    return () => { live.current = false; controller.abort(); saveController.current?.abort(); };
  }, [accountId, sessionId, attempt]);

  const save = async () => {
    if (!draft || !baseline || saving.current || reloadReason || !current()) return;
    saving.current = true; setBusy(true);
    const controller = new AbortController();
    saveController.current = controller;
    try {
      const saved = await preferencesService.save(draft, controller.signal);
      if (!current() || controller.signal.aborted) return;
      setBaseline(saved); setDraft(saved);
      appToast.success(copy.saved, { locale });
    } catch (error) {
      if (!current() || controller.signal.aborted) return;
      setReloadReason(error instanceof PreferencesError && error.code === "conflict" ? "conflict" : "unknown");
    } finally {
      saving.current = false;
      if (saveController.current === controller) saveController.current = null;
      if (current()) setBusy(false);
    }
  };
  if (loading) return <Text role="status" fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{copy.loading}</Text>;
  if (failed || !draft || !baseline) return <AsyncStateView locale={locale} variant="error" description="carePreferencesReadError" actionLabel="retry" onAction={() => setAttempt((value) => value + 1)} />;
  const changed = JSON.stringify(draft) !== JSON.stringify(baseline);
  return <YStack gap="$lg">
    <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{copy.body}</Text>
    <XStack flexWrap="wrap" gap="$sm">
      {(Object.keys(careLabels) as (keyof typeof careLabels)[]).map((id) => <AppFilterChip key={id} label={copy[careLabels[id]]} selectionMode="multiple" selected={draft.care_preferences.includes(id)} disabled={busy}
        onPress={() => setDraft((value) => value && ({ ...value, care_preferences: value.care_preferences.includes(id) ? value.care_preferences.filter((item) => item !== id) : [...value.care_preferences, id] }))} />)}
    </XStack>
    <AppField label={copy.note} placeholder={copy.notePlaceholder} multiline value={draft.care_note} editable={!busy}
      onChangeText={(value) => setDraft((currentDraft) => currentDraft && ({ ...currentDraft, care_note: Array.from(value).slice(0, 140).join("") }))} />
    <AppField label={copy.nickname} placeholder={copy.nicknamePlaceholder} value={draft.partner_nickname} editable={!busy}
      onChangeText={(value) => setDraft((currentDraft) => currentDraft && ({ ...currentDraft, partner_nickname: Array.from(value).slice(0, 40).join("") }))} />
    <YStack gap="$sm">
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{copy.relationship}</Text>
      <XStack flexWrap="wrap" gap="$sm" role="radiogroup" aria-label={copy.relationship}>
        {relationships.map((item) => <AppFilterChip key={item.label} label={copy[item.label]} selectionMode="single" selected={draft.relationship_type === item.value} disabled={busy}
          onPress={() => setDraft((value) => value && ({ ...value, relationship_type: item.value }))} />)}
      </XStack>
    </YStack>
    {reloadReason ? <YStack gap="$sm">
      <Text role="alert" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{reloadReason === "conflict" ? copy.conflict : copy.saveError}</Text>
      <AppButton variant="secondary" onPress={() => setAttempt((value) => value + 1)}>{copy.reload}</AppButton>
    </YStack> : null}
    <AppButton fill loading={busy} disabled={!changed || Boolean(reloadReason)} onPress={() => { void save(); }}>{copy.save}</AppButton>
  </YStack>;
}
