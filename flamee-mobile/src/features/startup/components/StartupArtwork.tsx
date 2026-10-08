import { Image, StyleSheet } from "react-native";
import { Heart } from "@tamagui/lucide-icons-2";
import Animated, { interpolate, useAnimatedProps, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import Svg, { Circle, Defs, Image as SvgImage, LinearGradient, Mask, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { AmbientBackground } from "../../../shared/components/AmbientBackground";
import { startupTokens as tokens } from "../../../shared/constants/tokens";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const symbol = require("../assets/flamee-symbol.png");
const wordmark = require("../assets/flamee-wordmark.png");

export function phase(time: number, start: number, end: number): number {
  "worklet";
  const value = Math.max(0, Math.min(1, (time - start) / (end - start)));
  return value * value * (3 - 2 * value);
}

type MotionProps = {
  time: SharedValue<number>;
  breath: SharedValue<number>;
  reducedMotion: boolean;
  size: number;
};

export function StartupBackground() {
  return <AmbientBackground />;
}

function LightPaths({ time, size }: Pick<MotionProps, "time" | "size">) {
  const connections = useAnimatedProps(() => ({
    strokeDashoffset: 180 * (1 - phase(time.value, tokens.connectionStart, tokens.connectionEnd)),
    opacity: phase(time.value, 250, 360) * (1 - phase(time.value, 580, 850)),
  }));
  const trails = useAnimatedProps(() => ({
    strokeDashoffset: 300 * (1 - phase(time.value, tokens.flameStart, 1250)),
    opacity: phase(time.value, 550, 700) * (1 - phase(time.value, 1100, 1550)),
  }));
  return (
    <Svg width={size} height={size} viewBox="0 0 320 320" style={StyleSheet.absoluteFill} accessible={false}>
      <Defs>
        <LinearGradient id="startup-trail" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={tokens.coral} stopOpacity={0} />
          <Stop offset="0.5" stopColor={tokens.amber} stopOpacity={0.6} />
          <Stop offset="1" stopColor={tokens.peach} />
        </LinearGradient>
        <LinearGradient id="startup-connection">
          <Stop offset="0" stopColor={tokens.coral} stopOpacity={0} />
          <Stop offset="0.5" stopColor={tokens.peach} />
          <Stop offset="1" stopColor={tokens.coral} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <AnimatedPath d="M 4 181 Q 70 176 160 208 M 316 181 Q 250 176 160 208" stroke="url(#startup-connection)" strokeWidth={1.2} fill="none" strokeDasharray="180 180" animatedProps={connections} />
      <AnimatedPath d="M 160 208 C 104 157 225 142 169 93 C 148 73 181 48 171 25" stroke="url(#startup-trail)" strokeWidth={1.6} strokeLinecap="round" fill="none" strokeDasharray="300 300" animatedProps={trails} />
      <AnimatedPath d="M 160 208 C 210 161 140 137 178 99 C 197 78 168 60 176 38" stroke="url(#startup-trail)" strokeWidth={0.65} fill="none" strokeDasharray="300 300" animatedProps={trails} />
    </Svg>
  );
}

const sparks = [
  { x: -57, y: -153, delay: 0, radius: 1.3 },
  { x: 42, y: -180, delay: 110, radius: 1 },
  { x: -26, y: -202, delay: 180, radius: 1.6 },
  { x: 65, y: -117, delay: 240, radius: 1.2 },
  { x: 18, y: -165, delay: 300, radius: 0.9 },
  { x: -73, y: -97, delay: 350, radius: 1.1 },
] as const;

function Spark({ spark, time, size }: Pick<MotionProps, "time" | "size"> & { spark: typeof sparks[number] }) {
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

export function StartupArtwork({ time, breath, reducedMotion, size, onImageError }: MotionProps & {
  onImageError: () => void;
}) {
  const scale = size / tokens.canvasSize;
  const logoWidth = tokens.logoWidth * scale;
  const logoHeight = logoWidth * 266 / 223;
  const wordmarkWidth = tokens.wordmarkWidth * scale;
  const glowSize = tokens.glowSize * scale;
  const heartSize = tokens.heartSize * scale;
  const heartStyle = useAnimatedStyle(() => ({
    opacity: phase(time.value, 0, 120) * (1 - phase(time.value, 850, 1450)),
    transform: [
      { scale: interpolate(time.value, [0, 170, 280, 550, 1450], [0.8, 1.12, 1, 1, 0.72], "clamp") },
      { rotate: `${-18 * phase(time.value, 550, 1400)}deg` },
    ],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : phase(time.value, 550, 850),
    transform: [{ scale: reducedMotion ? 1 : 0.13 + 0.87 * phase(time.value, tokens.flameStart, tokens.flameEnd) }],
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    width: wordmarkWidth * (reducedMotion ? 1 : phase(time.value, tokens.wordmarkStart, tokens.wordmarkEnd)),
    opacity: reducedMotion ? 1 : phase(time.value, 1200, 1430),
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.32 : phase(time.value, 0, 350) * (0.4 + breath.value * 0.13),
    transform: [{ scale: reducedMotion ? 1 : 0.88 + 0.12 * phase(time.value, 550, 1450) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: phase(time.value, 400, 510) * (1 - phase(time.value, 510, 1000)) * 0.45,
    transform: [{ scale: 0.45 + 1.4 * phase(time.value, 400, 1000) }],
  }));

  return (
    <Animated.View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.absolute, { left: (size - glowSize) / 2, top: 8 * scale, width: glowSize, height: glowSize }, glowStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 280 280">
          <Defs>
            <RadialGradient id="startup-glow">
              <Stop offset="0" stopColor={tokens.amber} stopOpacity={0.42} />
              <Stop offset="0.4" stopColor={tokens.coral} stopOpacity={0.2} />
              <Stop offset="1" stopColor={tokens.coral} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={140} cy={140} r={140} fill="url(#startup-glow)" />
        </Svg>
      </Animated.View>
      {!reducedMotion && <>
        <LightPaths time={time} size={size} />
        <Animated.View style={[styles.ring, { width: tokens.ringSize * scale, height: tokens.ringSize * scale, left: (tokens.heartX - tokens.ringSize / 2) * scale, top: (tokens.heartY - tokens.ringSize / 2) * scale }, ringStyle]} />
        {sparks.map((spark, index) => <Spark key={index} spark={spark} time={time} size={size} />)}
      </>}
      <Animated.View style={[styles.absolute, {
        left: tokens.heartX * scale - logoWidth * 0.457,
        top: tokens.heartY * scale - logoHeight * 0.9,
        width: logoWidth,
        height: logoHeight,
        // Grow uniformly around the original heart cutout, without stretching the flame.
        transformOrigin: [logoWidth * 0.457, logoHeight * 0.9, 0],
      }, logoStyle]}>
        <Image source={symbol} style={styles.image} resizeMode="contain" accessible={false} fadeDuration={0} onError={onImageError} />
      </Animated.View>
      {!reducedMotion && <Animated.View style={[styles.absolute, { left: tokens.heartX * scale - heartSize / 2, top: tokens.heartY * scale - heartSize / 2 }, heartStyle]}>
        {/* A transient light particle; the supplied logo and its heart cutout are untouched. */}
        <Heart size={heartSize} color={tokens.amber} fill={tokens.amber} strokeWidth={0} />
      </Animated.View>}
      <Animated.View style={[styles.wordmark, { left: (size - wordmarkWidth) / 2, top: tokens.wordmarkY * scale, height: wordmarkWidth * 168 / 772 }, wordmarkStyle]}>
        <Svg width={wordmarkWidth} height={wordmarkWidth * 168 / 772} viewBox="0 0 772 168" accessible={false}>
          <Defs>
            <LinearGradient id="startup-wordmark-fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={tokens.wordmarkTop} />
              <Stop offset="1" stopColor={tokens.wordmarkBottom} />
            </LinearGradient>
            <Mask id="startup-wordmark-mask" maskType="alpha">
              <SvgImage href={wordmark} width={772} height={168} />
            </Mask>
          </Defs>
          <Rect width={772} height={168} fill="url(#startup-wordmark-fill)" mask="url(#startup-wordmark-mask)" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: "absolute" },
  image: { width: "100%", height: "100%" },
  wordmark: { position: "absolute", overflow: "hidden" },
  ring: { position: "absolute", borderWidth: 1, borderColor: tokens.amber, borderRadius: 999 },
  spark: { position: "absolute", backgroundColor: tokens.peach, borderRadius: 999 },
});
