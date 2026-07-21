import { StyleSheet, View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { flameeTheme } from '@/shared/constants/flameeTheme';

export type TimelineActionBarProps = {
  backLabel?: string;
  primaryLabel: string;
  onBack: () => void;
  onPrimary: () => void;
  primaryDisabled?: boolean;
};

export function TimelineActionBar({
  backLabel = 'Quay lại',
  primaryLabel,
  onBack,
  onPrimary,
  primaryDisabled = false,
}: TimelineActionBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.action}>
        <Button onPress={onBack} title={backLabel} variant="secondary" />
      </View>
      <View style={styles.action}>
        <Button
          disabled={primaryDisabled}
          onPress={onPrimary}
          title={primaryLabel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    gap: flameeTheme.spacing[3],
  },
});
