import type { PropsWithChildren } from 'react';
import { ScrollView, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { flameeTheme } from '@/shared/constants/flameeTheme';

export type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  backgroundColor?: string;
  contentContainerStyle?: ViewStyle;
}>;

export function AppScreen({
  children,
  scroll = false,
  padded = true,
  backgroundColor = flameeTheme.colors.background,
  contentContainerStyle,
}: AppScreenProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = padded ? flameeTheme.spacing[6] : 0;
  const paddingStyle = padded ? { paddingHorizontal: horizontalPadding } : undefined;
  const scrollContentWidth = Math.max(width - horizontalPadding * 2, 0);

  return (
    <SafeAreaView style={{ backgroundColor, flex: 1 }}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={[
            { alignItems: 'center', paddingBottom: flameeTheme.spacing[8] },
          ]}>
          <View style={[{ width: scrollContentWidth }, contentContainerStyle]}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, paddingStyle, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
