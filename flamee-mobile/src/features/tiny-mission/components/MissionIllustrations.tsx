import { useId } from "react";
import { Image, StyleSheet } from "react-native";
import { YStack } from "tamagui";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { missionTokens as t } from "../../../shared/constants/tokens";
import type { MissionPreview } from "../previewContent";

/** Small native vector illustrations; the larger scenes are local raster artwork. */
export function MissionIllustration({ kind, size = t.artworkSize }: { kind: MissionPreview["id"] | "coin" | "flame" | "gift"; size?: number }) {
  const id = useId().replace(/:/g, "");
  const fill = `url(#${id})`;
  return <Svg width={size} height={size} style={{ flexShrink: 0 }} viewBox="0 0 64 64" aria-hidden>
    <Defs><LinearGradient id={id} x1="0" y1="0" x2="0.8" y2="1"><Stop offset="0" stopColor="#FFAA6D" /><Stop offset="1" stopColor={t.coral} /></LinearGradient></Defs>
    {kind === "coin" ? <><Circle cx="32" cy="32" r="29" fill="#FFB54F" /><Circle cx="32" cy="32" r="24" stroke="#FFD58E" strokeWidth="3" fill="#FF953F" /><Path d="M32 12C35 24 44 25 43 36C43 46 22 50 21 36C20 29 26 24 26 21L30 28C35 24 33 18 32 12Z" fill="#FFDF9E" /><Path d="M33 30C45 41 28 48 27 38C27 35 30 34 30 32L33 35Z" fill={t.coral} /></> : null}
    {kind === "flame" ? <><Path d="M31 3C35 16 49 17 50 34C59 25 51 15 51 15C69 42 53 61 33 61C9 61 3 41 15 24C14 32 21 30 22 24C25 17 22 11 31 3Z" fill={fill} /><Path d="M32 26C35 35 43 36 43 44C43 58 20 58 21 43C22 37 26 34 27 31L32 39C37 35 32 30 32 26Z" fill="#FFD58D" /></> : null}
    {kind === "gift" ? <><Rect x="9" y="25" width="46" height="33" rx="5" fill={fill} /><Rect x="5" y="19" width="54" height="12" rx="4" fill="#FF8C68" /><Rect x="28" y="20" width="8" height="38" fill="#FFD397" /><Path d="M32 20C9 20 13 2 23 7C29 10 32 20 32 20ZM32 20C55 20 51 2 41 7C35 10 32 20 32 20Z" stroke={t.coral} strokeWidth="5" fill="none" /></> : null}
    {kind === "photo" ? <G transform="rotate(-10 29 31)"><Rect x="9" y="6" width="44" height="53" rx="4" fill="#E8DCCD" /><Rect x="7" y="4" width="44" height="53" rx="4" fill="#FFFDF9" /><Rect x="11" y="8" width="36" height="35" rx="2" fill="#B1D5EB" /><Circle cx="37" cy="18" r="5" fill="#FFE1A4" /><Path d="M11 33L22 23L34 35L40 29L47 36V43H11Z" fill="#9CAE7D" /><Path d="M39 44C31 34 22 45 39 56C56 44 47 35 39 44Z" fill="#FF8290" stroke="#FFFCF8" strokeWidth="3" /></G> : null}
    {kind === "message" ? <><Path d="M7 26C7 1 54 1 54 27C54 44 38 45 23 43L12 52L13 39C8 35 7 31 7 26Z" fill={fill} /><Circle cx="21" cy="25" r="3" fill="#FFF8F0" /><Circle cx="31" cy="25" r="3" fill="#FFF8F0" /><Circle cx="41" cy="25" r="3" fill="#FFF8F0" /><Path d="M46 40C37 30 28 43 46 55C64 43 54 30 46 40Z" fill="#FF8290" stroke="#FFFCF8" strokeWidth="3" /></> : null}
    {kind === "call" ? <><Rect x="5" y="14" width="38" height="37" rx="9" fill="#FFAF52" /><Path d="M45 24L55 17Q60 15 60 21V46Q60 51 55 48L45 42Z" fill="#FF9C43" /><Path d="M24 29C15 19 6 30 24 43C42 30 33 19 24 29Z" fill="#FFF8ED" /></> : null}
    {kind === "plan" ? <><Rect x="7" y="12" width="47" height="45" rx="7" fill="#FFD4BF" /><Path d="M7 20Q7 12 15 12H46Q54 12 54 20V25H7Z" fill={fill} /><Path d="M19 8V18M42 8V18" stroke="#FFAD96" strokeWidth="5" strokeLinecap="round" />{[16,29,42].map(x => [32,43].map(y => <Rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1" fill="#E7A18F" />))}<Path d="M46 43C37 33 28 46 46 58C64 46 54 33 46 43Z" fill="#FF8290" stroke="#FFFCF8" strokeWidth="3" /></> : null}
  </Svg>;
}

export function FlameCouple({ size = t.mascotSize }: { size?: number }) {
  return <Image source={require("../assets/flame-couple.png")} style={{ width: size, height: size }} resizeMode="contain" accessible={false} />;
}

export function VideoCallArtwork() {
  return <YStack width="100%" aspectRatio={t.heroAspectRatio} overflow="hidden"><Image source={require("../assets/video-call.png")} style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]} resizeMode="contain" accessible={false} /></YStack>;
}
