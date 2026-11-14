import { SvgXml } from "react-native-svg";
import { navigationTokens } from "../constants/tokens";
import { bottomNavigationIcons, getBottomNavigationIconXml } from "./icons/bottomNavigationIcons";

type BottomNavigationIconProps = {
  name: keyof typeof bottomNavigationIcons;
  focused: boolean;
  size: number;
};

export function BottomNavigationIcon({ name, focused, size }: BottomNavigationIconProps) {
  const color = focused ? navigationTokens.activeIconColor : navigationTokens.inactiveIconColor;
  return (
    <SvgXml
      xml={getBottomNavigationIconXml(name, focused)}
      width={size}
      height={size}
      color={color}
      fill={color}
      accessible={false}
      aria-hidden
      pointerEvents="none"
    />
  );
}
