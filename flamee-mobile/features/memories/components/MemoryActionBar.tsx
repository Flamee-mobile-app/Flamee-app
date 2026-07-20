import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { flameeTheme } from '@/constants/flameeTheme';

export type MemoryActionBarProps = {
  backLabel?: string;
  primaryLabel: string;
  onBack: () => void;
  onPrimary: () => void;
  primaryDisabled?: boolean;
};

export function MemoryActionBar({
  backLabel = 'Quay lại',
  primaryLabel,
  onBack,
  onPrimary,
  primaryDisabled = false,
}: MemoryActionBarProps) {
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
