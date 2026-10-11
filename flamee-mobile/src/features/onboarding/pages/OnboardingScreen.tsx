import { zodResolver } from "@hookform/resolvers/zod";
import { HeartHandshake } from "@tamagui/lucide-icons-2/icons/HeartHandshake";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Square } from "@tamagui/lucide-icons-2/icons/Square";
import { MapPin } from "@tamagui/lucide-icons-2/icons/MapPin";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, YStack } from "tamagui";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AppButton, AppField, AppHeader, AppScreen, AsyncStateView, SectionCard, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { inviteIntent } from "../../invites";
import { localOnboardingService, type LocalAccountSnapshot } from "../localOnboardingService";
import { profileSchema, type ProfileInput } from "../schemas";

function QuickProfile({ account, busy, failed, onSave, onSkip, onReceive }: {
  account: LocalAccountSnapshot; busy: boolean; failed: boolean;
  onSave: (value: ProfileInput, consent: boolean) => void;
  onSkip: () => void; onReceive?: () => void;
}) {
  const [accepted, setAccepted] = useState(Boolean(account.consentedAt));
  const [consentError, setConsentError] = useState(false);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: account.profile.displayName, partnerNickname: account.profile.partnerNickname, avatarUri: account.profile.avatarUri, timezone: account.profile.timezone },
  });
  return <AppScreen>
    <AppHeader eyebrow={getMessage("vi", "onboardingEyebrow")} title={getMessage("vi", "quickProfileTitle")} subtitle={getMessage("vi", "quickProfileBody")} />
    <Controller control={form.control} name="displayName" render={({ field, fieldState }) => <AppField label={getMessage("vi", "displayNameLabel")} placeholder={getMessage("vi", "displayNamePlaceholder")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} maxLength={40} error={fieldState.error?.message} />} />
    <Controller control={form.control} name="timezone" render={({ field, fieldState }) => <AppField label={getMessage("vi", "timezoneLabel")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />} />
    {!account.consentedAt ? <SectionCard description={getMessage("vi", "consentBody")}>
      <AppButton variant="ghost" icon={accepted ? <Check size={20} color="$primary" aria-hidden={true} /> : <Square size={20} aria-hidden={true} />} role="checkbox" aria-checked={accepted} disabled={busy} onPress={() => { setAccepted((value) => !value); setConsentError(false); }}>{getMessage("vi", "consentCheckbox")}</AppButton>
      {consentError ? <Text color="$error">{getMessage("vi", "consentRequired")}</Text> : null}
    </SectionCard> : null}
    {failed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} description={getMessage("vi", "localSaveErrorBody")} /> : null}
    <AppButton disabled={busy} onPress={form.handleSubmit((value) => { if (!accepted) { setConsentError(true); return; } onSave(value, accepted); })}>{getMessage("vi", "continue")}</AppButton>
    {onReceive ? <AppButton variant="secondary" disabled={busy} onPress={onReceive}>{getMessage("vi", "continueToInvitation")}</AppButton> : null}
    <AppButton variant="ghost" disabled={busy} onPress={onSkip}>{getMessage("vi", "skipToHome")}</AppButton>
  </AppScreen>;
}

export function OnboardingScreen() {
  const router = useRouter();
  const { start } = useLocalSearchParams<{ start?: string }>();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [account, setAccount] = useState<LocalAccountSnapshot | null>(null);
  const [step, setStep] = useState<"profile" | "partner" | "relation">("profile");
  const [relation, setRelation] = useState<"long_distance" | "same_city" | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setAccount(null);
    setFailed(false);
    if (!accountId) return;
    void localOnboardingService.getAccountSnapshot(accountId).then((value) => {
      if (!active) return;
      setAccount(value);
      setRelation(value.profile.relationType);
      setStep(inviteIntent.getCode() ? "profile" : start === "partner" ? "partner" : start === "profile" ? "profile" : value.setupStatus === "pending" ? value.setupStep : "partner");
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [accountId, start, attempt]);

  const run = async (action: () => Promise<void>) => {
    if (!accountId || pending.current) return;
    pending.current = true; setBusy(true); setFailed(false);
    try { await action(); } catch { setFailed(true); }
    finally { pending.current = false; setBusy(false); }
  };
  const finish = async (deferred: boolean, receive = false) => {
    if (!accountId) return;
    await localOnboardingService.finishSetup(accountId, deferred);
    if (!receive) inviteIntent.clear();
    router.replace(receive ? "/(invite)" : "/(main)");
  };
  const skip = () => { void run(() => finish(true)); };
  if (!accountId) return <AppScreen><AsyncStateView variant="error" title="localOnboardingUnavailableTitle" description="localOnboardingUnavailableBody" actionLabel="retry" onAction={() => router.replace("/(auth)")} /></AppScreen>;
  if (!account || account.accountId !== accountId) return <AppScreen><AsyncStateView variant={failed ? "error" : "loading"} title={failed ? "localOnboardingUnavailableTitle" : "loadingTitle"} description={failed ? "localOnboardingUnavailableBody" : "loadingDescription"} actionLabel={failed ? "retry" : undefined} onAction={() => setAttempt((value) => value + 1)} /><AppButton variant="ghost" disabled={busy} onPress={skip}>{getMessage("vi", "skipToHome")}</AppButton></AppScreen>;

  if (step === "profile") return <QuickProfile key={accountId} account={account} busy={busy} failed={failed} onSkip={skip}
    onReceive={inviteIntent.getCode() ? () => { void run(() => finish(false, true)); } : undefined}
    onSave={(value, consent) => { void run(async () => {
      if (!account.consentedAt && consent) await localOnboardingService.acceptConsent(accountId);
      await localOnboardingService.saveProfile(accountId, value);
      if (inviteIntent.getCode()) { await finish(false, true); return; }
      setAccount(await localOnboardingService.advanceSetup(accountId, "partner"));
      setStep("partner");
    }); }} />;

  return <AppScreen>
    <AppHeader eyebrow={getMessage("vi", "onboardingEyebrow")} title={getMessage("vi", step === "partner" ? "partnerQuestionTitle" : "relationTitle")} subtitle={getMessage("vi", step === "partner" ? "partnerQuestionBody" : "relationBody")} />
    {step === "partner" ? <>
      <YStack alignItems="center" paddingVertical="$xl"><HeartHandshake size={72} color="$primary" aria-hidden={true} /></YStack>
      <AppButton disabled={busy} onPress={() => { void run(async () => { setAccount(await localOnboardingService.advanceSetup(accountId, "relation")); setStep("relation"); }); }}>{getMessage("vi", "pairNow")}</AppButton>
      <AppButton variant="secondary" disabled={busy} onPress={skip}>{getMessage("vi", "noPartnerYet")}</AppButton>
    </> : <>
      <SectionCard tone={relation === "long_distance" ? "peach" : "default"}>
        <AppButton variant="ghost" icon={<MapPin size={20} />} aria-pressed={relation === "long_distance"} disabled={busy} onPress={() => setRelation("long_distance")}>{getMessage("vi", "relationLongDistance")}</AppButton>
        <Text color="$textSecondary">{getMessage("vi", "relationLongDistanceBody")}</Text>
      </SectionCard>
      <SectionCard tone={relation === "same_city" ? "peach" : "default"}>
        <AppButton variant="ghost" icon={<MapPin size={20} />} aria-pressed={relation === "same_city"} disabled={busy} onPress={() => setRelation("same_city")}>{getMessage("vi", "relationNearby")}</AppButton>
        <Text color="$textSecondary">{getMessage("vi", "relationSameCityBody")}</Text>
      </SectionCard>
      <AppButton disabled={!relation || busy} onPress={() => { void run(async () => {
        if (!relation) return;
        await localOnboardingService.saveRelationType(accountId, relation);
        await localOnboardingService.finishSetup(accountId);
        router.replace("/(invite)");
      }); }}>{getMessage("vi", "continue")}</AppButton>
    </>}
    {failed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} description={getMessage("vi", "localSaveErrorBody")} /> : null}
    <AppButton variant="ghost" disabled={busy} onPress={skip}>{getMessage("vi", "skipToHome")}</AppButton>
  </AppScreen>;
}
