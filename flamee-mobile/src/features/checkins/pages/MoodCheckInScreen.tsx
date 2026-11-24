import { ArrowLeft } from "@tamagui/lucide-icons-2/icons/ArrowLeft";
import { X } from "@tamagui/lucide-icons-2/icons/X";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useFocusEffect, useRouter, Stack } from "expo-router";
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { AppButton, AppDialog, AppIconButton, AppScreen, AppTextButton, appToast } from "../../../shared/components";
import { buttonTokens, moodFlowTokens, noteComposerLayoutTokens, spacing } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { canContinueCheckIn, checkInSteps, createCheckInDraft, hasCheckInAnswers } from "../checkInFlowModel";
import { CheckInNoteComposer } from "../components/CheckInNoteComposer";
import { CheckInReflectionForm } from "../components/CheckInReflectionForm";
import { CheckInFeelingPicker, CheckInStepContent } from "../components/CheckInStepContent";
import { moodService, reminderKey } from "../moodService";
import { MoodApiError, type CreateMoodInput } from "../moodApi";

function CheckInFlow() {
  const router = useRouter();
  const client = useQueryClient();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [draft, setDraft] = useState(createCheckInDraft);
  const [position, setPosition] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [sliderDragging, setSliderDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const request = useRef<{ payload: string; key: string } | null>(null);
  const scroll = useRef<ScrollView>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const step = checkInSteps[position];
  const canContinue = canContinueCheckIn(step, draft);
  const noteStep = step === "note";
  const hasNote = draft.note.trim().length > 0;
  const leave = useCallback(() => { Keyboard.dismiss(); if (router.canGoBack()) router.back(); else router.replace("/(main)/moments"); }, [router]);
  const requestExit = useCallback(() => {
    if (savingRef.current) return;
    Keyboard.dismiss();
    if (hasCheckInAnswers(draftRef.current)) setConfirmExit(true);
    else leave();
  }, [leave]);
  const back = useCallback(() => {
    if (savingRef.current) return;
    if (position > 0) {
      Keyboard.dismiss();
      setPosition(position - 1);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } else requestExit();
  }, [position, requestExit]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => { back(); return true; });
    return () => subscription.remove();
  }, [back]));
  const next = () => {
    if (!canContinue || noteStep) return;
    Keyboard.dismiss();
    setPosition(position + 1);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const previewShare = async () => {
    if (savingRef.current || !canContinueCheckIn("note", draft) || !draft.intensity || !draft.moodScore) return;
    const state = useSessionStore.getState();
    if (!state.activeAccountId) return;
    const { activeAccountId, activeCoupleId, sessionId, membershipRevision } = state;
    const current = () => { const next = useSessionStore.getState(); return next.activeAccountId === activeAccountId && next.activeCoupleId === activeCoupleId && next.sessionId === sessionId && next.membershipRevision === membershipRevision; };
    const body: CreateMoodInput = { draft_version: 2, mood: draft.emotionId, intensity: draft.intensity, mood_score: draft.moodScore, note: draft.note.trim(), reasons: draft.reasonIds, custom_emotion_label: draft.emotionId === "custom" ? draft.customEmotionLabel.trim() : null, mascot_sticker_id: draft.mascotStickerId || null, sleep_hours: draft.sleepHours, attachments: draft.attachments, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", share_level: "all", is_private: false };
    const payload = JSON.stringify(body);
    if (!request.current || request.current.payload !== payload) request.current = { payload, key: randomUUID() };
    savingRef.current = true; setSaving(true);
    const feedback = appToast.operation(); feedback.loading(getMessage("vi", "moodCheckSaving"));
    try {
      await moodService.create(body, request.current.key);
      if (!current()) return;
      void client.invalidateQueries({ queryKey: ["mood-history", sessionId, activeAccountId] });
      void client.invalidateQueries({ queryKey: ["partner-mood", sessionId, activeAccountId, activeCoupleId] });
      void client.invalidateQueries({ queryKey: ["dual-nudge", sessionId, activeAccountId, activeCoupleId, membershipRevision] });
      void moodService.ensureReminder({ accountId: activeAccountId, sessionId }, body.timezone).then(() => {
        if (current()) void client.invalidateQueries({ queryKey: reminderKey({ accountId: activeAccountId, sessionId }) });
      }).catch(() => undefined);
      feedback.success(getMessage("vi", "moodCheckSaved"));
      request.current = null; leave();
    } catch (error) { if (current()) feedback.error(getMessage("vi", error instanceof MoodApiError && error.code === "unavailable" ? "moodCheckUnavailable" : "moodCheckFailed")); }
    finally { feedback.dismiss(); savingRef.current = false; setSaving(false); }
  };
  const disabledHint = step === "reasons" ? "moodFlowContinueHint"
    : step === "intensity" ? "moodFlowIntensityRequiredHint" : null;
  const header = <YStack height={noteComposerLayoutTokens.headerHeight} paddingHorizontal={noteComposerLayoutTokens.headerHorizontalInset}>
    <XStack flex={1} alignItems="center">
      <XStack flex={1} justifyContent="flex-start">
        <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "back")} icon={<ArrowLeft size={22} color="$textPrimary" />} onPress={back} />
      </XStack>
      {noteStep ? <Text flexShrink={1} maxWidth="62%" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary" textAlign="center" numberOfLines={1}>
        {getMessage("vi", "moodFlowNoteHeaderTitle")}
      </Text> : <YStack flex={1} />}
      <XStack flex={1} justifyContent="flex-end">
        {noteStep ? <AppTextButton tone={hasNote ? "accent" : "neutral"} disabled={!hasNote || saving} accessibilityLabel={getMessage("vi", "moodFlowNoteShare")} onPress={() => { void previewShare(); }}>
          {getMessage("vi", "moodFlowNoteShare")}
        </AppTextButton> : <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "moodFlowClose")} icon={<X size={22} color="$textPrimary" />} onPress={requestExit} />}
      </XStack>
    </XStack>
  </YStack>;

  const screen = <AppScreen scroll={false} padded={false} allowOverflow={noteStep} safeAreaEdges={["top", "left", "right"]} contentProps={{ flex: 1, gap: 0 }}>
      <YStack flex={1} minHeight={0} width="100%" maxWidth={noteStep ? undefined : moodFlowTokens.maxWidth} alignSelf="center">
        {header}
        <XStack height={moodFlowTokens.progressHeight} marginHorizontal={spacing.page} marginTop="$sm" marginBottom="$sm" alignItems="flex-start"
          accessible accessibilityRole="progressbar" accessibilityLabel={formatMessage("vi", "stepProgress", { step: position + 1, total: checkInSteps.length })}
          accessibilityValue={{ min: 1, max: checkInSteps.length, now: position + 1 }}>
          {checkInSteps.map((item, index) => <YStack key={item} flex={1} minWidth={0} alignItems="center" aria-hidden>
            <YStack width="100%" height={moodFlowTokens.progressRingSize} alignItems="center" justifyContent="center">
              {index > 0 ? <YStack position="absolute" left={0} right="50%" height={2} backgroundColor={index <= position ? "$primary" : "$border"} /> : null}
              {index < checkInSteps.length - 1 ? <YStack position="absolute" left="50%" right={0} height={2} backgroundColor={index < position ? "$primary" : "$border"} /> : null}
              <YStack width={moodFlowTokens.progressRingSize} height={moodFlowTokens.progressRingSize} borderRadius={moodFlowTokens.progressRingSize / 2}
                borderWidth={index === position ? 2 : 0} borderColor={index === position ? "$accentSoft" : "transparent"} alignItems="center" justifyContent="center">
                <YStack width={moodFlowTokens.progressNodeSize} height={moodFlowTokens.progressNodeSize} borderRadius={moodFlowTokens.progressNodeSize / 2}
                  backgroundColor={index <= position ? "$primary" : "$border"} alignItems="center" justifyContent="center">
                  {index < position ? <Check size={19} strokeWidth={3} color="$white" aria-hidden /> : <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$bold" color={index === position ? "$white" : "$textSecondary"}>{index + 1}</Text>}
                </YStack>
              </YStack>
            </YStack>
            <Text marginTop="$xs" fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" fontWeight={index === position ? "$bold" : "$medium"} color={index === position ? "$primary" : "$textSecondary"} numberOfLines={1} textAlign="center">{getMessage("vi", ["moodStepFeeling", "moodStepReasons", "moodStepToday", "moodStepNote"][index] as "moodStepFeeling" | "moodStepReasons" | "moodStepToday" | "moodStepNote")}</Text>
          </YStack>)}
        </XStack>
        {noteStep ? <CheckInNoteComposer draft={draft} onChange={(nextDraft) => { if (!savingRef.current) setDraft(nextDraft); }} disabled={saving} /> : <>
          <ScrollView ref={scroll} flex={1} width="100%" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag"
            contentContainerStyle={{ flexGrow: 1, alignItems: "stretch", paddingHorizontal: spacing.page, paddingTop: spacing.md, paddingBottom: spacing.md }}>
            <YStack flexGrow={1} width="100%" alignSelf="stretch" justifyContent="center" paddingVertical="$sm">
              <Animated.View key={step} entering={reducedMotion ? undefined : FadeIn.duration(moodFlowTokens.contentFadeDuration)}>
                {step === "feeling" ? <CheckInStepContent draft={draft} onChange={setDraft} />
                  : <CheckInReflectionForm step={step} draft={draft} onChange={setDraft} onSliderInteractionChange={setSliderDragging} />}
              </Animated.View>
            </YStack>
          </ScrollView>
          <YStack paddingHorizontal={spacing.page} paddingTop="$sm" paddingBottom={Math.max(insets.bottom, spacing.md)} gap={moodFlowTokens.footerGap}>
            {step === "feeling" ? <CheckInFeelingPicker draft={draft} onChange={setDraft} /> : null}
            <AppButton fill disabled={!canContinue} disabledTone="muted" accessibilityHint={disabledHint ? getMessage("vi", disabledHint) : undefined} onPress={next}>
              {getMessage("vi", "moodFlowContinue")}
            </AppButton>
            {!canContinue && disabledHint ? <Text aria-live="polite" fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" color="$textSecondary" textAlign="center">{getMessage("vi", disabledHint)}</Text> : null}
          </YStack>
        </>}
      </YStack>
      <AppDialog surfaceTone="solid" open={confirmExit} onOpenChange={setConfirmExit} title={getMessage("vi", "moodFlowExitTitle")} description={getMessage("vi", "moodFlowExitBody")}>
        <AppButton fill onPress={() => setConfirmExit(false)}>{getMessage("vi", "moodFlowStay")}</AppButton>
        <AppButton fill variant="ghost" onPress={leave}>{getMessage("vi", "moodFlowDiscard")}</AppButton>
      </AppDialog>
    </AppScreen>;

  return <>
    <Stack.Screen options={{ gestureEnabled: !sliderDragging }} />
    {noteStep ? <KeyboardAvoidingView style={{ flex: 1, minHeight: 0 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      {screen}
    </KeyboardAvoidingView> : screen}
  </>;
}

export function MoodCheckInScreen() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  return <CheckInFlow key={`${sessionId}:${accountId}:${coupleId}`} />;
}
