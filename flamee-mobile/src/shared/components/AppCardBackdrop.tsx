import { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { YStack } from "tamagui";
import { brandGradient, cardTokens, colors } from "../constants/tokens";

/** Full-color stops over opaque white; tone sets the strength of the brand layer. */
export function AppCardBackdrop({ radius, opacity = cardTokens.gradientOpacity }: { radius: number; opacity?: number }) {
  const id = `card-warm-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return <YStack position="absolute" top={0} right={0} bottom={0} left={0} borderRadius={radius} overflow="hidden" pointerEvents="none" accessible={false}>
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor={brandGradient[0]} stopOpacity={1} />
        <Stop offset="100%" stopColor={brandGradient[1]} stopOpacity={1} />
      </LinearGradient></Defs>
      <Rect width="100%" height="100%" fill={colors.white} />
      <Rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} />
    </Svg>
  </YStack>;
}
