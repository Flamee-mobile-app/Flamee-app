import { useEffect, useRef, useState } from "react";
import Animated, { ZoomIn, useReducedMotion } from "react-native-reanimated";
import { Slider, Text, XStack, YStack } from "tamagui";
import { sliderTokens, spacing } from "../constants/tokens";
import { getAppSliderCommittedValue, getAppSliderContinuousStep, getAppSliderThumbPresentation, getAppSliderTrackInset, getAppSliderVisualValue, shouldCommitAppSliderValue } from "./appSliderModel";

export type AppSliderProps = {
  label: string;
  value: number | null;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  requirementLabel?: string;
  smooth?: boolean;
  showTicks?: boolean;
  getValueLabel: (value: number | null) => string;
  getThumbLabel?: (value: number | null) => string;
  onValueChange: (value: number) => void;
  onInteractionChange?: (active: boolean) => void;
};

export function AppSlider({ label, value, min, max, step, minLabel, maxLabel, requirementLabel, smooth = false, showTicks = true, getValueLabel, getThumbLabel, onValueChange, onInteractionChange }: AppSliderProps) {
  const [sliderValue, setSliderValue] = useState(value);
  const dragging = useRef(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => setSliderValue(value), [value]);
  const valueLabel = getValueLabel(sliderValue);
  const thumbLabel = sliderValue === null ? "" : getThumbLabel?.(sliderValue) ?? "";
  const sliderStep = smooth ? getAppSliderContinuousStep(min, max) : step;
  const trackInset = getAppSliderTrackInset(sliderTokens.thumbSize);
  const thumbPresentation = getAppSliderThumbPresentation(sliderValue !== null);
  const ticks = showTicks ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, index) => min + index * step) : [];

  return <YStack alignSelf="stretch" marginHorizontal={Math.max(0, sliderTokens.edgeInset - spacing.page)}>
    <XStack alignItems="center" justifyContent="space-between" gap="$sm">
      <XStack flex={1} alignItems="center" gap="$sm">
        <Text fontFamily="$body" fontSize="$label" lineHeight="$label" color="$textPrimary">{label}</Text>
        {requirementLabel ? <Text fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" color="$textSecondary">{requirementLabel}</Text> : null}
      </XStack>
      <Text flexShrink={0} fontFamily="$body" fontSize="$label" lineHeight="$label" fontWeight="$semibold" color={sliderValue === null ? "$textSecondary" : "$accentText"} aria-live="polite">{valueLabel}</Text>
    </XStack>
    <Slider
      marginTop="$md"
      width="100%"
      height={sliderTokens.targetHeight}
      position="relative"
      alignItems="center"
      justifyContent="center"
      min={min}
      max={max}
      step={sliderStep}
      value={[getAppSliderVisualValue(sliderValue, min)]}
      onValueChange={(values) => {
        const next = values[0];
        if (next === undefined) return;
        if (shouldCommitAppSliderValue(dragging.current)) {
          const committed = getAppSliderCommittedValue(next, min, step);
          setSliderValue(committed);
          onValueChange(committed);
        } else setSliderValue(next);
      }}
      onSlideEnd={(_, next) => {
        const rounded = getAppSliderCommittedValue(next, min, step);
        dragging.current = false;
        setSliderValue(rounded);
        onValueChange(rounded);
        onInteractionChange?.(false);
      }}
      onResponderGrant={() => { dragging.current = true; onInteractionChange?.(true); }}
    >
      <Slider.Track position="absolute" top="50%" left={trackInset} right={trackInset} width="auto" height={sliderTokens.trackHeight}
        transform={[{ translateY: -sliderTokens.trackHeight / 2 }]} borderRadius={sliderTokens.trackHeight / 2} backgroundColor="$border">
        <Slider.TrackActive backgroundColor="$primary" />
      </Slider.Track>
      {showTicks ? <XStack position="absolute" left={trackInset} right={trackInset} top="50%" height={sliderTokens.trackHeight} justifyContent="space-between" alignItems="center" transform={[{ translateY: -sliderTokens.trackHeight / 2 }]} pointerEvents="none" aria-hidden={true}>
        {ticks.map((tick) => <YStack key={tick} width={2} height={10} borderRadius={1} backgroundColor={sliderValue !== null && tick <= sliderValue ? "$white" : "$textSecondary"} />)}
      </XStack> : null}
      <Slider.Thumb index={0} size={sliderTokens.thumbSize} circular backgroundColor={thumbPresentation.backgroundColor} borderWidth={sliderTokens.thumbBorderWidth} borderColor={thumbPresentation.borderColor}
        alignItems="center" justifyContent="center" aria-label={label} aria-valuetext={valueLabel}>
        {thumbLabel ? <Animated.Text key={thumbLabel} entering={reducedMotion ? undefined : ZoomIn.springify().damping(18).stiffness(220)} style={{ color: thumbPresentation.valueColor, fontFamily: "System", fontSize: 14, fontWeight: "700", lineHeight: 16, textAlign: "center" }}>{thumbLabel}</Animated.Text> : null}
      </Slider.Thumb>
    </Slider>
    <XStack marginTop="$sm" justifyContent="space-between" aria-hidden={true}>
      <Text fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" color="$textSecondary">{minLabel}</Text>
      <Text fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" color="$textSecondary">{maxLabel}</Text>
    </XStack>
  </YStack>;
}
