import { zodResolver } from "@hookform/resolvers/zod";
import { HeartHandshake } from "@tamagui/lucide-icons-2/icons/HeartHandshake";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { YStack } from "tamagui";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AppButton, AppField, AppHeader, AppScreen, AsyncStateView, SectionCard, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { inviteIntent } from "../../invites";
import { localOnboardingService, type LocalAccountSnapshot } from "../localOnboardingService";
import { profileSchema, type ProfileInput } from "../schemas";

function QuickProfile({ account, busy, failed, onSave, onSkip, onReceive }: {
  account: LocalAccountSnapshot; busy: boolean; failed: boolean;
  onSave: (value: ProfileInput) => void;
  onSkip: () => void; onReceive?: () => void;
}) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: account.profile.displayName, partnerNickname: account.profile.partnerNickname, avatarUri: account.profile.avatarUri, timezone: account.profile.timezone },
  });
  return <AppScreen>
    <AppHeader eyebrow={getMessage("vi", "onboardingEyebrow")} title={getMessage("vi", "quickProfileTitle")} subtitle={getMessage("vi", "quickProfileBody")} />
    <Controller control={form.control} name="displayName" render={({ field, fieldState }) => <AppField label={getMessage("vi", "displayNameLabel")} placeholder={getMessage("vi", "displayNamePlaceholder")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} maxLength={40} error={fieldState.error?.message} />} />
    {failed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} description={getMessage("vi", "localSaveErrorBody")} /> : null}
    <AppButton disabled={busy} onPress={form.handleSubmit(onSave)}>{getMessage("vi", "continue")}</AppButton>
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
    onSave={(value) => { void run(async () => {
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
      <SectionCard tone={relation === "long_distance" ? "peach" : "default"} selected={relation === "long_distance"} selectionMode="single" disabled={busy}
        title={getMessage("vi", "relationLongDistance")} description={getMessage("vi", "relationLongDistanceBody")} accessibilityLabel={getMessage("vi", "relationLongDistance")} onPress={() => setRelation("long_distance")} />
      <SectionCard tone={relation === "same_city" ? "peach" : "default"} selected={relation === "same_city"} selectionMode="single" disabled={busy}
        title={getMessage("vi", "relationNearby")} description={getMessage("vi", "relationSameCityBody")} accessibilityLabel={getMessage("vi", "relationNearby")} onPress={() => setRelation("same_city")} />
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
