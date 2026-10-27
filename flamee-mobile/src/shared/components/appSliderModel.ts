import { colors } from "../constants/tokens.ts";

export function getAppSliderVisualValue(value: number | null, minimum: number): number {
  return value ?? minimum;
}

export function getAppSliderTrackInset(thumbSize: number): number {
  return thumbSize / 2;
}

export function getAppSliderContinuousStep(min: number, max: number): number {
  return (max - min) / 120;
}

export function getAppSliderCommittedValue(value: number, min: number, step: number): number {
  return Math.round((value - min) / step) * step + min;
}

export function getAppSliderThumbPresentation(selected: boolean) {
  return selected
    ? { backgroundColor: "$primary", borderColor: "$primary", valueColor: colors.white } as const
    : { backgroundColor: "$border", borderColor: "$textSecondary", valueColor: colors.textSecondary } as const;
}

export function shouldCommitAppSliderValue(isDragging: boolean): boolean {
  return !isDragging;
}
