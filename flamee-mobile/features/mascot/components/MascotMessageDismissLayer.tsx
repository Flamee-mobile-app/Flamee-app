import { Pressable, StyleSheet } from 'react-native';

export type MascotMessageDismissLayerProps = {
  onDismiss: () => void;
  testID?: string;
};

export function MascotMessageDismissLayer({
  onDismiss,
  testID = 'mascot-message-dismiss-surface',
}: MascotMessageDismissLayerProps) {
  return (
    <Pressable
      accessibilityLabel="Đóng gợi ý Flamee"
      accessibilityRole="button"
      onPress={onDismiss}
      style={styles.surface}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  surface: StyleSheet.absoluteFillObject,
});
