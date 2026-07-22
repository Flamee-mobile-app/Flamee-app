import { Animated, StyleSheet, Text, type ViewStyle, View } from 'react-native';

import { flameeFonts } from '@/shared/constants/flameeTheme';

import type { HomeWelcomeContent } from '../lib/homeWelcomeContent';

type AnimatedViewStyle = Animated.AnimatedProps<ViewStyle>;

type HomeWelcomeHeaderProps = {
  content: HomeWelcomeContent;
  greetingStyle: AnimatedViewStyle;
  quoteStyle: AnimatedViewStyle;
};

export function HomeWelcomeHeader({
  content,
  greetingStyle,
  quoteStyle,
}: HomeWelcomeHeaderProps) {
  return (
    <View style={styles.container} testID="home-welcome-header">
      <Animated.View style={greetingStyle}>
        <Text style={styles.eyebrow}>FLAMEE HÔM NAY</Text>
        <Text style={styles.greeting}>{content.greeting}</Text>
      </Animated.View>
      <Animated.View style={quoteStyle}>
        <Text style={styles.quote}>{content.quote}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingTop: 20,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
  },
  greeting: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 36,
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  quote: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: flameeFonts.medium,
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 23,
    maxWidth: 310,
  },
});
