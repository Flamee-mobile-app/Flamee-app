import { ImageOff } from "@tamagui/lucide-icons-2/icons/ImageOff";
import { Plus } from "@tamagui/lucide-icons-2/icons/Plus";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { useEffect, useState, type ReactNode } from "react";
import { Image, Platform } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Button, Text, XStack, YStack } from "tamagui";
import { memoryCalendarTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";
import { resolvePlatformAccessibilityProps } from "./buttonSystemModel";

/** Dense seven-column calendar control. Never expands hit areas over adjacent days. */
export function AppCalendarDay({ day, label, uri, today, future, unloaded = false, count, sticker, onPress, variant = "memory", selected = false, moodIcon, showDayNumber = false, progress }: {
  day: number; label: string; uri?: string | null; today: boolean; future: boolean;
  unloaded?: boolean; count: number; sticker?: ReactNode; onPress?: () => void;
  variant?: "memory" | "date" | "mood" | "progress"; selected?: boolean; moodIcon?: ReactNode; showDayNumber?: boolean;
  progress?: { value: number; total: number };
}) {
  const [failed, setFailed] = useState(false);
  const disabled = future || !onPress;
  const interaction = useButtonInteraction(disabled);
  const reducedMotion = useReducedMotion();
  const progressTotal = Math.max(1, Math.floor(progress?.total ?? 4));
  const progressValue = Math.max(0, Math.min(progressTotal, progress?.value ?? 0));
  const complete = !future && progressValue >= progressTotal;
  useEffect(() => setFailed(false), [uri]);
  const body = <YStack width="100%" height="100%" alignItems="center" justifyContent="center" pointerEvents="none">
    {variant === "progress" ? <YStack width="100%" height="100%" borderRadius={memoryCalendarTokens.cellRadius}
      backgroundColor={future ? "transparent" : complete ? "$calmSurface" : progressValue > 0 ? "$glassCardPeach" : "$surfaceMuted"}
      borderWidth={today || selected ? 1 : 0} borderColor={today || selected ? "$primary" : "transparent"}
      paddingHorizontal={memoryCalendarTokens.progressPadding} justifyContent="center" gap="$sm" opacity={future ? 0.4 : 1}>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight={today || complete ? "$bold" : "$medium"} color={complete ? "$calmText" : "$textPrimary"} textAlign="center">{day}</Text>
      {complete ? <YStack position="absolute" top={memoryCalendarTokens.progressPadding} right={memoryCalendarTokens.progressPadding}><Check size={memoryCalendarTokens.completionIconSize} color="$calmText" strokeWidth={2.5} /></YStack> : null}
      <XStack width="100%" gap={memoryCalendarTokens.progressGap} opacity={future ? 0 : 1}>
        {Array.from({ length: progressTotal }, (_, index) => <YStack key={index} flex={1} flexBasis={0} height={memoryCalendarTokens.progressHeight} borderRadius="$sm" backgroundColor={index < progressValue ? complete ? "$calmText" : "$primary" : "$border"} />)}
      </XStack>
    </YStack> : variant === "mood" ? <YStack width="100%" alignItems="center" justifyContent="center" gap={2}>
      {moodIcon ? <YStack width={memoryCalendarTokens.moodCircleSize} height={memoryCalendarTokens.moodCircleSize} borderRadius={memoryCalendarTokens.moodCircleSize / 2} borderWidth={selected || today ? 2 : 0} borderColor={selected ? "$primary" : "$secondary"} backgroundColor={selected ? "$accentSoft" : today ? "$supportPeachLight" : "$surfaceMuted"} alignItems="center" justifyContent="center" opacity={future ? 0.4 : 1}>
        {!future ? moodIcon : null}
      </YStack> : future ? <YStack width={memoryCalendarTokens.moodCircleSize} height={memoryCalendarTokens.moodCircleSize} borderRadius={memoryCalendarTokens.moodCircleSize / 2} backgroundColor="$surfaceMuted" opacity={0.42} />
        : <YStack width={memoryCalendarTokens.dotSize} height={memoryCalendarTokens.dotSize} borderRadius={memoryCalendarTokens.dotSize / 2} backgroundColor={today ? "$secondary" : "$border"} />}
      {showDayNumber ? <Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" fontWeight={selected ? "$bold" : "$medium"} color={selected ? "$accentText" : "$textSecondary"}>{day}</Text> : null}
    </YStack> : variant === "date" ? <YStack width="100%" height="100%" borderRadius={memoryCalendarTokens.cellRadius} backgroundColor={selected ? "$accentSoft" : "transparent"} borderWidth={today ? 1 : 0} borderColor={today ? "$accentText" : "transparent"} alignItems="center" justifyContent="center" gap="$xs" opacity={future ? 0.4 : 1}>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight={selected ? "$bold" : "$medium"} color={selected ? "$accentText" : "$textPrimary"}>{day}</Text>
      <YStack width={memoryCalendarTokens.dotSize} height={memoryCalendarTokens.dotSize} borderRadius={memoryCalendarTokens.dotSize / 2} backgroundColor="$border" />
    </YStack> : uri ? <YStack width="100%" aspectRatio={1} maxHeight={memoryCalendarTokens.cellHeight - 4} borderRadius={memoryCalendarTokens.cellRadius} overflow="hidden" backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center">
      {failed ? <ImageOff size={16} color="$textSecondary" /> : <Image source={{ uri }} resizeMode="cover" onError={() => setFailed(true)} style={{ width: "100%", height: "100%" }} accessible={false} />}
      <YStack position="absolute" left={2} bottom={2} minWidth={15} borderRadius={4} backgroundColor="$glassHeader" alignItems="center"><Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" color="$textPrimary">{day}</Text></YStack>
      {count > 1 ? <YStack position="absolute" right={2} top={2} borderRadius={4} backgroundColor="$glassHeader" paddingHorizontal={2}><Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" color="$textPrimary">{count}</Text></YStack> : null}
    </YStack> : today ? <YStack width="100%" aspectRatio={1} maxHeight={memoryCalendarTokens.cellHeight - 4} borderRadius={memoryCalendarTokens.cellRadius} borderWidth={1.5} borderColor="$secondary" backgroundColor="$supportPeachLight" alignItems="center" justifyContent="center"><Plus size={20} color="$accentText" strokeWidth={2} /></YStack>
      : future || unloaded ? <YStack width="100%" aspectRatio={1} maxHeight={memoryCalendarTokens.cellHeight - 4} borderRadius={memoryCalendarTokens.cellRadius} backgroundColor="$surfaceMuted" opacity={0.55} />
        : <YStack width={memoryCalendarTokens.dotSize} height={memoryCalendarTokens.dotSize} borderRadius={memoryCalendarTokens.dotSize / 2} backgroundColor="$border" />}
    {sticker ? <YStack position="absolute" right={-1} top={0} backgroundColor="$surface" borderRadius={8} padding={2}>{sticker}</YStack> : null}
  </YStack>;
  if (disabled) return <YStack height={memoryCalendarTokens.cellHeight} accessibilityLabel={label}>{body}</YStack>;
  return <Button unstyled width="100%" height={memoryCalendarTokens.cellHeight} padding={0} borderWidth={0} outlineWidth={0} backgroundColor="transparent" borderRadius={memoryCalendarTokens.cellRadius}
    role="button" aria-label={label} {...(variant !== "memory" ? { "aria-pressed": selected } : {})} {...resolvePlatformAccessibilityProps(Platform.OS, { disabled: false, ...(variant !== "memory" ? { selected } : {}) })}
    {...interaction} transform={[{ translateY: 0 }]} transition={reducedMotion ? undefined : interaction.transition} animateOnly={["transform"]}
    pressStyle={{ transform: [{ translateY: reducedMotion ? 0 : 1 }] }} focusStyle={{ outlineWidth: 0 }} focusVisibleStyle={{ outlineWidth: 0 }} onPress={onPress}>{body}</Button>;
}
