import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../../../shared/constants/tokens";
import type { Mood } from "../types";

// Code-native artwork: the expression communicates mood independently of color.
export function MoodFace({ mood, size, color = colors.accentText }: { mood: Mood; size: number; color?: string }) {
  const mouth = {
    1: "M 10 22 Q 16 15 22 22",
    2: "M 11 21 Q 16 17 21 21",
    3: "M 11 20 H 21",
    4: "M 10 19 Q 16 25 22 19",
    5: "M 9 18 Q 16 29 23 18 Z",
  }[mood];

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" aria-hidden={true}>
      <Circle cx={16} cy={16} r={14} fill="none" stroke={color} strokeWidth={1.5} />
      {mood === 5 ? (
        <Path d="M 9 13 Q 11 10 13 13 M 19 13 Q 21 10 23 13" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      ) : (
        <>
          <Circle cx={11} cy={13} r={1} fill={color} />
          <Circle cx={21} cy={13} r={1} fill={color} />
        </>
      )}
      {mood === 1 ? <Path d="M 8 9 L 13 11 M 19 11 L 24 9" stroke={color} strokeWidth={1.5} strokeLinecap="round" /> : null}
      <Path d={mouth} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
