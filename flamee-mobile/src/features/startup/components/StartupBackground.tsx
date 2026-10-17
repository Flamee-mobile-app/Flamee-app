import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { startupTokens } from "../../../shared/constants/tokens";

export function StartupBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.background]} pointerEvents="none" accessible={false}>
      <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="startup-depth" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={startupTokens.backgroundDeep} />
            <Stop offset="0.52" stopColor={startupTokens.background} />
            <Stop offset="1" stopColor={startupTokens.backgroundDeep} />
          </LinearGradient>
          <RadialGradient id="startup-warm-glow" cx="50%" cy="46%" r="62%">
            <Stop offset="0" stopColor={startupTokens.backgroundGlow} stopOpacity={0.92} />
            <Stop offset="0.45" stopColor={startupTokens.background} stopOpacity={0.48} />
            <Stop offset="1" stopColor={startupTokens.backgroundDeep} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="startup-ember-haze" cx="50%" cy="54%" r="46%">
            <Stop offset="0" stopColor={startupTokens.coral} stopOpacity={0.13} />
            <Stop offset="1" stopColor={startupTokens.coral} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#startup-depth)" />
        <Rect width="100%" height="100%" fill="url(#startup-warm-glow)" />
        <Circle cx="50%" cy="54%" r="42%" fill="url(#startup-ember-haze)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: startupTokens.background },
});
