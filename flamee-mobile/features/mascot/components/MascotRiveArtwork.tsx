import { StyleSheet, View } from 'react-native';

import { useMascotRiveController } from '../hooks/useMascotRiveController';
import type { MascotMood } from '../types';

import { MascotArtwork } from './MascotArtwork';

type MascotRiveArtworkProps = {
  mood: MascotMood;
  size?: number;
  useRive?: boolean;
};

export function MascotRiveArtwork({
  mood,
  size = 64,
  useRive = false,
}: MascotRiveArtworkProps) {
  const { inputStateValue } = useMascotRiveController(mood);

  // If useRive is false (or in fallback mode), render official Figma sticker artwork
  if (!useRive) {
    return <MascotArtwork mood={mood} size={size} />;
  }

  return (
    <View style={[styles.container, { width: size, height: size }]} testID="flamee-mascot-rive-artwork">
      <MascotArtwork mood={mood} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
