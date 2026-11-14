import type { ComponentProps, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Image, Keyboard, Platform, StyleSheet, useWindowDimensions, type ImageSourcePropType } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Button } from "tamagui";
import { resolvePlatformAccessibilityProps } from "./buttonSystemModel";
import { buttonTokens, colors, navigationTokens } from "../constants/tokens";
import {
  buildBottomBarPath,
  getBottomNavigationFrame,
  getNavigationIconEmphasis,
  getBottomNavigationLayout,
  getBottomNavigationOverlayStyle,
  getBottomNavigationSelection,
} from "../navigation/bottomNavigationModel";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type ExpoTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

export type BottomNavigationQuickAction = {
  key: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

type BottomNavigationBarProps = ExpoTabBarProps & {
  fabAccessibilityLabel: string;
  fabAccessibilityHint: string;
  fabIcon: ImageSourcePropType;
  tabRouteNames?: readonly string[];
};

type NavigationTabProps = {
  focused: boolean;
  label: string;
  icon: ReactNode;
  iconOpacity: number;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
};

function NavigationTab({ focused, label, icon, iconOpacity, accessibilityLabel, onPress, onLongPress }: NavigationTabProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(iconOpacity);
  useEffect(() => {
    opacity.value = reducedMotion ? iconOpacity : withTiming(iconOpacity, {
      duration: navigationTokens.emphasisDuration,
      easing: Easing.out(Easing.quad),
    });
    return () => cancelAnimation(opacity);
  }, [iconOpacity, reducedMotion, opacity]);
  const emphasisStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Button
      unstyled
      role="tab"
      aria-label={accessibilityLabel ?? label}
      aria-selected={focused}
      {...resolvePlatformAccessibilityProps(Platform.OS, { selected: focused })}
      alignItems="center"
      justifyContent="center"
      flex={1}
      minWidth={48}
      minHeight={48}
      height="100%"
      padding={0}
      borderWidth={0}
      backgroundColor="transparent"
      outlineWidth={0}
      outlineStyle="none"
      cursor="pointer"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Animated.View pointerEvents="none" style={[styles.tabContent, emphasisStyle]}>
        {icon}
      </Animated.View>
    </Button>
  );
}

export function BottomNavigationBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  fabAccessibilityLabel,
  fabAccessibilityHint,
  fabIcon,
  tabRouteNames,
}: BottomNavigationBarProps) {
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const reducedMotion = useReducedMotion();
  const fabPressProgress = useSharedValue(0);
  const layout = getBottomNavigationLayout(dimensions.width, insets.bottom);
  const path = buildBottomBarPath(layout);
  const frame = getBottomNavigationFrame(layout);
  const fabLeft = (layout.width - layout.fabSize) / 2;
  const fabTop = layout.barTop - layout.fabSize / 2;
  const circleRadius = (layout.fabSize - 8 * layout.scale) / 2;
  const tabRoutes = tabRouteNames ? state.routes.filter((route) => tabRouteNames.includes(route.name)) : state.routes;
  const leftRoutes = tabRoutes.slice(0, 2);
  const rightRoutes = tabRoutes.slice(2, 4);
  const selectedTabIndex = tabRoutes.findIndex((route) => route.key === state.routes[state.index]?.key);
  const selection = getBottomNavigationSelection(layout, selectedTabIndex);
  const selectionFrame = selection ?? getBottomNavigationSelection(layout, 0)!;
  const selectionX = selection?.x;
  const selectionPosition = useSharedValue(selectionX ?? selectionFrame.x);
  const selectionOpacity = useSharedValue(selection ? 1 : 0);
  const previousSelection = useRef({ width: layout.width, visible: Boolean(selection) });

  useEffect(() => {
    const previous = previousSelection.current;
    const visible = selectionX !== undefined;
    const snap = reducedMotion || previous.width !== layout.width;
    if (visible) {
      selectionPosition.value = snap || !previous.visible ? selectionX : withTiming(selectionX, {
        duration: navigationTokens.selectionDuration,
        easing: Easing.out(Easing.cubic),
      });
    }
    selectionOpacity.value = snap ? Number(visible) : withTiming(Number(visible), {
      duration: navigationTokens.emphasisDuration,
    });
    previousSelection.current = { width: layout.width, visible };
  }, [selectionX, layout.width, reducedMotion, selectionPosition, selectionOpacity]);

  const selectionProps = useAnimatedProps(() => ({
    x: selectionPosition.value,
    fillOpacity: selectionOpacity.value,
  }));
  const fabPressStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: reducedMotion ? 0 : buttonTokens.pressOffset * fabPressProgress.value,
    }],
    shadowOffset: { width: 0, height: 3 - 2 * fabPressProgress.value },
    shadowRadius: 6 - 4 * fabPressProgress.value,
    shadowOpacity: 0.14 - 0.06 * fabPressProgress.value,
    ...(Platform.OS === "android" ? { elevation: 7 - 5 * fabPressProgress.value } : {}),
  }));
  const releaseFab = () => {
    fabPressProgress.value = reducedMotion ? 0 : withTiming(0, {
      duration: buttonTokens.interactionDuration,
      easing: Easing.out(Easing.quad),
    });
  };
  useEffect(() => () => {
    cancelAnimation(selectionPosition);
    cancelAnimation(selectionOpacity);
    cancelAnimation(fabPressProgress);
  }, [selectionPosition, selectionOpacity, fabPressProgress]);

  const renderRoutes = (routes: typeof state.routes) => routes.map((route) => {
    const routeIndex = state.routes.findIndex((candidate) => candidate.key === route.key);
    const focused = state.index === routeIndex;
    const options = descriptors[route.key].options;
    const label = typeof options.tabBarLabel === "string"
      ? options.tabBarLabel
      : options.title ?? route.name;
    const emphasis = getNavigationIconEmphasis(focused);
    const icon = options.tabBarIcon?.({ focused, color: colors.white, size: navigationTokens.tabIconSize * layout.scale });
    const handlePress = () => {
      const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };
    const handleLongPress = () => emitter.emit({ type: "tabLongPress", target: route.key });

    return (
      <NavigationTab
        key={route.key}
        focused={focused}
        label={label}
        icon={icon}
        iconOpacity={emphasis.opacity}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />
    );
  });

  const hideForKeyboard = descriptors[state.routes[state.index].key]?.options.tabBarHideOnKeyboard && keyboardVisible;
  if (hideForKeyboard) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.root, getBottomNavigationOverlayStyle(layout)]}>
      <Animated.View pointerEvents="box-none" style={[styles.barFrame, frame]}>
        <Svg pointerEvents="none" width={layout.width} height={layout.barTop + layout.barHeight} style={styles.barShape}>
          <Defs>
            <ClipPath id="bottom-navigation-clip"><Path d={path} /></ClipPath>
            <LinearGradient id="bottom-navigation-gradient" x1="0" y1="100%" x2="0" y2="0">
              <Stop offset="0" stopColor={colors.secondary} />
              <Stop offset="1" stopColor={colors.primary} />
            </LinearGradient>
          </Defs>
          <Path d={path} fill="rgba(0,0,0,0.08)" transform="translate(0 2)" />
          <Path d={path} fill="url(#bottom-navigation-gradient)" />
          <Path d={path} fill="rgba(217,217,217,0.15)" />
          <G clipPath="url(#bottom-navigation-clip)">
            <AnimatedRect
              animatedProps={selectionProps}
              y={selectionFrame.y}
              width={selectionFrame.width}
              height={selectionFrame.height}
              rx={selectionFrame.radius}
              fill={navigationTokens.selectionBackground}
            />
          </G>
        </Svg>

        <Animated.View style={[styles.tabGroup, {
          left: 0,
          top: layout.barTop,
          width: layout.width / 2 - layout.notchRadius,
          height: layout.barHeight,
        }]}>
          {renderRoutes(leftRoutes)}
        </Animated.View>
        <Animated.View style={[styles.tabGroup, {
          left: layout.width / 2 + layout.notchRadius,
          top: layout.barTop,
          width: layout.width / 2 - layout.notchRadius,
          height: layout.barHeight,
        }]}>
          {renderRoutes(rightRoutes)}
        </Animated.View>

        <Animated.View style={[styles.fabHalo, {
          left: fabLeft - layout.fabOutlineWidth,
          top: fabTop - layout.fabOutlineWidth,
          width: layout.fabSize + layout.fabOutlineWidth * 2,
          height: layout.fabSize + layout.fabOutlineWidth * 2,
          borderRadius: (layout.fabSize + layout.fabOutlineWidth * 2) / 2,
        }, fabPressStyle]}>
          <Button
            unstyled
            role="button"
            aria-label={fabAccessibilityLabel}
            accessibilityHint={fabAccessibilityHint}
            alignItems="center"
            justifyContent="center"
            position="relative"
            width={layout.fabSize}
            height={layout.fabSize}
            borderRadius={layout.fabSize / 2}
            borderWidth={0}
            padding={0}
            overflow="hidden"
            backgroundColor="transparent"
            outlineWidth={0}
            outlineStyle="none"
            cursor="pointer"
            onPressIn={() => {
              fabPressProgress.value = reducedMotion ? 1 : withTiming(1, {
                duration: buttonTokens.pressDuration,
                easing: Easing.out(Easing.quad),
              });
            }}
            onPressOut={releaseFab}
            onBlur={releaseFab}
          >
            <Svg pointerEvents="none" width={layout.fabSize} height={layout.fabSize} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="bottom-navigation-fab-gradient" x1="0" y1="100%" x2="0" y2="0">
                  <Stop offset="0" stopColor={colors.primary} />
                  <Stop offset="1" stopColor={colors.secondary} />
                </LinearGradient>
              </Defs>
              <Circle cx={layout.fabSize / 2} cy={layout.fabSize / 2} r={layout.fabSize / 2} fill="url(#bottom-navigation-fab-gradient)" />
              <Circle cx={layout.fabSize / 2} cy={layout.fabSize / 2} r={circleRadius} stroke="rgba(255,255,255,0.18)" strokeWidth={1} fill="none" />
            </Svg>
            <Image
              accessible={false}
              source={fabIcon}
              resizeMode="contain"
              fadeDuration={0}
              style={{ width: layout.fabSize * 0.48, height: layout.fabSize * 0.48, tintColor: colors.white }}
            />
          </Button>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "transparent",
    overflow: "visible",
    width: "100%",
    zIndex: 50,
  },
  barFrame: {
    bottom: 0,
    overflow: "visible",
    position: "absolute",
  },
  barShape: {
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  tabGroup: {
    flexDirection: "row",
    position: "absolute",
    zIndex: 3,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  fabHalo: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.78)",
    justifyContent: "center",
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 7,
    zIndex: 6,
  },
});
