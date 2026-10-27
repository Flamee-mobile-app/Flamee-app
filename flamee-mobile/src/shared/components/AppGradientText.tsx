import { memo, useCallback, useId, useState, type ComponentRef, type Ref } from "react";
import { Platform, StyleSheet, Text as NativeText, useWindowDimensions, type TextLayoutEvent, type TextProps } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { YStack, type YStackProps } from "tamagui";
import { brandGradient, typography } from "../constants/tokens";
import { getGradientTextLines } from "./gradientTextModel";

type Props = Omit<YStackProps, "children" | "onTextLayout"> & {
  children: string | number | null | undefined;
  size?: keyof typeof typography;
  weight?: "medium" | "semibold" | "bold";
  align?: "left" | "center" | "right";
  numberOfLines?: number;
  textRef?: Ref<ComponentRef<typeof NativeText>>;
  fontFamily?: "$heading" | "$body";
  fontSize?: `$${keyof typeof typography}`;
  lineHeight?: `$${keyof typeof typography}`;
  fontWeight?: "$regular" | "$medium" | "$semibold" | "$bold";
  color?: string;
  textAlign?: "left" | "center" | "right";
};

/** Titles only: native text owns wrapping/accessibility; SVG paints its glyphs. */
export const AppGradientText = memo(function AppGradientText({ children, size = "h4", weight = "bold", align = "left", numberOfLines, textRef, fontFamily: _fontFamily, fontSize, lineHeight: _lineHeight, fontWeight: requestedWeight, color: _color, textAlign, ...layout }: Props) {
  const id = `brand-text-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { fontScale } = useWindowDimensions();
  const type = typography[fontSize ? fontSize.slice(1) as keyof typeof typography : size];
  const fontWeight = requestedWeight === "$regular" ? "400" : requestedWeight === "$medium" ? "500" : requestedWeight === "$semibold" ? "600" : requestedWeight === "$bold" ? "700" : weight === "bold" ? "700" : weight === "semibold" ? "600" : "500";
  const alignment = textAlign ?? align;
  const text = String(children ?? "");
  const signature = `${text}:${fontSize ?? size}:${fontWeight}:${fontScale}:${alignment}:${numberOfLines}`;
  const [measurement, setMeasurement] = useState<{ signature: string; lines: NonNullable<ReturnType<typeof getGradientTextLines>> } | null>(null);
  const measure = useCallback((event: TextLayoutEvent) => {
    const lines = getGradientTextLines(event.nativeEvent.lines, numberOfLines, fontScale);
    setMeasurement((current) => {
      if (!lines) return current === null ? current : null;
      if (current?.signature === signature && JSON.stringify(current.lines) === JSON.stringify(lines)) return current;
      return { signature, lines };
    });
  }, [signature, numberOfLines, fontScale]);
  const lines = measurement?.signature === signature ? measurement.lines : null;
  const nativeProps: TextProps = { numberOfLines, onTextLayout: Platform.OS === "web" || numberOfLines !== undefined || fontScale !== 1 ? undefined : measure };
  return <YStack minWidth={0} {...layout}>
    <NativeText ref={textRef} {...nativeProps} {...(Platform.OS === "web" && layout.tabIndex !== undefined ? { tabIndex: Number(layout.tabIndex) } : {})} style={[
      { fontSize: type.fontSize, lineHeight: type.lineHeight, fontWeight, textAlign: alignment, color: lines ? "transparent" : brandGradient[1] },
      Platform.OS === "web" ? { backgroundImage: `linear-gradient(90deg, ${brandGradient[0]}, ${brandGradient[1]})`, backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" } as object : undefined,
    ]}>{text}</NativeText>
    {Platform.OS !== "web" && lines ? <Svg pointerEvents="none" accessible={false} width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0%" stopColor={brandGradient[0]} /><Stop offset="100%" stopColor={brandGradient[1]} /></LinearGradient></Defs>
      {lines.map((line, index) => <SvgText key={index} x={line.x} y={line.baseline} fontSize={type.fontSize * fontScale} fontWeight={fontWeight} fill={`url(#${id})`}>{line.text}</SvgText>)}
    </Svg> : null}
  </YStack>;
});
