import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2 } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppField, AppHeader, AppScreen, AsyncStateView, ChoiceChip, StatusBanner } from "../../../shared/components";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";
import { localCoupleService } from "../../couple";
import { localNudgeService } from "../../nudges";
import { localNotificationAdapter } from "../../notifications";
import { localOnboardingService } from "../../onboarding";
import { localCheckInService, type CheckInSubmissionResult } from "../localCheckInService";
import { createCheckInSchema, type CheckInInput } from "../schemas";
import { MoodSelector } from "./MoodSelector";
import { ShareScopePicker } from "./ShareScopePicker";
import { localCheckInReasons, type Mood, type ShareScope } from "../types";

type CheckInResult = "saved_local" | "pending" | "error";

type CheckInComposerProps = {
  onClose?: () => void;
  onCompleted?: (result: CheckInResult, nudgeId?: string) => void;
};

export function CheckInComposer({ onClose, onCompleted }: CheckInComposerProps) {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [result, setResult] = useState<CheckInSubmissionResult | null>(null);
  const [reasons, setReasons] = useState(localCheckInReasons);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nudgeFailed, setNudgeFailed] = useState(false);
  const resolver = useMemo(() => zodResolver(createCheckInSchema(reasons.map((reason) => reason.id))), [reasons]);
  const form = useForm<CheckInInput>({
    resolver,
    defaultValues: { reasonIds: [], note: "", shareScope: "full" },
  });
  const mood = form.watch("mood") as Mood | undefined;
  const reasonIds = form.watch("reasonIds");
  const scope = form.watch("shareScope") as ShareScope;
  const note = form.watch("note");

  const load = async () => {
    if (!accountId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    try {
      const [catalog, account] = await Promise.all([
        localCheckInService.getReasons(),
        localOnboardingService.getAccountSnapshot(accountId),
      ]);
      setReasons(catalog);
      if (account.onboardingStep !== "complete") setLoadFailed(true);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [accountId]);

  const attemptSubmit = async (value: CheckInInput) => {
    if (!accountId || submitting) return;
    setSubmitting(true);
    setResult(null);
    setNudgeFailed(false);
    try {
      const next = await localCheckInService.submit(accountId, value);
      if (next.kind === "saved_local" || next.kind === "pending") {
        await localNotificationAdapter.markFirstCheckInCompleted(accountId);
      }
      if ((next.kind === "saved_local" || next.kind === "pending") && next.checkIn.shareScope !== "private_only") {
        try {
          const membership = await localCoupleService.getMembership(accountId);
          if (membership.status === "paired" && membership.coupleId && membership.partner) {
            const nudgeResult = await localNudgeService.createForSharedCheckIn({
              sourceCheckIn: next.checkIn,
              recipientId: membership.partner.id,
              recipientTimezone: membership.partner.timezone,
              coupleId: membership.coupleId,
            });
            if (nudgeResult.kind === "support_content_unavailable") router.push("/nudge/support-unavailable");
            else if (nudgeResult.kind === "template_unavailable") setNudgeFailed(true);
          }
        } catch {
          setNudgeFailed(true);
        }
      }
      setResult(next);
    } catch {
      setResult({ kind: "error", error: "storage", retryable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const submit = form.handleSubmit((value) => void attemptSubmit(value));

  if (!accountId) return <AppScreen><AsyncStateView variant="error" title="localCheckInUnavailableTitle" description="localCheckInUnavailableBody" actionLabel="retry" onAction={onClose} /></AppScreen>;
  if (loading) return <AppScreen><AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /></AppScreen>;
  if (loadFailed) return <AppScreen><AsyncStateView variant="error" title="localCheckInUnavailableTitle" description="localCheckInUnavailableBody" actionLabel="retry" onAction={() => void load()} /></AppScreen>;

  if (result) {
    const privateCheckIn = result.kind === "saved_local" && result.checkIn.shareScope === "private_only";
    const copy = result.kind === "pending"
      ? { variant: "pending" as const, title: "checkInPendingLocalTitle" as const, body: "checkInPendingLocalBody" as const }
      : result.kind === "error"
        ? { variant: "error" as const, title: "checkInSaveErrorTitle" as const, body: "checkInSaveErrorBody" as const }
        : privateCheckIn
          ? { variant: "success" as const, title: "checkInPrivateTitle" as const, body: "checkInPrivateLocalBody" as const }
          : { variant: "success" as const, title: "checkInSavedLocalTitle" as const, body: "checkInSavedLocalBody" as const };
    return (
      <AppScreen scroll={false}>
        {nudgeFailed ? <StatusBanner tone="warning" title={getMessage("vi", "nudgeCreationUnavailableTitle")} description={getMessage("vi", "nudgeCreationUnavailableBody")} /> : null}
        <AsyncStateView
          variant={copy.variant}
          title={copy.title}
          description={copy.body}
          actionLabel={result.kind === "error" && result.retryable ? "retry" : "backToToday"}
          onAction={async () => {
            if (result.kind === "error" && result.retryable) await attemptSubmit(form.getValues());
            else {
              if (result.kind === "saved_local" || result.kind === "pending") onCompleted?.(result.kind);
              onClose?.();
            }
          }}
        />
      </AppScreen>
    );
  }

  if (step === 1) {
    return (
      <AppScreen>
        <AppHeader eyebrow={getMessage("vi", "checkInEyebrow")} title={getMessage("vi", "checkInTitle")} subtitle={getMessage("vi", "checkInBody")} showBack={Boolean(onClose)} onBack={onClose} />
        <MoodSelector
          value={mood}
          onChange={(value) => {
            form.setValue("mood", value, { shouldValidate: true });
            setStep(2);
          }}
        />
      </AppScreen>
    );
  }

  if (step === 2) {
    return (
      <AppScreen>
        <AppHeader title={getMessage("vi", "checkInReasonsTitle")} subtitle={getMessage("vi", "checkInReasonsBody")} showBack onBack={() => setStep(1)} />
        {reasonIds.length === 3 ? <StatusBanner tone="info" title={getMessage("vi", "maxThreeReasons")} /> : null}
        <XStack flexWrap="wrap" gap="$sm">
          {reasons.map((reason) => {
            const selected = reasonIds.includes(reason.id);
            return (
              <ChoiceChip
                key={reason.id}
                label={getMessage("vi", reason.labelKey as MessageKey)}
                selected={selected}
                disabled={!selected && reasonIds.length >= 3}
                onPress={() => form.setValue("reasonIds", selected ? reasonIds.filter((id) => id !== reason.id) : [...reasonIds, reason.id], { shouldValidate: true })}
              />
            );
          })}
        </XStack>
        <Controller
          control={form.control}
          name="note"
          render={({ field, fieldState }) => (
            <AppField multiline label={getMessage("vi", "checkInNoteLabel")} placeholder={getMessage("vi", "checkInNotePlaceholder")} value={field.value} maxLength={140} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} characterCount={`${field.value.length}/140`} />
          )}
        />
        <AppButton onPress={() => setStep(3)}>{getMessage("vi", "continue")}</AppButton>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader title={getMessage("vi", "chooseSharingTitle")} subtitle={getMessage("vi", "chooseSharingBody")} showBack onBack={() => setStep(2)} />
      <ShareScopePicker value={scope} onChange={(value) => form.setValue("shareScope", value, { shouldValidate: true })} />
      <YStack borderRadius="$lg" backgroundColor="$supportLavenderLight" padding="$md" gap="$xs">
        <XStack alignItems="center" gap="$sm"><CheckCircle2 size={18} color="$textPrimary" /><Text fontWeight="$semibold">{getMessage("vi", scope === "full" ? "shareFull" : scope === "mood_only" ? "shareMoodOnly" : "sharePrivate")}</Text></XStack>
        {scope === "full" && note ? <Text fontSize="$bodyS" color="$textSecondary" numberOfLines={2}>{note}</Text> : null}
        {scope === "mood_only" ? <Text fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "moodOnlyPreviewBody")}</Text> : null}
        {scope === "private_only" ? <Text fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "privateCheckInPreviewBody")}</Text> : null}
      </YStack>
      <AppButton disabled={submitting} onPress={() => void submit()}>{getMessage("vi", "submitCheckIn")}</AppButton>
      <AppButton variant="ghost" icon={<ArrowLeft size={18} />} onPress={() => setStep(2)}>{getMessage("vi", "back")}</AppButton>
    </AppScreen>
  );
}
