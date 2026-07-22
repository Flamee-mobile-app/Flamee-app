import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { AppImage } from '@/shared/components/media';

import type { MascotMood } from '../types';

export const MASCOT_STICKERS: Record<MascotMood, ImageSourcePropType> = {
  surprised: require('../../../assets/images/mascot/emotion_04_bat_ngo.png'),
  very_sad: require('../../../assets/images/mascot/emotion_05_khoc_huhu.png'),
  angry: require('../../../assets/images/mascot/emotion_06_tuc_gian.png'),
  sad: require('../../../assets/images/mascot/emotion_07_buon.png'),
  great: require('../../../assets/images/mascot/emotion_08_om_mieng_coi.png'),
  happy: require('../../../assets/images/mascot/emotion_09_hanh_phuc.png'),
  very_happy: require('../../../assets/images/mascot/emotion_10_vui_qua_di_thoi.png'),
  neutral: require('../../../assets/images/mascot/emotion_11_tinh_tam.png'),
  tired: require('../../../assets/images/mascot/emotion_12_buon_ngu_ee.png'),
  calm: require('../../../assets/images/mascot/emotion_13_met_moi.png'),
  default: require('../../../assets/images/mascot/mascot_default.png'),
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
