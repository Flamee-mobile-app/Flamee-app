import { ArrowLeft } from "@tamagui/lucide-icons-2/icons/ArrowLeft";
import { X } from "@tamagui/lucide-icons-2/icons/X";
import { useCallback, useRef, useState } from "react";
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

function CheckInFlow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [draft, setDraft] = useState(createCheckInDraft);
  const [position, setPosition] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [sliderDragging, setSliderDragging] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const step = checkInSteps[position];
  const canContinue = canContinueCheckIn(step, draft);
  const noteStep = step === "note";
  const hasNote = draft.note.trim().length > 0;
  const leave = useCallback(() => { Keyboard.dismiss(); if (router.canGoBack()) router.back(); else router.replace("/(main)/moments"); }, [router]);
  const requestExit = useCallback(() => {
    Keyboard.dismiss();
    if (hasCheckInAnswers(draftRef.current)) setConfirmExit(true);
    else leave();
  }, [leave]);
  const back = useCallback(() => {
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
  const previewShare = () => {
    if (hasNote) appToast.info(getMessage("vi", "moodFlowNoteMockPreview"));
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
        {noteStep ? <AppTextButton tone={hasNote ? "accent" : "neutral"} disabled={!hasNote} accessibilityLabel={getMessage("vi", "moodFlowNoteShare")} onPress={previewShare}>
          {getMessage("vi", "moodFlowNoteShare")}
        </AppTextButton> : <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "moodFlowClose")} icon={<X size={22} color="$textPrimary" />} onPress={requestExit} />}
      </XStack>
    </XStack>
  </YStack>;

  const screen = <AppScreen scroll={false} padded={false} allowOverflow={noteStep} safeAreaEdges={["top", "left", "right"]} contentProps={{ flex: 1, gap: 0 }}>
      <YStack flex={1} minHeight={0} width="100%" maxWidth={noteStep ? undefined : moodFlowTokens.maxWidth} alignSelf="center">
        {header}
        {!noteStep ? <XStack marginHorizontal={spacing.page} marginTop="$sm" marginBottom="$sm" alignItems="center" gap="$sm">
          <YStack flex={1} height={moodFlowTokens.progressHeight} borderRadius="$sm" backgroundColor="$border" overflow="hidden"
            accessibilityRole="progressbar" accessibilityLabel={formatMessage("vi", "stepProgress", { step: position + 1, total: checkInSteps.length })}
            accessibilityValue={{ min: 1, max: checkInSteps.length, now: position + 1 }}>
            <YStack height="100%" width={`${(position + 1) / checkInSteps.length * 100}%`} borderRadius="$sm" backgroundColor="$primary" />
          </YStack>
          <Text minWidth={38} textAlign="right" fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" fontWeight="$semibold" color="$textSecondary">{position + 1}/{checkInSteps.length}</Text>
        </XStack> : null}
        {noteStep ? <CheckInNoteComposer draft={draft} onChange={setDraft} /> : <>
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
