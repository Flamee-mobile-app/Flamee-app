import { Image, Platform, StyleSheet, View } from "react-native";
import Animated, { useAnimatedProps, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import Svg, { Circle, Defs, Image as SvgImage, LinearGradient, Mask, Path, RadialGradient, Rect, Stop } from "react-native-svg";
export { StartupBackground } from "./StartupBackground";
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

function LightPaths({ time, size }: Pick<MotionProps, "time" | "size">) {
  const connections = useAnimatedProps(() => ({
    strokeDashoffset: 180 * (1 - phase(time.value, tokens.connectionStart, tokens.connectionEnd)),
    opacity: phase(time.value, tokens.connectionStart, tokens.connectionStart + 100)
      * (1 - phase(time.value, tokens.heartDrawStart, tokens.heartDrawEnd)),
  }));
  const heart = useAnimatedProps(() => ({
    strokeDashoffset: 420 * (1 - phase(time.value, tokens.heartDrawStart, tokens.heartDrawEnd)),
    opacity: phase(time.value, tokens.heartDrawStart, tokens.heartDrawStart + 120)
      * (1 - phase(time.value, tokens.flameEnd, tokens.wordmarkEnd)),
  }));
  const trails = useAnimatedProps(() => ({
    strokeDashoffset: 300 * (1 - phase(time.value, tokens.flameStart, tokens.flameEnd)),
    opacity: phase(time.value, tokens.flameStart, tokens.flameStart + 140)
      * (1 - phase(time.value, tokens.wordmarkStart, tokens.wordmarkEnd)),
  }));
  return (
    <Svg width={size} height={size} viewBox="0 0 320 320" style={StyleSheet.absoluteFill} aria-hidden={true}>
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
      <AnimatedPath d="M 8 181 Q 76 154 160 208 M 312 181 Q 244 154 160 208" stroke="url(#startup-connection)" strokeWidth={1.8} strokeLinecap="round" fill="none" strokeDasharray="180 180" animatedProps={connections} />
      <AnimatedPath d="M 160 222 C 121 196 94 168 99 136 C 104 105 143 100 160 128 C 177 100 216 105 221 136 C 226 168 199 196 160 222 Z" stroke="url(#startup-trail)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="420 420" animatedProps={heart} />
      <AnimatedPath d="M 160 208 C 104 157 225 142 169 93 C 148 73 181 48 171 25" stroke="url(#startup-trail)" strokeWidth={1.6} strokeLinecap="round" fill="none" strokeDasharray="300 300" animatedProps={trails} />
      <AnimatedPath d="M 160 208 C 210 161 140 137 178 99 C 197 78 168 60 176 38" stroke="url(#startup-trail)" strokeWidth={0.65} fill="none" strokeDasharray="300 300" animatedProps={trails} />
    </Svg>
  );
}

function Ember({ side, time, size }: Pick<MotionProps, "time" | "size"> & { side: "left" | "right" }) {
  const unit = size / tokens.canvasSize;
  const glowSize = tokens.emberGlowSize * unit;
  const coreSize = tokens.emberSize * unit;
  const style = useAnimatedStyle(() => {
    const progress = phase(time.value, tokens.connectionStart, tokens.connectionEnd);
    const startX = side === "left" ? 8 : 312;
    const x = startX + (tokens.heartX - startX) * progress;
    const y = 181 + (tokens.heartY - 181) * progress - Math.sin(progress * Math.PI) * 27;
    const appear = phase(time.value, 0, tokens.connectionStart + 80);
    const disappear = 1 - phase(time.value, tokens.heartDrawStart, tokens.heartDrawEnd);
    return {
      opacity: appear * disappear,
      transform: [
        { translateX: x * unit },
        { translateY: y * unit },
        { scale: 0.84 + 0.22 * Math.sin(Math.max(0, progress) * Math.PI * 3) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.emberGlow, { left: -glowSize / 2, top: -glowSize / 2, width: glowSize, height: glowSize }, style]}>
      <View style={[styles.emberCore, { width: coreSize, height: coreSize, borderRadius: coreSize }]} />
    </Animated.View>
  );
}

const sparks = [
  { x: -57, y: -153, delay: 0, radius: 1.3 },
  { x: 42, y: -180, delay: 40, radius: 1 },
  { x: -26, y: -202, delay: 70, radius: 1.6 },
  { x: 65, y: -117, delay: 100, radius: 1.2 },
  { x: 18, y: -165, delay: 130, radius: 0.9 },
  { x: -73, y: -97, delay: 160, radius: 1.1 },
] as const;

function Spark({ spark, time, size }: Pick<MotionProps, "time" | "size"> & { spark: typeof sparks[number] }) {
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

export function StartupArtwork({ time, breath, reducedMotion, size, onImageError }: MotionProps & {
  onImageError: () => void;
}) {
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
    opacity: reducedMotion ? 0.38 : phase(time.value, tokens.connectionStart, tokens.heartDrawStart) * (0.46 + breath.value * 0.16),
    transform: [{ scale: reducedMotion ? 1 : 0.72 + 0.28 * phase(time.value, tokens.connectionStart, tokens.flameEnd) }],
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
        <Ember side="left" time={time} size={size} />
        <Ember side="right" time={time} size={size} />
        {sparks.map((spark, index) => <Spark key={index} spark={spark} time={time} size={size} />)}
      </>}
      <Animated.View style={[styles.absolute, {
        left: tokens.heartX * scale - logoWidth * 0.457,
        top: tokens.heartY * scale - logoHeight * 0.9,
        width: logoWidth,
        height: logoHeight,
        // Grow uniformly around the original heart cutout, without stretching the flame.
        transformOrigin: [logoWidth * 0.457, logoHeight * 0.9, 0],
      }, styles.brandHidden, logoStyle]}>
        <Image source={symbol} style={styles.image} resizeMode="contain" accessible={false} fadeDuration={0} onError={onImageError} />
      </Animated.View>
      <Animated.View style={[styles.wordmark, styles.brandHidden, { left: (size - wordmarkWidth) / 2, top: tokens.wordmarkY * scale, height: wordmarkWidth * 168 / 772 }, wordmarkStyle]}>
        <Svg width={wordmarkWidth} height={wordmarkWidth * 168 / 772} viewBox="0 0 772 168" aria-hidden={true}>
          <Defs>
            <LinearGradient id="startup-wordmark-fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={tokens.wordmarkTop} />
              <Stop offset="1" stopColor={tokens.wordmarkBottom} />
            </LinearGradient>
            <Mask id="startup-wordmark-mask" maskType={Platform.OS === "web" ? undefined : "alpha"}>
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
  brandHidden: { opacity: 0 },
  image: { width: "100%", height: "100%" },
  wordmark: { position: "absolute", overflow: "hidden" },
  spark: { position: "absolute", backgroundColor: tokens.peach, borderRadius: 999 },
  emberGlow: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: `${tokens.coral}26`,
    shadowColor: tokens.amber,
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 9,
  },
  emberCore: {
    backgroundColor: tokens.peach,
    shadowColor: tokens.amber,
    shadowOpacity: 1,
    shadowRadius: 7,
    elevation: 12,
  },
});
