import type { RefObject } from "react";
import { Platform, StyleSheet, type View } from "react-native";
import { BlurView } from "expo-blur";
import { YStack } from "tamagui";
import { glassTokens } from "../constants/tokens";

/** Place after its BlurTargetView, outside the target, so the surface never blurs itself. */
export function AppGlassBackdrop({ blurTarget, tone = "neutral" }: {
  blurTarget: RefObject<View | null>;
  tone?: "neutral" | "header";
}) {
  const backgroundColor = tone === "header" ? "$glassHeader" : "$glassDialog";
  return <YStack position="absolute" top={0} right={0} bottom={0} left={0} pointerEvents="none"
    backgroundColor={backgroundColor} backdropFilter={Platform.OS === "web" ? glassTokens.dialogBackdrop : undefined}>
    {Platform.OS !== "web" ? <BlurView blurTarget={blurTarget} intensity={glassTokens.nativeDialogBlur} tint="systemUltraThinMaterialLight" blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} /> : null}
    {Platform.OS !== "web" && tone === "header" ? <YStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="$glassHeader" /> : null}
  </YStack>;
}
