import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

import { AppText, IconButton } from '@/components/ui';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? <IconButton name="chevron-back" onPress={onBack} accessibilityLabel="Quay lại" /> : null}
      </View>
      <View style={styles.copy}>
        <AppText variant="heading" align="center">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary} align="center">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  side: {
    alignItems: 'center',
    minWidth: 44,
  },
  copy: {
    flex: 1,
  },
});
