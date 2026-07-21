import type { FontSource } from 'expo-font';

/** Central font asset mapping for the Flamee application. */
export const fontAssets: Record<string, FontSource> = {
  'SF-Pro-Rounded-Bold': require('../../assets/fonts/SF-Pro-Rounded-Bold.otf'),
  'SF-Pro-Rounded-Semibold': require('../../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
  'SF-Pro-Rounded-Medium': require('../../assets/fonts/SF-Pro-Rounded-Medium.otf'),
  'SF-Pro-Rounded-Regular': require('../../assets/fonts/SF-Pro-Rounded-Regular.otf'),
  'SF-Pro-Bold': require('../../assets/fonts/SF-Pro-Text-Bold.otf'),
  'SF-Pro-Medium': require('../../assets/fonts/SF-Pro-Text-Medium.otf'),
  'SF-Pro-Regular': require('../../assets/fonts/SF-Pro-Text-Regular.otf'),
  'SF-Pro-Light': require('../../assets/fonts/SF-Pro-Text-Light.otf'),
};
