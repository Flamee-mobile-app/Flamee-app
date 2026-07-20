import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { flameeTheme } from '@/constants/flameeTheme';
import type { CreateMemoryStep } from '@/features/memories/types';

const STEPS: readonly CreateMemoryStep[] = [1, 2, 3];

export type MemoryStepIndicatorProps = {
  currentStep: CreateMemoryStep;
};

export function MemoryStepIndicator({
  currentStep,
}: MemoryStepIndicatorProps) {
  return (
    <View
      accessible
      accessibilityLabel={`Bước ${currentStep} trên 3`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 1,
        max: 3,
        now: currentStep,
        text: `Bước ${currentStep} trên 3`,
      }}
      style={styles.container}>
      <View style={styles.segments}>
        {STEPS.map((step) => (
          <View
            key={step}
            style={[styles.segment, step <= currentStep && styles.activeSegment]}
            testID={`memory-step-${step}`}
          />
        ))}
      </View>
      <AppText
        align="center"
        color={flameeTheme.colors.text.secondary}
        variant="caption">
        Bước {currentStep}/3
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  activeSegment: {
    backgroundColor: flameeTheme.colors.brand,
  },
  container: {
    gap: flameeTheme.spacing[2],
  },
  segment: {
    backgroundColor: flameeTheme.colors.softCream,
    borderRadius: flameeTheme.radii.full,
    flex: 1,
    height: 5,
  },
  segments: {
    flexDirection: 'row',
    gap: flameeTheme.spacing[2],
  },
});
