import { StyleSheet, View } from 'react-native';

import { flameeTheme } from '@/shared/constants/flameeTheme';

import { AppText } from './AppText';

export type StatCardProps = {
  value: string;
  label: string;
};

export function StatCard({ value, label }: StatCardProps) {
  return (
    <View style={styles.card}>
      <AppText variant="title" align="center">
        {value}
      </AppText>
      <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary} align="center">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: flameeTheme.colors.background,
    borderRadius: flameeTheme.radii.xl,
    flex: 1,
    height: 80,
    justifyContent: 'center',
  },
});
