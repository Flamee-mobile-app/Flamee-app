import { SvgXml } from "react-native-svg";
import { CalendarDays } from "@tamagui/lucide-icons-2/icons/CalendarDays";
import { navigationTokens } from "../constants/tokens";
import { bottomNavigationIcons, getBottomNavigationIconXml } from "./icons/bottomNavigationIcons";

type BottomNavigationIconProps = {
  name: keyof typeof bottomNavigationIcons | "memories";
  focused: boolean;
  size: number;
};

export function BottomNavigationIcon({ name, focused, size }: BottomNavigationIconProps) {
  const color = focused ? navigationTokens.activeIconColor : navigationTokens.inactiveIconColor;
  if (name === "memories") return <CalendarDays size={size} color={color} strokeWidth={focused ? 2.8 : 1.8} accessible={false} aria-hidden pointerEvents="none" />;
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
