import type { ImageSourcePropType } from 'react-native';

/** Static artwork owned by the Flamee application shell. */
export const brandAssets = {
  background: require('../../assets/images/brand/app-background.webp'),
  logo: require('../../assets/images/brand/flamee-logo.webp'),
} as const satisfies Record<string, ImageSourcePropType>;
