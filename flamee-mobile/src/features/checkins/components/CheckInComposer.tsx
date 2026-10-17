import { zodResolver } from "@hookform/resolvers/zod";
import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, YStack } from "tamagui";
import { AppButton, AppField, AsyncStateView, FeatureScreen, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { localCoupleService } from "../../couple";
import { getNudgeRouteIdForAccount, localNudgeService } from "../../nudges";
import { localNotificationAdapter } from "../../notifications";
import { localCheckInService, type CheckInSubmissionResult } from "../localCheckInService";
import { emotionCheckInSchema, type EmotionCheckInInput } from "../schemas";
import { EmotionSelector } from "./EmotionSelector";
import { MascotStickerPicker } from "./MascotStickerPicker";

type CheckInResult = "saved_local" | "pending" | "error";

type CheckInComposerProps = {
  onClose?: () => void;
  onCompleted?: (result: CheckInResult, nudgeId?: string) => void;
};

export function CheckInComposer({ onClose, onCompleted }: CheckInComposerProps) {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [result, setResult] = useState<CheckInSubmissionResult | null>(null);
  const [createdNudgeId, setCreatedNudgeId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [paired, setPaired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nudgeFailed, setNudgeFailed] = useState(false);
  const form = useForm<EmotionCheckInInput>({
    resolver: zodResolver(emotionCheckInSchema),
    defaultValues: { emotionId: "", customEmotionLabel: null, note: "", mascotStickerId: null },
  });
  const emotionId = form.watch("emotionId");
  const customEmotionLabel = form.watch("customEmotionLabel") ?? "";
  const note = form.watch("note");
  const mascotStickerId = form.watch("mascotStickerId");

  const load = async () => {
    if (!accountId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    try {
      const membership = await localCoupleService.getMembership(accountId);
      setPaired(membership.status === "paired");
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [accountId]);

  const attemptSubmit = async (value: EmotionCheckInInput) => {
    if (!accountId || submitting) return;
    setSubmitting(true);
    setResult(null);
    setCreatedNudgeId(undefined);
    setNudgeFailed(false);
    try {
      const next = await localCheckInService.submit(accountId, value);
      if (next.kind === "saved_local" || next.kind === "pending") {
        await localNotificationAdapter.markFirstCheckInCompleted(accountId);
        if (next.checkIn.coupleId) {
          try {
            const membership = await localCoupleService.getMembership(accountId);
            if (membership.status === "paired" && membership.coupleId && membership.partner) {
              const nudgeResult = await localNudgeService.createForSharedCheckIn({
                sourceCheckIn: next.checkIn,
                recipientId: membership.partner.id,
                recipientTimezone: membership.partner.timezone,
                coupleId: membership.coupleId,
              });
              if (nudgeResult.kind === "created") setCreatedNudgeId(getNudgeRouteIdForAccount(nudgeResult.nudge, accountId));
              else if (nudgeResult.kind === "support_content_unavailable") router.push("/nudge/support-unavailable");
              else if (nudgeResult.kind === "template_unavailable") setNudgeFailed(true);
            }
          } catch {
            setNudgeFailed(true);
          }
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

  const screenTitle = getMessage("vi", "emotionComposerTitle");
  if (!accountId) return <FeatureScreen title={screenTitle} showBack={Boolean(onClose)} onBack={onClose}><AsyncStateView variant="error" title="localCheckInUnavailableTitle" description="localCheckInUnavailableBody" actionLabel="retry" onAction={onClose} /></FeatureScreen>;
  if (loading) return <FeatureScreen title={screenTitle} showBack={Boolean(onClose)} onBack={onClose}><AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /></FeatureScreen>;
  if (loadFailed) return <FeatureScreen title={screenTitle} showBack={Boolean(onClose)} onBack={onClose}><AsyncStateView variant="error" title="localCheckInUnavailableTitle" description="localCheckInUnavailableBody" actionLabel="retry" onAction={() => void load()} /></FeatureScreen>;

  if (result) {
    const copy = result.kind === "pending"
      ? { variant: "pending" as const, title: "checkInPendingLocalTitle" as const, body: "checkInPendingLocalBody" as const }
      : result.kind === "error"
        ? { variant: "error" as const, title: "checkInSaveErrorTitle" as const, body: "checkInSaveErrorBody" as const }
        : { variant: "success" as const, title: "checkInSavedLocalTitle" as const, body: "checkInSavedLocalBody" as const };
    return (
      <FeatureScreen title={screenTitle} showBack={Boolean(onClose)} onBack={onClose}>
        {nudgeFailed ? <StatusBanner tone="warning" title={getMessage("vi", "nudgeCreationUnavailableTitle")} description={getMessage("vi", "nudgeCreationUnavailableBody")} /> : null}
        <AsyncStateView
          variant={copy.variant}
          title={copy.title}
          description={copy.body}
          actionLabel={result.kind === "error" && result.retryable ? "retry" : "backToToday"}
          onAction={async () => {
            if (result.kind === "error" && result.retryable) await attemptSubmit(form.getValues());
            else {
              if (result.kind === "saved_local" || result.kind === "pending") onCompleted?.(result.kind, createdNudgeId);
              onClose?.();
            }
          }}
        />
      </FeatureScreen>
    );
  }

  return (
    <FeatureScreen title={screenTitle} showBack={Boolean(onClose)} onBack={onClose}>
      <Controller
        control={form.control}
        name="emotionId"
        render={({ fieldState }) => (
          <EmotionSelector
            emotionId={emotionId}
            customEmotionLabel={customEmotionLabel}
            onChange={(nextEmotionId, nextCustomLabel) => {
              form.setValue("emotionId", nextEmotionId, { shouldValidate: true });
              form.setValue("customEmotionLabel", nextCustomLabel, { shouldValidate: true });
            }}
            error={fieldState.error?.message ?? form.formState.errors.customEmotionLabel?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="note"
        render={({ field, fieldState }) => (
          <AppField
            multiline
            label={getMessage("vi", "emotionNoteLabel")}
            placeholder={getMessage("vi", "emotionNotePlaceholder")}
            value={field.value}
            maxLength={100}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            characterCount={`${note.length}/100`}
          />
        )}
      />
      <MascotStickerPicker
        value={mascotStickerId}
        onChange={(value) => form.setValue("mascotStickerId", value, { shouldValidate: true })}
      />
      <YStack borderRadius="$lg" backgroundColor={paired ? "$accentSoft" : "$surfaceMuted"} padding="$md" gap="$xs">
        <Heart size={18} color={paired ? "$accentText" : "$textSecondary"} />
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">
          {getMessage("vi", paired ? "emotionShareHelper" : "emotionPersonalHelper")}
        </Text>
      </YStack>
      <AppButton disabled={submitting} onPress={() => void submit()}>
        {getMessage("vi", "emotionSend")}
      </AppButton>
    </FeatureScreen>
  );
}
