import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { colors } from "../../../shared/constants/tokens";
import type { InviteGift } from "../types";

type MascotGift = Extract<InviteGift, { kind: "mascot" }>["gift"];

// Static vector gift artwork; no animation, fake media URI or external asset.
export function FlameeMascot({ gift = "heart", size = 120 }: { gift?: MascotGift; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 120 120" aria-hidden={true}>
    <Ellipse cx={60} cy={111} rx={31} ry={5} fill={colors.supportPeach} />
    <Path d="M63 6 C42 26 23 37 25 66 C26 92 42 108 62 108 C86 108 101 90 97 66 C96 52 90 41 83 33 C83 48 72 53 66 44 C61 35 61 22 63 6Z" fill={colors.primary} />
    <Path d="M57 31 C42 46 34 58 36 72 C40 61 48 55 59 51 C55 46 54 39 57 31Z" fill={colors.secondary} />
    <Circle cx={47} cy={67} r={3} fill={colors.textPrimary} /><Circle cx={74} cy={67} r={3} fill={colors.textPrimary} />
    <Ellipse cx={39} cy={76} rx={6} ry={3} fill={colors.supportCoral} /><Ellipse cx={83} cy={76} rx={6} ry={3} fill={colors.supportCoral} />
    <Path d="M55 75 Q61 81 67 75" fill="none" stroke={colors.textPrimary} strokeWidth={2} strokeLinecap="round" />
    {gift === "flower" ? <>
      <Path d="M62 97 L62 88" stroke={colors.success} strokeWidth={3} />
      {[0, 1, 2, 3, 4].map((value) => <Ellipse key={value} cx={62} cy={81} rx={4} ry={8} fill={colors.supportLavender} rotation={value * 72} origin="62,88" />)}
      <Circle cx={62} cy={88} r={4} fill={colors.secondary} />
    </> : <Path d="M61 100 L48 89 C38 78 54 74 61 83 C68 74 84 78 74 89Z" fill={gift === "hug" ? colors.supportLavenderLight : colors.white} />}
    <Path d="M36 87 Q44 94 51 90 M87 87 Q79 94 72 90" stroke={colors.secondary} strokeWidth={7} fill="none" strokeLinecap="round" />
  </Svg>;
}
