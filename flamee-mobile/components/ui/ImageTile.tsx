import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

import { AppText } from './AppText';

export type ImageTileProps = {
  label?: string;
  height?: number;
  width?: DimensionValue;
  color?: string;
  style?: ViewStyle;
};

export function ImageTile({
  label,
  height = 120,
  width = '100%',
  color = flameeTheme.colors.softCream,
  style,
}: ImageTileProps) {
  return (
    <View style={[styles.tile, { backgroundColor: color, height, width }, style]}>
      {label ? (
        <AppText variant="caption" color={flameeTheme.colors.brand} align="center">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    borderRadius: flameeTheme.radii.xl,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
