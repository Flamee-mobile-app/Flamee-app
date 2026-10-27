import { StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { startupTokens } from "../../../shared/constants/tokens";

export function StartupBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.background]} pointerEvents="none" accessible={false}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Rect width="100" height="100" fill={startupTokens.background} />
        <Path d="M0 0H100V18C78 25 58 19 39 24C22 29 9 29 0 34Z" fill={startupTokens.backgroundLight} opacity={0.52} />
        <Path d="M0 77C17 69 32 70 49 76C70 84 84 72 100 63V100H0Z" fill={startupTokens.backgroundShade} opacity={0.24} />
        <Path d="M0 73C18 65 33 67 50 73C70 81 84 69 100 60" fill="none" stroke={startupTokens.backgroundContour} strokeWidth={0.28} opacity={0.58} />
        <Path d="M0 80C18 72 34 74 51 80C72 87 85 77 100 68" fill="none" stroke={startupTokens.backgroundContour} strokeWidth={0.2} opacity={0.34} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: startupTokens.background },
});
