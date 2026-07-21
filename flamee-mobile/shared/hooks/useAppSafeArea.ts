import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Reusable safe area inset helper with minimum fallback boundaries for iOS & Android. */
export function useAppSafeArea() {
  const insets = useSafeAreaInsets();

  // Guarantee a safe top inset even inside modals or nested windows
  const defaultTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
  const safeTop = Math.max(insets?.top || 0, defaultTop);

  // Guarantee a safe bottom inset for iOS home indicator / Android navigation bar
  const defaultBottom = Platform.OS === 'ios' ? 34 : 16;
  const safeBottom = Math.max(insets?.bottom || 0, defaultBottom);

  return {
    top: safeTop,
    bottom: safeBottom,
    left: insets?.left || 0,
    right: insets?.right || 0,
    rawInsets: insets,
  };
}
