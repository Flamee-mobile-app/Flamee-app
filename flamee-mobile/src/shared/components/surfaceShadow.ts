import { colors } from "../constants/tokens.ts";

type SurfaceShadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation?: number;
};

/** Android elevation can show through translucent surfaces. Outset box shadows
 * clip out the surface interior and keep opacity independent from elevation. */
export function resolveSurfaceShadow<Shadow extends SurfaceShadow>(platform: string, shadow: Shadow) {
  const { shadowColor, shadowOffset, shadowOpacity, shadowRadius } = shadow;
  const legacy = { shadowColor: shadowColor as Shadow["shadowColor"], shadowOffset, shadowOpacity, shadowRadius };
  if (platform !== "android") return legacy;
  if (shadow.shadowOpacity <= 0) return { boxShadow: "none" };
  const color = shadow.shadowColor.startsWith("$")
    ? colors[shadow.shadowColor.slice(1) as keyof typeof colors]
    : shadow.shadowColor;
  const channels = color.slice(1).match(/../g)!.slice(0, 3).map((part) => parseInt(part, 16));
  const rgba = `rgba(${channels.join(",")},${shadow.shadowOpacity})`;
  // RN shadowRadius is a Gaussian sigma; CSS blur radius is twice that value.
  return { boxShadow: `${shadow.shadowOffset.width}px ${shadow.shadowOffset.height}px ${shadow.shadowRadius * 2}px ${rgba}` };
}
