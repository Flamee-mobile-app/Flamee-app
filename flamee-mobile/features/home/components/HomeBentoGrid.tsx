import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { flameeFonts } from '@/shared/constants/flameeTheme';

import { HOME_BENTO_ITEMS } from './homeBentoItems';

export type HomeBentoGridProps = {
  onNavigate: (route: Href, mode: 'push' | 'replace') => void;
  shouldAnimate: boolean;
};

export function HomeBentoGrid({ onNavigate, shouldAnimate }: HomeBentoGridProps) {
  const { width } = useWindowDimensions();
  const entryValues = useRef(
    HOME_BENTO_ITEMS.map(() => new Animated.Value(shouldAnimate ? 0 : 1)),
  ).current;
  const smallCardWidth = (width - 48 - 12) / 2;

  useEffect(() => {
    if (!shouldAnimate) {
      entryValues.forEach((value) => value.setValue(1));
      return;
    }

    entryValues.forEach((value) => value.setValue(0));
    const animation = Animated.sequence([
      Animated.delay(380),
      Animated.stagger(
        60,
        entryValues.map((value) =>
          Animated.timing(value, { duration: 220, toValue: 1, useNativeDriver: true }),
        ),
      ),
    ]);

    animation.start();

    return () => animation.stop();
  }, [entryValues, shouldAnimate]);

  return (
    <View style={styles.container} testID="home-bento-grid">
      <Text style={styles.title}>Khám phá cùng nhau</Text>
      <View style={styles.grid}>
        {HOME_BENTO_ITEMS.map((item, index) => {
          const entryValue = entryValues[index];
          const entryStyle = {
            opacity: entryValue,
            transform: [
              {
                translateY: entryValue.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
              },
            ],
          };

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.cardShell,
                item.featured ? styles.featuredShell : { width: smallCardWidth },
                entryStyle,
              ]}>
              <Pressable
                accessibilityLabel={item.label}
                accessibilityRole="button"
                onPress={() => onNavigate(item.route, item.mode)}
                style={({ pressed }) => [
                  styles.card,
                  item.featured && styles.featuredCard,
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.iconCircle, item.featured && styles.featuredIconCircle]}>
                  <Ionicons color={item.featured ? '#FF7158' : '#FFFFFF'} name={item.icon} size={20} />
                </View>
                <View style={styles.copy}>
                  <Text numberOfLines={1} style={[styles.label, item.featured && styles.featuredLabel]}>
                    {item.label}
                  </Text>
                  <Text
                    numberOfLines={item.featured ? 2 : 3}
                    style={[styles.subtitle, item.featured && styles.featuredSubtitle]}>
                    {item.subtitle}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(35, 22, 24, 0.36)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: 12,
    minHeight: 132,
    padding: 16,
  },
  cardShell: {
    minHeight: 132,
  },
  container: {
    gap: 14,
  },
  copy: {
    gap: 4,
  },
  featuredCard: {
    backgroundColor: 'rgba(255, 241, 228, 0.94)',
    flexDirection: 'row',
    minHeight: 108,
  },
  featuredIconCircle: {
    backgroundColor: '#FFFFFF',
  },
  featuredLabel: {
    color: '#FF7158',
  },
  featuredShell: {
    width: '100%',
  },
  featuredSubtitle: {
    color: '#8E4D42',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 15,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.82,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: flameeFonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    lineHeight: 22,
  },
});
