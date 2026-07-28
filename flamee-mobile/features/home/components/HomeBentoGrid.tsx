import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { flameeFonts } from '@/shared/constants/flameeTheme';
import { MascotArtwork } from '@/features/mascot/components/MascotArtwork';
import { ROUTES } from '@/shared/lib/navigation/routes';

import { HOME_BENTO_ITEMS } from './homeBentoItems';

export type HomeBentoGridProps = {
  onNavigate: (route: Href, mode: 'push' | 'replace') => void;
  shouldAnimate: boolean;
};

export function HomeBentoGrid({ onNavigate, shouldAnimate }: HomeBentoGridProps) {
  const { width } = useWindowDimensions();
  const [pressedId, setPressedId] = useState<string | null>(null);
  const entryValues = useRef(
    Array.from(
      { length: HOME_BENTO_ITEMS.length + 1 },
      () => new Animated.Value(shouldAnimate ? 0 : 1),
    ),
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
      <Animated.View style={[styles.suggestionShell, getEntryStyle(entryValues[0])]}>
        <Pressable
          accessibilityLabel="Flamee gợi ý: Hỏi nhau một điều nhỏ nhé"
          accessibilityRole="button"
          onPress={() => onNavigate(ROUTES.ai, 'push')}
          onPressIn={() => setPressedId('suggestion')}
          onPressOut={() => setPressedId(null)}
          style={[styles.suggestionCard, pressedId === 'suggestion' && styles.pressed]}>
          <View style={styles.suggestionCopy}>
            <Text style={styles.suggestionTag}>FLAMEE GỢI Ý</Text>
            <Text numberOfLines={1} style={styles.suggestionTitle}>
              Hỏi nhau một điều nhỏ nhé
            </Text>
            <Text numberOfLines={2} style={styles.suggestionPrompt}>
              Hôm nay điều gì làm bạn mỉm cười?
            </Text>
            <View style={styles.suggestionAction}>
              <Text style={styles.suggestionActionText}>Cùng chia sẻ</Text>
              <Ionicons color="#FF7158" name="arrow-forward" size={16} />
            </View>
          </View>
          <View pointerEvents="none" style={styles.suggestionMascot}>
            <MascotArtwork mood="happy" size={68} />
          </View>
        </Pressable>
      </Animated.View>
      <View style={styles.grid}>
        {HOME_BENTO_ITEMS.map((item, index) => {
          const entryStyle = getEntryStyle(entryValues[index + 1]);
          const isPressed = pressedId === item.id;

          return (
            <Animated.View
              key={item.id}
              style={[styles.cardShell, { width: smallCardWidth }, entryStyle]}>
              <Pressable
                accessibilityLabel={item.label}
                accessibilityRole="button"
                onPress={() => onNavigate(item.route, item.mode)}
                onPressIn={() => setPressedId(item.id)}
                onPressOut={() => setPressedId(null)}
                style={[styles.card, isPressed && styles.pressed]}>
                <View style={styles.iconCircle}>
                  <Ionicons color="#FFFFFF" name={item.icon} size={20} />
                </View>
                <View style={styles.copy}>
                  <Text numberOfLines={1} style={styles.label}>
                    {item.label}
                  </Text>
                  <Text numberOfLines={3} style={styles.subtitle}>
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

function getEntryStyle(entryValue: Animated.Value) {
  return {
    opacity: entryValue,
    transform: [
      {
        translateY: entryValue.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
      },
    ],
  };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(35, 22, 24, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    minHeight: 132,
    padding: 16,
    width: '100%',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
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
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: flameeFonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  suggestionAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 'auto',
  },
  suggestionActionText: {
    color: '#FF7158',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 13,
    lineHeight: 17,
  },
  suggestionCard: {
    backgroundColor: '#FFF1E4',
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 154,
    overflow: 'hidden',
    padding: 18,
    width: '100%',
  },
  suggestionCopy: {
    flex: 1,
    gap: 5,
    paddingRight: 6,
  },
  suggestionMascot: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    marginBottom: 1,
    width: 68,
  },
  suggestionPrompt: {
    color: '#8E4D42',
    fontFamily: flameeFonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  suggestionShell: {
    minHeight: 154,
    width: '100%',
  },
  suggestionTag: {
    color: '#D8634D',
    fontFamily: flameeFonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 13,
  },
  suggestionTitle: {
    color: '#FF7158',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    lineHeight: 23,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    lineHeight: 22,
  },
});
