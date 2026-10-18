import { Bell } from "@tamagui/lucide-icons-2/icons/Bell";
import { Bookmark } from "@tamagui/lucide-icons-2/icons/Bookmark";
import { ChevronDown } from "@tamagui/lucide-icons-2/icons/ChevronDown";
import { Plus } from "@tamagui/lucide-icons-2/icons/Plus";
import { X } from "@tamagui/lucide-icons-2/icons/X";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { BackHandler, Platform, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { Text, XStack, YStack, type TamaguiElement } from "tamagui";
import { AppGlassBackdrop, AppIconButton, AppMenuRow, AppTextButton, type AppBlurTargetView } from "../../../shared/components";
import { memoryFeedTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import type { MemoryFeedView } from "../memoryFeedModel";

export function MemoryFeedHeader({ blurTarget, view, onViewChange, onAdd, onNotifications, topInset, hidden }: {
  blurTarget: RefObject<AppBlurTargetView | null>;
  view: MemoryFeedView;
  onViewChange: (view: MemoryFeedView) => void;
  onAdd: () => void;
  onNotifications: () => void;
  topInset: number;
  hidden: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const progress = useSharedValue(0);
  const visibility = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const trigger = useRef<TamaguiElement | null>(null);
  const menuHeading = useRef<TamaguiElement | null>(null);
  const restoreFocus = () => requestAnimationFrame(() => trigger.current?.focus?.());
  const close = useCallback(() => { setExpanded(false); requestAnimationFrame(() => trigger.current?.focus?.()); }, []);
  const choose = (next: MemoryFeedView) => { onViewChange(next); setExpanded(false); restoreFocus(); };

  useEffect(() => {
    progress.value = reducedMotion ? Number(expanded) : withTiming(Number(expanded), { duration: memoryFeedTokens.headerTransition, easing: Easing.out(Easing.cubic) });
  }, [expanded, reducedMotion, progress]);
  useEffect(() => {
    const offset = hidden && !expanded ? -(topInset + memoryFeedTokens.headerHeight + 8) : 0;
    visibility.value = reducedMotion ? offset : withTiming(offset, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, [expanded, hidden, reducedMotion, topInset, visibility]);
  useFocusEffect(useCallback(() => () => setExpanded(false), []));
  useEffect(() => {
    if (!expanded) return;
    const frame = requestAnimationFrame(() => menuHeading.current?.focus?.());
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => { close(); return true; });
    return () => { cancelAnimationFrame(frame); subscription.remove(); };
  }, [expanded, close]);

  const shape = useAnimatedStyle(() => ({
    height: topInset + memoryFeedTokens.headerHeight + (memoryFeedTokens.expandedHeaderHeight - memoryFeedTokens.headerHeight) * progress.value,
    borderBottomLeftRadius: memoryFeedTokens.expandedHeaderRadius * progress.value,
    borderBottomRightRadius: memoryFeedTokens.expandedHeaderRadius * progress.value,
  }));
  const surfaceShape = useAnimatedStyle(() => ({
    borderBottomLeftRadius: memoryFeedTokens.expandedHeaderRadius * progress.value,
    borderBottomRightRadius: memoryFeedTokens.expandedHeaderRadius * progress.value,
  }));
  const visibilityStyle = useAnimatedStyle(() => ({ transform: [{ translateY: visibility.value }] }));
  const compactStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value, transform: [{ translateY: -6 * progress.value }] }));
  const menuStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: -6 * (1 - progress.value) }] }));

  return <Animated.View style={[styles.shell, shape, visibilityStyle]}>
    <Animated.View style={[StyleSheet.absoluteFill, styles.surface, surfaceShape]}>
      <AppGlassBackdrop blurTarget={blurTarget} tone="header" />
      <YStack position="absolute" left={0} right={0} bottom={0} height={1} backgroundColor="$textPrimary" opacity={0.14} pointerEvents="none" />
      <YStack paddingTop={topInset} onKeyDown={(event) => { if (event.key === "Escape" && expanded) { event.preventDefault(); close(); } }}>
      <Animated.View pointerEvents={expanded ? "none" : "auto"} aria-hidden={expanded} {...(Platform.OS !== "web" ? { accessibilityElementsHidden: expanded, importantForAccessibility: expanded ? "no-hide-descendants" as const : "auto" as const } : {})} style={[{ height: memoryFeedTokens.headerHeight }, compactStyle]}>
        <XStack height={memoryFeedTokens.headerHeight} alignItems="center" paddingHorizontal="$sm">
          <AppIconButton testID="home-add-memory" tone="plain" disabled={expanded} accessibilityLabel={getMessage("vi", "memoryFeedAdd")} icon={<Plus size={memoryFeedTokens.iconSize} strokeWidth={2} color="$textPrimary" />} onPress={onAdd} />
          <YStack flex={1} minWidth={0} alignItems="center">
            <AppTextButton testID="home-view-selector" buttonRef={trigger} disabled={expanded} expanded={expanded} controls="home-view-menu" accessibilityLabel={getMessage("vi", "memoryFeedViewMenu")} onPress={() => setExpanded(true)} iconAfter={<ChevronDown size={15} strokeWidth={2} color="$textSecondary" />}>
              <Text role="heading" aria-level={1} fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$bold" color="$textPrimary" numberOfLines={1}>{getMessage("vi", view === "timeline" ? "timelineFeed" : "timelineMemories")}</Text>
            </AppTextButton>
          </YStack>
          <AppIconButton testID="home-notifications" tone="plain" disabled={expanded} accessibilityLabel={getMessage("vi", "memoryFeedNotifications")} icon={<Bell size={22} strokeWidth={1.9} color="$textPrimary" />} onPress={onNotifications} />
        </XStack>
      </Animated.View>
      {expanded ? <Animated.View style={[{ position: "absolute", top: topInset, left: 0, right: 0 }, menuStyle]}>
        <YStack id="home-view-menu" role="region" aria-label={getMessage("vi", "memoryFeedViewMenu")} paddingHorizontal="$lg" paddingBottom="$md">
          <XStack height={memoryFeedTokens.headerHeight} alignItems="center" justifyContent="space-between">
            <AppTextButton buttonRef={menuHeading} accessibilityLabel={getMessage("vi", "timelineFeed")} onPress={() => choose("timeline")}><Text fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$bold" color="$textPrimary">{getMessage("vi", "timelineFeed")}</Text></AppTextButton>
            <AppIconButton testID="home-close-view-menu" tone="plain" accessibilityLabel={getMessage("vi", "memoryFeedCloseMenu")} icon={<X size={20} strokeWidth={2} color="$textPrimary" />} onPress={close} />
          </XStack>
          <AppMenuRow testID="home-memories-view" label={getMessage("vi", "timelineMemories")} icon={<YStack width={34} height={34} borderRadius="$xl" backgroundColor="$accentSoft" alignItems="center" justifyContent="center"><Bookmark size={19} strokeWidth={2} color="$accentText" /></YStack>} onPress={() => choose("memories")} />
        </YStack>
      </Animated.View> : null}
      </YStack>
    </Animated.View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    shadowColor: "#302924",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 7,
  },
  surface: { overflow: "hidden" },
});
