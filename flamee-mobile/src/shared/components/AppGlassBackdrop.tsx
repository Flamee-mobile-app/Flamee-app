import type { RefObject } from "react";
import { Platform, StyleSheet, type View } from "react-native";
import { BlurView } from "expo-blur";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { YStack } from "tamagui";
import { colors, glassTokens, liquidHeaderTokens } from "../constants/tokens";

/** Place after its BlurTargetView, outside the target, so the surface never blurs itself. */
export function AppGlassBackdrop({ blurTarget, tone = "neutral" }: {
  blurTarget: RefObject<View | null>;
  tone?: "neutral" | "header" | "liquid";
}) {
  if (tone === "liquid") {
    const fallback = Platform.OS === "android" && Number(Platform.Version) < 31;
    return <YStack position="absolute" top={0} right={0} bottom={0} left={0} pointerEvents="none"
      backgroundColor={Platform.OS === "web" ? "$glassLiquid" : "transparent"}
      backdropFilter={Platform.OS === "web" ? liquidHeaderTokens.webBackdrop : undefined}>
      {Platform.OS !== "web" && !fallback ? <BlurView blurTarget={blurTarget} intensity={liquidHeaderTokens.nativeBlur} tint="systemUltraThinMaterialLight" blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} /> : null}
      {Platform.OS !== "web" ? <YStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor={fallback ? "$glassLiquidFallback" : "$glassLiquid"} /> : null}
      <Svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="liquid-sheen" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.white} stopOpacity={liquidHeaderTokens.reflectionOpacity} />
            <Stop offset="0.45" stopColor={colors.white} stopOpacity={0.04} />
            <Stop offset="1" stopColor={colors.supportPeach} stopOpacity={0.14} />
          </LinearGradient>
          <LinearGradient id="liquid-edge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.white} stopOpacity={0} />
            <Stop offset="0.3" stopColor={colors.white} stopOpacity={liquidHeaderTokens.edgeOpacity} />
            <Stop offset="1" stopColor={colors.white} stopOpacity={0.1} />
          </LinearGradient>
        </Defs>
        <Rect width={400} height={140} fill="url(#liquid-sheen)" />
        <Path d="M 20 1 L 380 1" stroke="url(#liquid-edge)" strokeWidth={1} />
        <Path d="M 24 139 L 376 139" stroke="url(#liquid-edge)" strokeWidth={0.7} opacity={0.65} />
      </Svg>
    </YStack>;
  }
  const backgroundColor = tone === "header" ? "$glassHeader" : "$glassDialog";
  return <YStack position="absolute" top={0} right={0} bottom={0} left={0} pointerEvents="none"
    backgroundColor={backgroundColor} backdropFilter={Platform.OS === "web" ? glassTokens.dialogBackdrop : undefined}>
    {Platform.OS !== "web" ? <BlurView blurTarget={blurTarget} intensity={glassTokens.nativeDialogBlur} tint="systemUltraThinMaterialLight" blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} /> : null}
    {Platform.OS !== "web" && tone === "header" ? <YStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="$glassHeader" /> : null}
  </YStack>;
}
