import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { startupTokens } from "../../../shared/constants/tokens";

export function StartupBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.background]} pointerEvents="none" accessible={false}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="startup-peach-wash" cx="50%" cy="44%" rx="48%" ry="30%">
            <Stop offset="0" stopColor={startupTokens.backgroundPeach} />
            <Stop offset="0.15" stopColor={startupTokens.backgroundPeach} />
            <Stop offset="1" stopColor={startupTokens.backgroundEdge} />
          </RadialGradient>
          <RadialGradient id="startup-cream-glow" cx="50%" cy="44%" rx="42%" ry="24%">
            <Stop offset="0" stopColor={startupTokens.backgroundCenter} />
            <Stop offset="0.25" stopColor={startupTokens.backgroundCenter} stopOpacity={0.95} />
            <Stop offset="1" stopColor={startupTokens.backgroundCenter} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#startup-peach-wash)" />
        <Rect width="100" height="100" fill="url(#startup-cream-glow)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: startupTokens.background },
});
