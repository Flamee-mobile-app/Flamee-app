import { CircleAlert } from "@tamagui/lucide-icons-2/icons/CircleAlert";
import { CircleCheck } from "@tamagui/lucide-icons-2/icons/CircleCheck";
import { Info } from "@tamagui/lucide-icons-2/icons/Info";
import { LoaderCircle } from "@tamagui/lucide-icons-2/icons/LoaderCircle";
import { TriangleAlert } from "@tamagui/lucide-icons-2/icons/TriangleAlert";
import { Toast, ToastProvider, ToastViewport } from "@tamagui/toast";
import { useEffect, useRef, useSyncExternalStore, type PropsWithChildren } from "react";
import { Animated, Easing, Platform, useWindowDimensions } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";
import { XStack, YStack } from "tamagui";
import { liquidHeaderTokens, memoryFeedTokens, spacing, toastTokens } from "../constants/tokens";
import { getMessage } from "../localization/messages";
import { getAppToastPresentation, type AppToastTone } from "./appToastModel";
import { createAppToastState, type AppToastMessage, type AppToastOptions } from "./appToastState";

const notifications = createAppToastState(toastTokens.duration);

export const appToast = {
  success: (title: string, options?: AppToastOptions) => notifications.show("success", title, options),
  error: (title: string, options?: AppToastOptions) => notifications.show("error", title, options),
  warning: (title: string, options?: AppToastOptions) => notifications.show("warning", title, options),
  info: (title: string, options?: AppToastOptions) => notifications.show("info", title, options),
  loading: (title: string, options?: AppToastOptions) => notifications.show("loading", title, options),
  dismiss: (id?: string | number) => notifications.dismiss(id),
};

const icons = { check: CircleCheck, error: CircleAlert, warning: TriangleAlert, info: Info, loading: LoaderCircle };

function ToastStatusIcon({ tone }: { tone: AppToastTone }) {
  const presentation = getAppToastPresentation(tone);
  const Icon = icons[presentation.icon];
  const reducedMotion = useReducedMotion();
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    rotation.setValue(0);
    if (presentation.icon !== "loading" || reducedMotion) return;
    const animation = Animated.loop(Animated.timing(rotation, {
      toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: Platform.OS !== "web",
    }));
    animation.start();
    return () => animation.stop();
  }, [presentation.icon, reducedMotion, rotation]);

  return <YStack width={toastTokens.iconSurfaceSize} height={toastTokens.iconSurfaceSize} flexShrink={0} borderRadius={toastTokens.iconSurfaceSize / 2} backgroundColor={presentation.iconSurface} alignItems="center" justifyContent="center" aria-hidden={true}>
    <Animated.View style={{ transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
      <Icon size={toastTokens.iconSize} strokeWidth={2} color={presentation.textColor} aria-hidden={true} />
    </Animated.View>
  </YStack>;
}

function AppToastItem({ item, cardWidth }: { item: AppToastMessage; cardWidth: number }) {
  const presentation = getAppToastPresentation(item.tone);
  const reducedMotion = useReducedMotion();
  const { elevation, ...nativeShadow } = toastTokens.shadow;
  const dismiss = () => {
    if (item.tone === "loading") return;
    if (Platform.OS === "web") {
      const active = document.activeElement;
      if (active instanceof HTMLElement && document.getElementById("flamee-toast")?.contains(active)) active.blur();
    }
    notifications.dismiss(item.id);
  };
  return <Toast
    key={item.id}
    id="flamee-toast"
    unstyled
    open={item.open}
    duration={item.duration}
    onOpenChange={(open) => { if (!open && item.tone !== "loading") notifications.dismiss(item.id); }}
    onEscapeKeyDown={(event) => { if (item.tone === "loading") event.preventDefault(); }}
    onSwipeStart={(event) => { if (item.tone === "loading") event.preventDefault(); }}
    type={presentation.liveMode === "assertive" ? "foreground" : "background"}
    width={cardWidth}
    maxWidth={toastTokens.maxWidth}
    minHeight={toastTokens.minHeight}
    backgroundColor="$surface"
    borderRadius={toastTokens.radius}
    borderWidth={0}
    outlineWidth={0}
    outlineStyle="none"
    paddingHorizontal={toastTokens.paddingHorizontal}
    paddingVertical={toastTokens.paddingVertical}
    {...(Platform.OS === "web" ? { boxShadow: toastTokens.webShadow } : { ...nativeShadow, elevation: Platform.OS === "android" ? elevation : undefined })}
    opacity={1}
    y={0}
    scale={1}
    transition={reducedMotion ? undefined : ["200ms", { duration: item.open ? toastTokens.enterDuration : toastTokens.exitDuration }]}
    animateOnly={["transform", "opacity"]}
    enterStyle={reducedMotion ? { opacity: 0 } : { opacity: 0, y: toastTokens.enterOffset, scale: 0.98 }}
    exitStyle={reducedMotion ? { opacity: 0 } : { opacity: 0, y: toastTokens.exitOffset, scale: 0.98 }}
    onPress={(event) => { event.stopPropagation(); dismiss(); }}
    accessibilityHint={item.tone === "loading" ? undefined : getMessage("vi", "closeNotification")}
  >
    <XStack width="100%" alignItems="center" gap={toastTokens.iconGap} pointerEvents="none">
      <ToastStatusIcon tone={item.tone} />
      <YStack flex={1} minWidth={0} gap={toastTokens.textGap}>
        <Toast.Title unstyled size="$bodyM" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color={presentation.textColor} numberOfLines={2}>{item.title}</Toast.Title>
        {item.description ? <Toast.Description unstyled size="$bodyS" fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" numberOfLines={3}>{item.description}</Toast.Description> : null}
      </YStack>
    </XStack>
  </Toast>;
}

export function AppToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const item = useSyncExternalStore(notifications.subscribe, notifications.getSnapshot, notifications.getServerSnapshot);
  const viewportWidth = Math.max(0, Math.min(toastTokens.maxWidth, width - spacing.lg * 2));
  const viewport = <ToastViewport
    portalToRoot={Platform.OS !== "ios"}
    width={viewportWidth}
    left={(width - viewportWidth) / 2}
    top={insets.top + liquidHeaderTokens.topGap + memoryFeedTokens.expandedHeaderHeight + spacing.sm}
    alignItems="center"
    label={getMessage("vi", "notificationsLabel")}
  />;
  return <ToastProvider duration={toastTokens.duration} swipeDirection="up" swipeThreshold={item?.tone === "loading" ? Number.MAX_SAFE_INTEGER : 48} native={false}>
    {children}
    {item ? <AppToastItem key={item.id} item={item} cardWidth={viewportWidth} /> : null}
    {Platform.OS === "ios" ? <FullWindowOverlay>
      <YStack position="absolute" top={0} right={0} bottom={0} left={0} pointerEvents="box-none">{viewport}</YStack>
    </FullWindowOverlay> : viewport}
  </ToastProvider>;
}
