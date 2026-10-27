import { useId } from "react";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { YStack } from "tamagui";
import { ambientTokens, colors } from "../constants/tokens";

export function AmbientBackground() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <YStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="$background" pointerEvents="none" accessible={false} aria-hidden>
    <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id={`${id}-warm`} cx="90%" cy="6%" rx="105%" ry="65%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor={colors.secondary} stopOpacity={ambientTokens.warmGlowOpacity} />
          <Stop offset="0.55" stopColor={colors.secondary} stopOpacity={ambientTokens.warmGlowOpacity / 3} />
          <Stop offset="1" stopColor={colors.secondary} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${id}-coral`} cx="0%" cy="85%" rx="95%" ry="50%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor={colors.primary} stopOpacity={ambientTokens.coralGlowOpacity} />
          <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id}-warm)`} />
      <Rect width="100%" height="100%" fill={`url(#${id}-coral)`} />
    </Svg>
  </YStack>;
}
