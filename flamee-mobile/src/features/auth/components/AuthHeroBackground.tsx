import { useState } from "react";
import { Image, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { loginTokens } from "../../../shared/constants/tokens";

const background = require("../../../public/login-bg.png");

export function AuthHeroBackground() {
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setFrame((previous) => previous.width === layout.width && previous.height === layout.height
      ? previous : { width: layout.width, height: layout.height });
  };
  // Reference crop: house on the left, moon near 3/4 of the header width.
  // Cover taller headers without stretching the original landscape.
  const width = Math.max(frame.width * loginTokens.heroImageWidthRatio,
    frame.height * loginTokens.heroImageAspectRatio);
  const imageStyle = frame.width > 0 ? {
    position: "absolute" as const,
    width,
    height: width / loginTokens.heroImageAspectRatio,
    left: -(width - frame.width) * loginTokens.heroImageHorizontalAnchor,
    top: 0,
  } : StyleSheet.absoluteFill;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none" accessible={false}>
      <Image source={background} resizeMode="cover" fadeDuration={0} style={imageStyle} accessible={false} />
    </View>
  );
}
