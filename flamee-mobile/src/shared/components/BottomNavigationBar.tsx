import type { ComponentProps, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, useWindowDimensions, type ImageSourcePropType } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { Text } from "tamagui";
import { colors, navigationTokens } from "../constants/tokens";
import {
  buildBottomBarPath,
  getBottomNavigationFrame,
  getNavigationIconEmphasis,
  getBottomNavigationLayout,
  getBottomNavigationOverlayStyle,
  getRadialMenuPositions,
  resolveFabPress,
  type RadialMenuPosition,
} from "../navigation/bottomNavigationModel";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const LONG_PRESS_DURATION = 350;

type ExpoTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

export type BottomNavigationQuickAction = {
  key: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

type BottomNavigationBarProps = ExpoTabBarProps & {
  closeMenuAccessibilityLabel: string;
  fabAccessibilityLabel: string;
  fabAccessibilityHint: string;
  fabIcon: ImageSourcePropType;
  fabSelected?: boolean;
  onFabPress: () => void;
  quickActions: BottomNavigationQuickAction[];
  tabRouteNames?: readonly string[];
};

type NavigationTabProps = {
  focused: boolean;
  label: string;
  icon: ReactNode;
  iconOpacity: number;
  scale: number;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
};

function NavigationTab({ focused, label, icon, iconOpacity, scale, accessibilityLabel, onPress, onLongPress }: NavigationTabProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabPressable}
    >
      <Animated.View style={styles.tabContent}>
        <Animated.View style={{ opacity: iconOpacity }}>{icon}</Animated.View>
        <Text color={colors.white} fontFamily="$body" fontSize={Math.max(10, 11 * scale)} lineHeight={Math.max(14, 15 * scale)} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

type RadialActionProps = {
  action: BottomNavigationQuickAction;
  position: RadialMenuPosition;
  progress: SharedValue<number>;
  size: number;
  centerX: number;
  centerY: number;
  enabled: boolean;
  onSelect: () => void;
};

function RadialAction({ action, position, progress, size, centerX, centerY, enabled, onSelect }: RadialActionProps) {
  const containerWidth = size + 64;
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: position.x * progress.value },
      { translateY: position.y * progress.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={enabled ? "auto" : "none"}
      style={[styles.radialActionContainer, {
        width: containerWidth,
        left: centerX - containerWidth / 2,
        top: centerY - size / 2,
      }, style]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={onSelect}
        style={({ pressed }) => [
          styles.radialActionButton,
          { width: size, height: size, borderRadius: size / 2, opacity: pressed ? 0.82 : 1 },
        ]}
      >
        {action.icon}
      </Pressable>
      <Text
        backgroundColor={navigationTokens.badgeBackground}
        borderColor={navigationTokens.badgeBorder}
        borderWidth={1}
        borderRadius="$sm"
        color={navigationTokens.badgeText}
        fontFamily="$body"
        fontSize="$bodyS"
        lineHeight="$bodyS"
        marginTop="$xs"
        numberOfLines={1}
        paddingHorizontal="$sm"
        paddingVertical="$xs"
      >
        {action.label}
      </Text>
    </Animated.View>
  );
}

export function BottomNavigationBar({
  state,
  descriptors,
  navigation,
  closeMenuAccessibilityLabel,
  fabAccessibilityLabel,
  fabAccessibilityHint,
  fabIcon,
  fabSelected = false,
  onFabPress,
  quickActions,
  tabRouteNames,
}: BottomNavigationBarProps) {
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressOpened = useRef(false);
  const holdProgress = useSharedValue(0);
  const menuProgress = useSharedValue(0);
  const fabPressProgress = useSharedValue(0);
  const layout = getBottomNavigationLayout(dimensions.width, insets.bottom);
  const path = buildBottomBarPath(layout);
  const frame = getBottomNavigationFrame(layout);
  const radialPositions = getRadialMenuPositions(quickActions.length, layout.radialRadius);
  const fabLeft = (layout.width - layout.fabSize) / 2;
  const fabTop = layout.barTop - layout.fabSize / 2;
  const fabCenterX = layout.width / 2;
  const fabCenterY = layout.barTop;
  const actionSize = 48;
  const circleRadius = (layout.fabSize - 8 * layout.scale) / 2;
  const circleLength = Math.PI * 2 * circleRadius;
  const tabRoutes = tabRouteNames ? state.routes.filter((route) => tabRouteNames.includes(route.name)) : state.routes;
  const leftRoutes = tabRoutes.slice(0, 2);
  const rightRoutes = tabRoutes.slice(2, 4);

  const closeMenu = () => {
    setMenuOpen(false);
    menuProgress.value = reducedMotion ? 0 : withTiming(0, {
      duration: navigationTokens.menuCloseDuration,
      easing: Easing.in(Easing.quad),
    });
  };

  const openMenu = () => {
    if (quickActions.length === 0) return;
    longPressOpened.current = true;
    cancelAnimation(fabPressProgress);
    fabPressProgress.value = 0;
    setMenuOpen(true);
    menuProgress.value = reducedMotion ? 1 : withTiming(1, {
      duration: navigationTokens.menuOpenDuration,
      easing: Easing.out(Easing.cubic),
    });
  };

  const holdRingProps = useAnimatedProps(() => ({
    strokeDashoffset: circleLength * (1 - holdProgress.value),
  }));
  const fabPressStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: reducedMotion ? 0 : -navigationTokens.fabPressLift * layout.scale * fabPressProgress.value,
    }],
  }));
  const fabHighlightStyle = useAnimatedStyle(() => ({
    opacity: navigationTokens.fabPressHighlightOpacity * fabPressProgress.value,
  }));
  useEffect(() => () => {
    cancelAnimation(holdProgress);
    cancelAnimation(menuProgress);
    cancelAnimation(fabPressProgress);
  }, [holdProgress, menuProgress, fabPressProgress]);

  const renderRoutes = (routes: typeof state.routes) => routes.map((route) => {
    const routeIndex = state.routes.findIndex((candidate) => candidate.key === route.key);
    const focused = state.index === routeIndex;
    const options = descriptors[route.key].options;
    const label = typeof options.tabBarLabel === "string"
      ? options.tabBarLabel
      : options.title ?? route.name;
    const emphasis = getNavigationIconEmphasis(focused);
    const icon = options.tabBarIcon?.({ focused, color: colors.white, size: 21 * layout.scale });
    const handlePress = () => {
      closeMenu();
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };
    const handleLongPress = () => navigation.emit({ type: "tabLongPress", target: route.key });

    return (
      <NavigationTab
        key={route.key}
        focused={focused}
        label={label}
        icon={icon}
        iconOpacity={emphasis.opacity}
        scale={layout.scale}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />
    );
  });

  return (
    <Animated.View pointerEvents="box-none" style={[styles.root, getBottomNavigationOverlayStyle(layout)]}>
      <Animated.View pointerEvents="box-none" style={[styles.barFrame, frame]}>
        {menuOpen ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeMenuAccessibilityLabel}
            onPress={closeMenu}
            style={[styles.backdrop, {
              bottom: -layout.bottomInset,
              height: dimensions.height,
              left: -layout.horizontalInset,
              width: dimensions.width,
            }]}
          />
        ) : null}

        <Svg pointerEvents="none" width={layout.width} height={layout.barTop + layout.barHeight} style={styles.barShape}>
          <Defs>
            <LinearGradient id="bottom-navigation-gradient" x1="0" y1="100%" x2="0" y2="0">
              <Stop offset="0" stopColor={colors.secondary} />
              <Stop offset="1" stopColor={colors.primary} />
            </LinearGradient>
          </Defs>
          <Path d={path} fill="rgba(0,0,0,0.08)" transform="translate(0 2)" />
          <Path d={path} fill="url(#bottom-navigation-gradient)" />
          <Path d={path} fill="rgba(217,217,217,0.15)" />
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

        {quickActions.map((action, index) => (
          <RadialAction
            key={action.key}
            action={action}
            position={radialPositions[index]}
            progress={menuProgress}
            size={actionSize}
            centerX={fabCenterX}
            centerY={fabCenterY}
            enabled={menuOpen}
            onSelect={() => {
              closeMenu();
              action.onPress();
            }}
          />
        ))}

        <Animated.View style={[styles.fabHalo, {
          left: fabLeft - layout.fabOutlineWidth,
          top: fabTop - layout.fabOutlineWidth,
          width: layout.fabSize + layout.fabOutlineWidth * 2,
          height: layout.fabSize + layout.fabOutlineWidth * 2,
          borderRadius: (layout.fabSize + layout.fabOutlineWidth * 2) / 2,
        }, fabPressStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fabAccessibilityLabel}
            accessibilityHint={fabAccessibilityHint}
            accessibilityState={{ expanded: menuOpen, selected: fabSelected }}
            delayLongPress={LONG_PRESS_DURATION}
            onPressIn={() => {
              longPressOpened.current = false;
              cancelAnimation(fabPressProgress);
              fabPressProgress.value = reducedMotion ? 1 : withSequence(
                withTiming(1, {
                  duration: navigationTokens.fabPressRiseDuration,
                  easing: Easing.out(Easing.quad),
                }),
                withTiming(0, {
                  duration: navigationTokens.fabPressSettleDuration,
                  easing: Easing.inOut(Easing.quad),
                }),
              );
              holdProgress.value = reducedMotion ? 0 : withTiming(1, { duration: LONG_PRESS_DURATION });
            }}
            onPressOut={() => {
              cancelAnimation(holdProgress);
              if (reducedMotion) fabPressProgress.value = 0;
              holdProgress.value = reducedMotion ? 0 : withTiming(0, { duration: 120 });
            }}
            onLongPress={openMenu}
            onPress={() => {
              if (resolveFabPress(longPressOpened.current) === "radial-menu") return;
              if (menuOpen) closeMenu();
              else onFabPress();
            }}
            style={[styles.fabPressable, {
              width: layout.fabSize,
              height: layout.fabSize,
              borderRadius: layout.fabSize / 2,
            }]}
          >
            <Svg pointerEvents="none" width={layout.fabSize} height={layout.fabSize} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="bottom-navigation-fab-gradient" x1="0" y1="100%" x2="0" y2="0">
                  <Stop offset="0" stopColor={colors.primary} />
                  <Stop offset="1" stopColor={colors.secondary} />
                </LinearGradient>
              </Defs>
              <Circle cx={layout.fabSize / 2} cy={layout.fabSize / 2} r={layout.fabSize / 2} fill="url(#bottom-navigation-fab-gradient)" />
              <Circle cx={layout.fabSize / 2} cy={layout.fabSize / 2} r={circleRadius} stroke={fabSelected ? colors.white : "rgba(255,255,255,0.18)"} strokeWidth={fabSelected ? 2 : 1} fill="none" />
              <AnimatedCircle
                animatedProps={holdRingProps}
                cx={layout.fabSize / 2}
                cy={layout.fabSize / 2}
                r={circleRadius}
                stroke={colors.white}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={`${circleLength} ${circleLength}`}
                fill="none"
                transform={`rotate(-90 ${layout.fabSize / 2} ${layout.fabSize / 2})`}
              />
            </Svg>
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.white }, fabHighlightStyle]}
            />
            <Image
              accessible={false}
              source={fabIcon}
              resizeMode="contain"
              fadeDuration={0}
              style={{ width: layout.fabSize * 0.48, height: layout.fabSize * 0.48, tintColor: colors.white }}
            />
          </Pressable>
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
  backdrop: {
    backgroundColor: "rgba(43,43,43,0.06)",
    position: "absolute",
    zIndex: 1,
  },
  tabGroup: {
    flexDirection: "row",
    position: "absolute",
    zIndex: 3,
  },
  tabPressable: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  tabContent: {
    alignItems: "center",
    gap: 2,
    justifyContent: "center",
    minWidth: 52,
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
  fabPressable: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  radialActionContainer: {
    alignItems: "center",
    position: "absolute",
    zIndex: 5,
  },
  radialActionButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: "rgba(255,255,255,0.72)",
    borderWidth: 2,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 8,
  },
});
