import { useId } from "react";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { brandGradient, buttonTokens } from "../constants/tokens";

export function AppGradientPlusIcon() {
  const id = `add-gradient-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return <Svg width={buttonTokens.floatingIconSize} height={buttonTokens.floatingIconSize} viewBox="0 0 24 24" pointerEvents="none" accessible={false} aria-hidden>
    <Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <Stop offset="0%" stopColor={brandGradient[0]} />
      <Stop offset="100%" stopColor={brandGradient[1]} />
    </LinearGradient></Defs>
    <Path d="M12 4V20M4 12H20" fill="none" stroke={`url(#${id})`} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>;
}
