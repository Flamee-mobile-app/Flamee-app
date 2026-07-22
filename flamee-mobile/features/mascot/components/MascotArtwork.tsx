import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { AppImage } from '@/shared/components/media';

import type { MascotMood } from '../types';

export const MASCOT_STICKERS: Record<MascotMood, ImageSourcePropType> = {
  neutral: require('../../../assets/images/mascot/emotion_11_binh_thuong.png'),
  happy: require('../../../assets/images/mascot/emotion_04_hanh_phuc.png'),
  calm: require('../../../assets/images/mascot/emotion_06_binh_yen.png'),
  sad: require('../../../assets/images/mascot/emotion_09_buon.png'),
  tired: require('../../../assets/images/mascot/emotion_13_met_moi.png'),
  angry: require('../../../assets/images/mascot/emotion_12_gian_du.png'),
  surprised: require('../../../assets/images/mascot/emotion_07_bat_ngo.png'),
};

export const MASCOT_DEFAULT_STICKER = require('../../../assets/images/mascot/mascot_default.png');

type MascotArtworkProps = {
  mood: MascotMood;
  size?: number;
};

export function MascotArtwork({ mood, size = 64 }: MascotArtworkProps) {
  const stickerSource = MASCOT_STICKERS[mood] || MASCOT_DEFAULT_STICKER;

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      testID="flamee-mascot-artwork">
      <AppImage
        accessibilityLabel={`Flamee mascot sticker ${mood}`}
        contentFit="contain"
        source={stickerSource}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    height: '100%',
    width: '100%',
  },
});
