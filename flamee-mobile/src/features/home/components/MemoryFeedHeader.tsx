import { AppGradientText } from "../../../shared/components";
import { Bell } from "@tamagui/lucide-icons-2/icons/Bell";
import { ChevronDown } from "@tamagui/lucide-icons-2/icons/ChevronDown";
import { X } from "@tamagui/lucide-icons-2/icons/X";
import { ArrowLeft } from "@tamagui/lucide-icons-2/icons/ArrowLeft";
import { useCallback, useEffect, useReducer, useRef, type ComponentRef } from "react";
import { BackHandler, Platform, StyleSheet, Text as NativeText } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Text, XStack, YStack, type TamaguiElement } from "tamagui";
import { AppHeaderPill, AppIconButton, AppTextButton } from "../../../shared/components";
import { buttonTokens, liquidHeaderTokens, memoryFeedTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import type { AppHeaderAction, AppHeaderMenuItem } from "../../../shared/navigation/appHeaderContext";
import { initialQuickMenuPresence, quickMenuPresenceReducer } from "../quickMenuPresence";

export function MemoryFeedHeader({ title, menuItems = [], activeMenuId, onMenuSelect, leftAction, onNotifications, onBack, topInset, compact }: {
  title: string;
  menuItems?: readonly AppHeaderMenuItem[];
  activeMenuId?: string;
  onMenuSelect?: (id: string) => void;
  leftAction?: AppHeaderAction;
  onNotifications?: () => void;
  onBack?: () => void;
  topInset: number;
  compact: boolean;
}) {
  const activeTitle = title;
  const hasMenu = menuItems.length > 0 && !!onMenuSelect;
  const [presence, dispatch] = useReducer(quickMenuPresenceReducer, initialQuickMenuPresence);
  const expanded = presence.open;
  const latestPresence = useRef(presence);
  latestPresence.current = presence;
  const focused = useRef(true);
  const progress = useSharedValue(0);
  const collapse = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const trigger = useRef<TamaguiElement | null>(null);
  const menuHeading = useRef<ComponentRef<typeof NativeText> | null>(null);
  const close = useCallback(() => dispatch({ type: "close" }), []);
  const finishClose = useCallback((revision: number) => {
    if (!focused.current || !latestPresence.current.mounted || latestPresence.current.open || latestPresence.current.revision !== revision) return;
    dispatch({ type: "closed", revision });
    requestAnimationFrame(() => { if (focused.current && !latestPresence.current.open) trigger.current?.focus?.(); });
  }, []);
  const choose = (next: string) => { onMenuSelect?.(next); close(); };

  useEffect(() => {
    const target = Number(expanded);
    const revision = presence.revision;
    if (reducedMotion) {
      progress.value = target;
      if (!expanded && presence.mounted) finishClose(revision);
    } else {
      progress.value = withTiming(target, { duration: memoryFeedTokens.headerTransition, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished && target === 0) scheduleOnRN(finishClose, revision);
      });
    }
    return () => cancelAnimation(progress);
  }, [expanded, presence.revision, reducedMotion, progress, finishClose]);
  useEffect(() => {
    const target = Number(compact && !expanded);
    collapse.value = reducedMotion ? target : withTiming(target, { duration: memoryFeedTokens.headerScrollTransition, easing: Easing.inOut(Easing.cubic) });
  }, [expanded, compact, reducedMotion, collapse]);
  useEffect(() => {
    focused.current = true;
    return () => { focused.current = false; cancelAnimation(progress); progress.value = 0; };
  }, [progress]);
  useEffect(() => {
    if (!expanded) return;
    const frame = requestAnimationFrame(() => menuHeading.current?.focus?.());
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => { close(); return true; });
    return () => { cancelAnimationFrame(frame); subscription.remove(); };
  }, [expanded, close]);

  const shape = useAnimatedStyle(() => ({
    height: memoryFeedTokens.headerHeight - (memoryFeedTokens.headerHeight - memoryFeedTokens.compactHeaderHeight) * collapse.value + (memoryFeedTokens.expandedHeaderHeight - memoryFeedTokens.headerHeight) * progress.value,
    borderRadius: liquidHeaderTokens.radius + (liquidHeaderTokens.expandedRadius - liquidHeaderTokens.radius) * progress.value,
  }));
  const surfaceShape = useAnimatedStyle(() => ({
    borderRadius: liquidHeaderTokens.radius + (liquidHeaderTokens.expandedRadius - liquidHeaderTokens.radius) * progress.value,
  }));
  const rowShape = useAnimatedStyle(() => ({ height: memoryFeedTokens.headerHeight - (memoryFeedTokens.headerHeight - memoryFeedTokens.compactHeaderHeight) * collapse.value }));
  const compactStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value, transform: [{ translateY: -6 * progress.value }] }));
  const menuStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: -6 * (1 - progress.value) }] }));

  return <Animated.View style={[styles.shell, { top: topInset + liquidHeaderTokens.topGap }, shape]}>
    <Animated.View style={[StyleSheet.absoluteFill, styles.surface, surfaceShape]}>
      <AppHeaderPill embedded>
      <YStack onKeyDown={(event) => { if (event.key === "Escape" && expanded) { event.preventDefault(); close(); } }}>
      <Animated.View pointerEvents={expanded ? "none" : "auto"} aria-hidden={expanded} {...(Platform.OS !== "web" ? { accessibilityElementsHidden: expanded, importantForAccessibility: expanded ? "no-hide-descendants" as const : "auto" as const } : {})} style={[rowShape, compactStyle]}>
        <XStack height="100%" alignItems="center" paddingHorizontal="$sm">
          {onBack ? <AppIconButton tone="plain" disabled={expanded} accessibilityLabel={getMessage("vi", "back")} icon={<ArrowLeft size={22} color="$textPrimary" />} onPress={onBack} />
            : leftAction ? <AppIconButton testID={leftAction.testID} tone="plain" disabled={expanded} accessibilityLabel={leftAction.label} icon={leftAction.icon} onPress={leftAction.onPress} />
              : <YStack width={buttonTokens.iconButtonSize} />}
          <YStack flex={1} minWidth={0} alignItems="stretch">
            {hasMenu ? <AppTextButton testID="home-view-selector" buttonRef={trigger} disabled={expanded} expanded={expanded} controls="home-view-menu" accessibilityLabel={`${activeTitle}. ${getMessage("vi", "memoryFeedViewMenu")}`} onPress={() => dispatch({ type: "open" })} iconAfter={<ChevronDown size={15} strokeWidth={2} color="$textSecondary" />}>
              <AppGradientText flex={1} align="center" role="heading" aria-level={1} fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$bold" color="$accentText" numberOfLines={1}>{activeTitle}</AppGradientText>
            </AppTextButton> : <AppGradientText role="heading" aria-level={1} size="h5" weight="bold" align="center">{activeTitle}</AppGradientText>}
          </YStack>
          {onNotifications ? <AppIconButton testID="home-notifications" tone="plain" disabled={expanded} accessibilityLabel={getMessage("vi", "memoryFeedNotifications")} icon={<Bell size={22} strokeWidth={1.9} color="$textPrimary" />} onPress={onNotifications} /> : <YStack width={buttonTokens.iconButtonSize} />}
        </XStack>
      </Animated.View>
      {presence.mounted ? <Animated.View pointerEvents={expanded ? "auto" : "none"} aria-hidden={!expanded} {...(Platform.OS !== "web" ? { accessibilityElementsHidden: !expanded, importantForAccessibility: expanded ? "auto" as const : "no-hide-descendants" as const } : {})} style={[{ position: "absolute", top: 0, left: 0, right: 0 }, menuStyle]}>
        <YStack id="home-view-menu" role="region" aria-label={getMessage("vi", "memoryFeedViewMenu")} paddingHorizontal="$lg" paddingBottom="$md">
          <XStack height={memoryFeedTokens.headerHeight} alignItems="center" justifyContent="space-between">
            <AppGradientText textRef={menuHeading} role="heading" aria-level={2} tabIndex={-1} fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$bold" color="$accentText">{getMessage("vi", "memoryFeaturesTitle")}</AppGradientText>
            <AppIconButton testID="home-close-view-menu" tone="plain" disabled={!expanded} accessibilityLabel={getMessage("vi", "memoryFeedCloseMenu")} icon={<X size={20} strokeWidth={2} color="$textPrimary" />} onPress={close} />
          </XStack>
          <XStack role="toolbar" aria-label={getMessage("vi", "memoryFeedViewMenu")} gap="$xs" justifyContent="space-between" paddingVertical="$xs">
            {menuItems.map((feature) => {
              return <AppIconButton key={feature.id} testID={`home-${feature.id}-view`} selected={feature.id === activeMenuId} disabled={!expanded}
                accessibilityLabel={feature.label} icon={feature.icon}
                onPress={() => choose(feature.id)} />;
            })}
          </XStack>
        </YStack>
      </Animated.View> : null}
      </YStack>
      </AppHeaderPill>
    </Animated.View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: liquidHeaderTokens.inset,
    right: liquidHeaderTokens.inset,
    zIndex: 20,
    shadowColor: liquidHeaderTokens.shadow.shadowColor,
    shadowOffset: liquidHeaderTokens.shadow.shadowOffset,
    shadowOpacity: liquidHeaderTokens.shadow.shadowOpacity,
    shadowRadius: liquidHeaderTokens.shadow.shadowRadius,
    elevation: Platform.OS === "android" ? liquidHeaderTokens.shadow.elevation : undefined,
  },
  surface: { overflow: "hidden" },
});
