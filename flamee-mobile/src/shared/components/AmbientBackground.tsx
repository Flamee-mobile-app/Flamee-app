import { StyleSheet, View } from "react-native";
import { colors } from "../constants/tokens";

export function AmbientBackground() {
  return <View pointerEvents="none" style={styles.container} accessible={false} />;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
  },
});
