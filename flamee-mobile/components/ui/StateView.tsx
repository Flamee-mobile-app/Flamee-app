import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

import { AppText } from './AppText';
import { Button } from './Button';

export type StateViewProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  loading?: boolean;
  onAction?: () => void;
};

export function StateView({ title, description, actionLabel, loading = false, onAction }: StateViewProps) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={flameeTheme.colors.brand} /> : null}
      <AppText variant="sectionTitle" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary} align="center">
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: flameeTheme.spacing[3],
    justifyContent: 'center',
    minHeight: 180,
    padding: flameeTheme.spacing[6],
  },
});
