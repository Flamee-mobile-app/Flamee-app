import { Image } from 'expo-image';
import {
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { TIMELINE_LAYOUT } from '@/features/timeline/timelineLayout';

export type TimelineTypeCardProps = {
  label: string;
  description: string;
  asset: ImageSourcePropType;
  selected: boolean;
  width: number;
  onPress: () => void;
};

export function TimelineTypeCard({
  label,
  description,
  asset,
  selected,
  width,
  onPress,
}: TimelineTypeCardProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, { width }, selected && styles.selectedCard]}>
      <View style={[styles.artwork, selected && styles.selectedArtwork]}>
        <Image contentFit="contain" source={asset} style={styles.image} />
      </View>
      <View style={styles.copy}>
        <AppText
          color={
            selected
              ? flameeTheme.colors.brand
              : flameeTheme.colors.text.primary
          }
          style={styles.title}
          variant="body">
          {label}
        </AppText>
        <AppText
          color={flameeTheme.colors.text.secondary}
          numberOfLines={2}
          variant="caption">
          {description}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artwork: {
    alignItems: 'center',
    backgroundColor: flameeTheme.colors.brandLight,
    borderRadius: flameeTheme.radii.lg,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: flameeTheme.colors.softCream,
    borderRadius: flameeTheme.radii.xl,
    borderWidth: 1.5,
    gap: flameeTheme.spacing[3],
    minHeight: TIMELINE_LAYOUT.actionMinHeight,
    padding: flameeTheme.spacing[4],
  },
  copy: {
    alignItems: 'center',
    gap: flameeTheme.spacing[1],
  },
  image: {
    height: 48,
    width: 48,
  },
  selectedArtwork: {
    backgroundColor: '#FFF8F0',
  },
  selectedCard: {
    borderColor: flameeTheme.colors.brand,
    shadowColor: flameeTheme.colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
