import { StyleSheet, View } from "react-native";
import { startupTokens } from "../../../shared/constants/tokens";

// Flat paper color: the logo supplies the color and motion.
export function StartupBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.background]} pointerEvents="none" accessible={false} />
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: startupTokens.background },
});
