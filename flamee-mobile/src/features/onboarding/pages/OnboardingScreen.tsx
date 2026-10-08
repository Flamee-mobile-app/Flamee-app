import { zodResolver } from "@hookform/resolvers/zod";
import { Check, MapPin, Sparkles } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppField, AppHeader, AppScreen, AsyncStateView, ChoiceChip, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage, type MessageKey } from "../../../shared/localization/messages";
import { localOnboardingService, type LocalAccountSnapshot } from "../localOnboardingService";
import {
  carePreferenceIds,
  carePreferencesSchema,
  profileSchema,
  relationSchema,
  type CarePreferencesInput,
  type ProfileInput,
  type RelationInput,
} from "../schemas";

const careLabels: Record<(typeof carePreferenceIds)[number], MessageKey> = {
  encouragement: "careEncouragement",
  voice: "careVoice",
  photo: "carePhoto",
  call: "careCall",
  space: "careSpace",
  gift: "careGift",
};

function ProgressDots({ step }: { step: number }) {
  return (
    <XStack gap="$sm" accessibilityLabel={formatMessage("vi", "stepProgress", { step, total: 4 })}>
      {[1, 2, 3, 4].map((item) => (
        <YStack
          key={item}
          flex={1}
          height={4}
          borderRadius="$xl"
          backgroundColor={item <= step ? "$primary" : "$supportPeachLight"}
        />
      ))}
    </XStack>
  );
}

function ConsentStep({ onContinue, busy, saveFailed }: { onContinue: () => void; busy: boolean; saveFailed: boolean }) {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(false);
  return (
    <AppScreen>
      <ProgressDots step={1} />
      <AppHeader eyebrow={getMessage("vi", "onboardingEyebrow")} title={getMessage("vi", "consentTitle")} subtitle={getMessage("vi", "consentBody")} />
      <SectionCard tone="lavender">
        <AppButton
          variant="ghost"
          justifyContent="flex-start"
          icon={accepted ? <Check size={20} color="$primary" /> : undefined}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          onPress={() => { setAccepted((value) => !value); setError(false); }}
        >
          {getMessage("vi", "consentCheckbox")}
        </AppButton>
        {error ? <Text color="$error">{getMessage("vi", "consentRequired")}</Text> : null}
        {saveFailed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} description={getMessage("vi", "localSaveErrorBody")} /> : null}
      </SectionCard>
      <AppButton disabled={busy} onPress={() => accepted ? onContinue() : setError(true)}>
        {getMessage("vi", "agreeContinue")}
      </AppButton>
    </AppScreen>
  );
}

function ProfileStep({ snapshot, onSave, busy, saveFailed }: { snapshot: LocalAccountSnapshot; onSave: (value: ProfileInput) => void; busy: boolean; saveFailed: boolean }) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: snapshot.profile.displayName,
      partnerNickname: snapshot.profile.partnerNickname,
      avatarUri: snapshot.profile.avatarUri,
      timezone: snapshot.profile.timezone,
    },
  });
  return (
    <AppScreen>
      <ProgressDots step={2} />
      <AppHeader title={getMessage("vi", "profileSetupTitle")} subtitle={getMessage("vi", "profileSetupBody")} />
      <YStack alignItems="center" gap="$sm">
        <YStack width={88} height={88} borderRadius="$xl" backgroundColor="$supportPeachLight" alignItems="center" justifyContent="center">
          <Sparkles size={32} color="$primary" />
        </YStack>
        <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "avatarLater")}</Text>
      </YStack>
      <Controller
        control={form.control}
        name="displayName"
        render={({ field, fieldState }) => (
          <AppField label={getMessage("vi", "displayNameLabel")} placeholder={getMessage("vi", "displayNamePlaceholder")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={form.control}
        name="partnerNickname"
        render={({ field, fieldState }) => (
          <AppField label={getMessage("vi", "nicknameLabel")} placeholder={getMessage("vi", "nicknamePlaceholder")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={form.control}
        name="timezone"
        render={({ field, fieldState }) => (
          <AppField label={getMessage("vi", "timezoneLabel")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )}
      />
      {saveFailed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} description={getMessage("vi", "localSaveErrorBody")} /> : null}
      <AppButton disabled={busy} onPress={form.handleSubmit(onSave)}>
        {getMessage("vi", "continue")}
      </AppButton>
    </AppScreen>
  );
}

function CareStep({ snapshot, onSave, busy, saveFailed }: { snapshot: LocalAccountSnapshot; onSave: (preferences: CarePreferencesInput["preferences"], note: string) => void; busy: boolean; saveFailed: boolean }) {
  const form = useForm<CarePreferencesInput>({
    resolver: zodResolver(carePreferencesSchema),
    defaultValues: { preferences: snapshot.profile.carePreferences as CarePreferencesInput["preferences"], note: snapshot.profile.careNote },
  });
  const preferences = form.watch("preferences");
  return (
    <AppScreen>
      <ProgressDots step={3} />
      <AppHeader title={getMessage("vi", "careTitle")} subtitle={getMessage("vi", "careBody")} />
      <XStack flexWrap="wrap" gap="$sm">
        {carePreferenceIds.map((id) => {
          const selected = preferences.includes(id);
          return (
            <ChoiceChip
              key={id}
              label={getMessage("vi", careLabels[id])}
              selected={selected}
              onPress={() => form.setValue("preferences", selected ? preferences.filter((item) => item !== id) : [...preferences, id], { shouldValidate: true })}
            />
          );
        })}
      </XStack>
      <Controller
        control={form.control}
        name="note"
        render={({ field, fieldState }) => (
          <AppField
            multiline
            label={getMessage("vi", "careNoteLabel")}
            placeholder={getMessage("vi", "careNotePlaceholder")}
            maxLength={140}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            characterCount={`${field.value.length}/140`}
          />
        )}
      />
      {saveFailed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} description={getMessage("vi", "localSaveErrorBody")} /> : null}
      <AppButton disabled={busy} onPress={form.handleSubmit(({ preferences: selected, note }) => onSave(selected, note))}>
        {getMessage("vi", "continue")}
      </AppButton>
      <AppButton variant="ghost" disabled={busy} onPress={() => onSave([], "")}>
        {getMessage("vi", "skipForNow")}
      </AppButton>
    </AppScreen>
  );
}

function RelationStep({ onSave, busy, saveFailed }: { onSave: (relationType: RelationInput["relationType"]) => void; busy: boolean; saveFailed: boolean }) {
  const form = useForm<RelationInput>({ resolver: zodResolver(relationSchema) });
  const selected = form.watch("relationType");
  return (
    <AppScreen>
      <ProgressDots step={4} />
      <AppHeader title={getMessage("vi", "relationTitle")} subtitle={getMessage("vi", "relationBody")} />
      <SectionCard tone={selected === "long_distance" ? "peach" : "default"}>
        <AppButton variant="ghost" justifyContent="flex-start" icon={<MapPin size={20} color="$primary" />} onPress={() => form.setValue("relationType", "long_distance", { shouldValidate: true })}>
          {getMessage("vi", "relationLongDistance")}
        </AppButton>
        <Text color="$textSecondary">{getMessage("vi", "relationLongDistanceBody")}</Text>
      </SectionCard>
      <SectionCard tone={selected === "same_city" ? "lavender" : "default"}>
        <AppButton variant="ghost" justifyContent="flex-start" icon={<MapPin size={20} color="$secondary" />} onPress={() => form.setValue("relationType", "same_city", { shouldValidate: true })}>
          {getMessage("vi", "relationSameCity")}
        </AppButton>
        <Text color="$textSecondary">{getMessage("vi", "relationSameCityBody")}</Text>
      </SectionCard>
      <AppButton
        disabled={!selected || busy}
        onPress={form.handleSubmit(({ relationType }) => onSave(relationType))}
      >
        {getMessage("vi", "createInviteNext")}
      </AppButton>
      {saveFailed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} description={getMessage("vi", "localSaveErrorBody")} /> : null}
    </AppScreen>
  );
}

export function OnboardingScreen() {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [snapshot, setSnapshot] = useState<LocalAccountSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!accountId) return () => { active = false; };
    void localOnboardingService.getAccountSnapshot(accountId).then((next) => {
      if (active) {
        setSnapshot(next);
        setLoadFailed(false);
      }
    }).catch(() => {
      if (active) setLoadFailed(true);
    });
    return () => { active = false; };
  }, [accountId]);

  useEffect(() => {
    if (snapshot?.onboardingStep === "complete") router.replace("/(invite)");
  }, [router, snapshot?.onboardingStep]);

  const update = async (operation: () => Promise<LocalAccountSnapshot>): Promise<boolean> => {
    if (!accountId || busy) return false;
    setBusy(true);
    setLoadFailed(false);
    try {
      setSnapshot(await operation());
      return true;
    } catch {
      setLoadFailed(true);
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!accountId) {
    return <AppScreen><AsyncStateView variant="error" title="localOnboardingUnavailableTitle" description="localOnboardingUnavailableBody" actionLabel="retry" onAction={() => router.replace("/(auth)")} /></AppScreen>;
  }

  if (loadFailed && !snapshot) {
    return <AppScreen><AsyncStateView variant="error" title="localOnboardingUnavailableTitle" description="localOnboardingUnavailableBody" actionLabel="retry" onAction={() => { setLoadFailed(false); void localOnboardingService.getAccountSnapshot(accountId).then(setSnapshot).catch(() => setLoadFailed(true)); }} /></AppScreen>;
  }

  if (!snapshot) return <AppScreen><AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /></AppScreen>;

  switch (snapshot.onboardingStep) {
    case "consent":
      return <ConsentStep busy={busy} saveFailed={loadFailed} onContinue={() => void update(() => localOnboardingService.acceptConsent(accountId))} />;
    case "profile":
      return <ProfileStep snapshot={snapshot} busy={busy} saveFailed={loadFailed} onSave={(value) => void update(() => localOnboardingService.saveProfile(accountId, value))} />;
    case "care":
      return <CareStep snapshot={snapshot} busy={busy} saveFailed={loadFailed} onSave={(preferences, note) => void update(() => localOnboardingService.saveCarePreferences(accountId, preferences, note))} />;
    case "relation":
      return <RelationStep busy={busy} saveFailed={loadFailed} onSave={(relationType) => void update(() => localOnboardingService.saveRelationType(accountId, relationType))} />;
    case "complete":
      return null;
    default:
      return <AppScreen><AsyncStateView variant="error" title="localOnboardingUnavailableTitle" description="localOnboardingUnavailableBody" actionLabel="retry" onAction={() => router.replace("/(auth)")} /></AppScreen>;
  }
}
