import { Image, StyleSheet } from "react-native";
import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
export { StartupBackground } from "./StartupBackground";
import { startupTokens as tokens } from "../../../shared/constants/tokens";

const symbol = require("../assets/flamee-symbol.png");
const wordmark = require("../assets/flamee-wordmark.png");

export function phase(time: number, start: number, end: number): number {
  "worklet";
  const value = Math.max(0, Math.min(1, (time - start) / (end - start)));
  return value * value * (3 - 2 * value);
}

type StartupArtworkProps = {
  time: SharedValue<number>;
  breath: SharedValue<number>;
  reducedMotion: boolean;
  size: number;
  onImageError: () => void;
};

const sparks = [
  { x: -57, y: -153, delay: 0, radius: 1.3 },
  { x: 42, y: -180, delay: 40, radius: 1 },
  { x: -26, y: -202, delay: 70, radius: 1.6 },
  { x: 65, y: -117, delay: 100, radius: 1.2 },
  { x: 18, y: -165, delay: 130, radius: 0.9 },
  { x: -73, y: -97, delay: 160, radius: 1.1 },
] as const;

function Spark({ spark, time, size }: { spark: typeof sparks[number]; time: SharedValue<number>; size: number }) {
  const scale = size / tokens.canvasSize;
  const style = useAnimatedStyle(() => {
    const progress = phase(time.value, tokens.flameStart + spark.delay, tokens.flameEnd);
    return {
      opacity: Math.sin(progress * Math.PI) * 0.7,
      transform: [
        { translateX: spark.x * progress * scale },
        { translateY: spark.y * progress * scale },
      ],
    };
  });
  return <Animated.View style={[styles.spark, { left: tokens.heartX * scale, top: tokens.heartY * scale, width: spark.radius * 2, height: spark.radius * 2 }, style]} />;
}

function Ember({ side, time, size }: { side: "left" | "right"; time: SharedValue<number>; size: number }) {
  const unit = size / tokens.canvasSize;
  const glowSize = tokens.emberGlowSize * unit;
  const coreSize = tokens.emberSize * unit;
  const style = useAnimatedStyle(() => {
    const progress = phase(time.value, tokens.connectionStart, tokens.connectionEnd);
    const startX = side === "left" ? 8 : 312;
    const x = startX + (tokens.heartX - startX) * progress;
    const y = 181 + (tokens.heartY - 181) * progress - Math.sin(progress * Math.PI) * 27;
    return {
      opacity: phase(time.value, 0, tokens.connectionStart + 80)
        * (1 - phase(time.value, tokens.heartDrawStart, tokens.heartDrawEnd)),
      transform: [
        { translateX: x * unit },
        { translateY: y * unit },
        { scale: 0.84 + 0.22 * Math.sin(progress * Math.PI * 3) },
      ],
    };
  });

  return <Animated.View style={[styles.ember, {
    left: -glowSize / 2,
    top: -glowSize / 2,
    width: glowSize,
    height: glowSize,
    borderWidth: (glowSize - coreSize) / 2,
  }, style]} />;
}

export function StartupArtwork({ time, breath, reducedMotion, size, onImageError }: StartupArtworkProps) {
  const scale = size / tokens.canvasSize;
  const logoWidth = tokens.logoWidth * scale;
  const logoHeight = logoWidth * 266 / 223;
  const wordmarkWidth = tokens.wordmarkWidth * scale;
  const glowSize = tokens.glowSize * scale;
  const logoStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : phase(time.value, tokens.flameStart, tokens.flameStart + 220),
    transform: [{ scale: reducedMotion ? 1 : 0.13 + 0.87 * phase(time.value, tokens.flameStart, tokens.flameEnd) }],
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    width: wordmarkWidth * (reducedMotion ? 1 : phase(time.value, tokens.wordmarkStart, tokens.wordmarkEnd)),
    opacity: reducedMotion ? 1 : phase(time.value, tokens.wordmarkStart, tokens.wordmarkEnd),
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.38 : phase(time.value, tokens.connectionStart, tokens.heartDrawStart) * (0.24 + breath.value * 0.16),
    transform: [{ scale: reducedMotion ? 1 : 0.72 + 0.28 * phase(time.value, tokens.connectionStart, tokens.flameEnd) }],
  }));
  const heartOutlineStyle = useAnimatedStyle(() => ({
    opacity: phase(time.value, tokens.heartDrawStart, tokens.heartDrawEnd)
      * (1 - phase(time.value, tokens.flameEnd, tokens.wordmarkEnd)),
    transform: [{ scale: interpolate(time.value, [tokens.heartDrawStart, tokens.heartDrawEnd], [0.82, 1], "clamp") }],
  }));

  return (
    <Animated.View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.glow, { width: glowSize, height: glowSize, left: (size - glowSize) / 2, top: 8 * scale }, glowStyle]} />
      {!reducedMotion && <>
        <Ember side="left" time={time} size={size} />
        <Ember side="right" time={time} size={size} />
        <Animated.View style={[styles.heartOutline, {
          left: tokens.heartX * scale - 62 * scale,
          top: tokens.heartY * scale - 96 * scale,
        }, heartOutlineStyle]}>
          <Heart size={124 * scale} color={tokens.amber} strokeWidth={1.4} />
        </Animated.View>
        {sparks.map((spark, index) => <Spark key={index} spark={spark} time={time} size={size} />)}
      </>}
      <Animated.View style={[styles.absolute, {
        left: tokens.heartX * scale - logoWidth * 0.457,
        top: tokens.heartY * scale - logoHeight * 0.9,
        width: logoWidth,
        height: logoHeight,
      }, styles.brandHidden, logoStyle]}>
        <Image source={symbol} style={styles.image} resizeMode="contain" accessible={false} fadeDuration={0} onError={onImageError} />
      </Animated.View>
      <Animated.View style={[styles.wordmark, styles.brandHidden, { left: (size - wordmarkWidth) / 2, top: tokens.wordmarkY * scale, height: wordmarkWidth * 168 / 772 }, wordmarkStyle]}>
        <Image source={wordmark} style={[styles.image, { width: wordmarkWidth }]} resizeMode="contain" accessible={false} fadeDuration={0} onError={onImageError} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: "absolute" },
  brandHidden: { opacity: 0 },
  glow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: tokens.amber,
    boxShadow: `0 0 56px ${tokens.coral}73`,
  },
  image: { width: "100%", height: "100%" },
  wordmark: { position: "absolute", overflow: "hidden" },
  spark: { position: "absolute", backgroundColor: tokens.peach, borderRadius: 999 },
  heartOutline: { position: "absolute" },
  ember: {
    position: "absolute",
    borderRadius: 999,
    borderColor: tokens.peach,
    backgroundColor: `${tokens.coral}38`,
    boxShadow: `0 0 20px ${tokens.amber}`,
  },
});
