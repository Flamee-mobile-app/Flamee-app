import { Image, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
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
  { x: 42, y: -180, delay: 110, radius: 1 },
  { x: -26, y: -202, delay: 180, radius: 1.6 },
  { x: 65, y: -117, delay: 240, radius: 1.2 },
  { x: 18, y: -165, delay: 300, radius: 0.9 },
  { x: -73, y: -97, delay: 350, radius: 1.1 },
] as const;

function Spark({ spark, time, size }: { spark: typeof sparks[number]; time: SharedValue<number>; size: number }) {
  const scale = size / tokens.canvasSize;
  const style = useAnimatedStyle(() => {
    const progress = phase(time.value, tokens.flameStart + spark.delay, tokens.flameEnd + spark.delay);
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

export function StartupArtwork({ time, breath, reducedMotion, size, onImageError }: StartupArtworkProps) {
  const scale = size / tokens.canvasSize;
  const logoWidth = tokens.logoWidth * scale;
  const logoHeight = logoWidth * 266 / 223;
  const wordmarkWidth = tokens.wordmarkWidth * scale;
  const glowSize = tokens.glowSize * scale;
  const logoStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : phase(time.value, tokens.flameStart, tokens.flameStart + 300),
    transform: [{ scale: reducedMotion ? 1 : 0.13 + 0.87 * phase(time.value, tokens.flameStart, tokens.flameEnd) }],
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    width: wordmarkWidth * (reducedMotion ? 1 : phase(time.value, tokens.wordmarkStart, tokens.wordmarkEnd)),
    opacity: reducedMotion ? 1 : phase(time.value, 1200, 1430),
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.28 : 0.18 + breath.value * 0.12,
    transform: [{ scale: reducedMotion ? 1 : 0.9 + 0.1 * breath.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: phase(time.value, 400, 510) * (1 - phase(time.value, 510, 1000)) * 0.45,
    transform: [{ scale: 0.45 + 1.4 * phase(time.value, 400, 1000) }],
  }));

  return (
    <Animated.View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.glow, { width: glowSize, height: glowSize, left: (size - glowSize) / 2, top: 8 * scale }, glowStyle]} />
      {!reducedMotion && <>
        <Animated.View style={[styles.ring, { width: tokens.ringSize * scale, height: tokens.ringSize * scale, left: (tokens.heartX - tokens.ringSize / 2) * scale, top: (tokens.heartY - tokens.ringSize / 2) * scale }, ringStyle]} />
        {sparks.map((spark, index) => <Spark key={index} spark={spark} time={time} size={size} />)}
      </>}
      <Animated.View style={[styles.absolute, {
        left: tokens.heartX * scale - logoWidth * 0.457,
        top: tokens.heartY * scale - logoHeight * 0.9,
        width: logoWidth,
        height: logoHeight,
      }, logoStyle]}>
        <Image source={symbol} style={styles.image} resizeMode="contain" accessible={false} onError={onImageError} />
      </Animated.View>
      <Animated.View style={[styles.wordmark, { left: (size - wordmarkWidth) / 2, top: tokens.wordmarkY * scale, height: wordmarkWidth * 168 / 772 }, wordmarkStyle]}>
        <Image source={wordmark} style={[styles.image, { width: wordmarkWidth }]} resizeMode="contain" accessible={false} onError={onImageError} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: "absolute" },
  glow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: tokens.amber,
    boxShadow: `0 0 56px ${tokens.coral}73`,
  },
  image: { width: "100%", height: "100%" },
  wordmark: { position: "absolute", overflow: "hidden" },
  ring: { position: "absolute", borderWidth: 1, borderColor: tokens.amber, borderRadius: 999 },
  spark: { position: "absolute", backgroundColor: tokens.peach, borderRadius: 999 },
});
