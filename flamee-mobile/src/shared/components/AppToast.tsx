import { CircleAlert } from "@tamagui/lucide-icons-2/icons/CircleAlert";
import { CircleCheck } from "@tamagui/lucide-icons-2/icons/CircleCheck";
import { Info } from "@tamagui/lucide-icons-2/icons/Info";
import { LoaderCircle } from "@tamagui/lucide-icons-2/icons/LoaderCircle";
import { TriangleAlert } from "@tamagui/lucide-icons-2/icons/TriangleAlert";
import { Toast, ToastProvider, ToastViewport } from "@tamagui/toast";
import { useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore, type PropsWithChildren } from "react";
import { usePathname } from "expo-router";
import { Animated, AppState, Easing, Platform, useWindowDimensions } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";
import { XStack, YStack } from "tamagui";
import { spacing, toastTokens } from "../constants/tokens";
import { useSessionStore } from "../state/sessionStore";
import { getMessage } from "../localization/messages";
import { getAppToastPresentation, getToastViewportFrame, type AppToastTone } from "./appToastModel";
import { createAppToastState, type AppToastMessage, type AppToastOptions } from "./appToastState";
import { resolveSurfaceShadow } from "./surfaceShadow";
import { createAppToastHostState } from "./appToastHostState";

const notifications = createAppToastState(toastTokens.duration, { exitDuration: toastTokens.exitDuration });
const modalHosts = createAppToastHostState();

function createToastOperation() {
  const operationId = notifications.begin();
  let loadingId: number | undefined;
  const show = (tone: Exclude<AppToastTone, "default">, title: string, options?: AppToastOptions) => notifications.show(tone, title, { ...options, operationId });
  return {
    success: (title: string, options?: AppToastOptions) => show("success", title, options),
    error: (title: string, options?: AppToastOptions) => show("error", title, options),
    warning: (title: string, options?: AppToastOptions) => show("warning", title, options),
    info: (title: string, options?: AppToastOptions) => show("info", title, options),
    loading: (title: string, options?: AppToastOptions) => { loadingId = show("loading", title, options); return loadingId; },
    dismiss: () => { if (loadingId !== undefined) notifications.dismiss(loadingId); },
  };
}

export const appToast = {
  operation: createToastOperation,
  success: (title: string, options?: AppToastOptions) => notifications.show("success", title, options),
  error: (title: string, options?: AppToastOptions) => notifications.show("error", title, options),
  warning: (title: string, options?: AppToastOptions) => notifications.show("warning", title, options),
  info: (title: string, options?: AppToastOptions) => notifications.show("info", title, options),
  infoIfIdle: (title: string, options?: AppToastOptions) => notifications.getSnapshot()?.open ? null : notifications.show("info", title, options),
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

function AppToastItem({ item, cardWidth, viewportName }: { item: AppToastMessage; cardWidth: number; viewportName?: string }) {
  const presentation = getAppToastPresentation(item.tone);
  const reducedMotion = useReducedMotion();
  const nativeShadow = resolveSurfaceShadow(Platform.OS, toastTokens.shadow);
  const dismiss = () => {
    if (Platform.OS === "web") {
      const active = document.activeElement;
      if (active instanceof HTMLElement && document.getElementById("flamee-toast")?.contains(active)) active.blur();
    }
    notifications.dismiss(item.id);
  };
  return <Toast
    key={item.id}
    id="flamee-toast"
    viewportName={viewportName}
    unstyled
    open={item.open}
    duration={Infinity}
    onOpenChange={(open) => { if (!open) notifications.dismiss(item.id); }}
    onPause={() => notifications.setPaused(true)}
    onResume={() => notifications.setPaused(false)}
    type={presentation.liveMode === "assertive" ? "foreground" : "background"}
    width={cardWidth}
    maxWidth={toastTokens.maxWidth}
    minHeight={toastTokens.minHeight}
    backgroundColor="$white"
    borderRadius={toastTokens.radius}
    borderWidth={0}
    outlineWidth={0}
    outlineStyle="none"
    paddingHorizontal={toastTokens.paddingHorizontal}
    paddingVertical={toastTokens.paddingVertical}
    {...(Platform.OS === "web" ? { boxShadow: toastTokens.webShadow } : nativeShadow)}
    opacity={1}
    y={0}
    scale={1}
    transition={reducedMotion ? undefined : ["200ms", { duration: item.open ? toastTokens.enterDuration : toastTokens.exitDuration }]}
    animateOnly={["transform", "opacity"]}
    enterStyle={reducedMotion ? { opacity: 0 } : { opacity: 0, y: toastTokens.enterOffset, scale: 0.98 }}
    exitStyle={reducedMotion ? { opacity: 0 } : { opacity: 0, y: toastTokens.exitOffset, scale: 0.98 }}
    onPress={(event) => { event.stopPropagation(); dismiss(); }}
    accessibilityHint={getMessage(item.locale ?? "vi", "closeNotification")}
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

/** React Native Modal is a separate native window; its toast viewport must live inside it. */
export function AppToastModalHost({ active = true }: { active?: boolean }) {
  const host = `flamee-modal-toast-${useId()}`;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  useLayoutEffect(() => {
    if (!active || Platform.OS === "web") return;
    return modalHosts.register(host);
  }, [active, host]);
  const owner = useSyncExternalStore(modalHosts.subscribe, modalHosts.getSnapshot, () => null);
  const item = useSyncExternalStore(notifications.subscribe, notifications.getSnapshot, notifications.getServerSnapshot);
  if (!active || !item || owner !== host) return null;
  const frame = getToastViewportFrame(width, insets, toastTokens.maxWidth, spacing.lg, spacing.sm);
  return <ToastProvider duration={Infinity} swipeDirection="up" swipeThreshold={48} native={false}>
    <AppToastItem key={item.id} item={item} cardWidth={frame.width} viewportName={host} />
    <ToastViewport name={host} portalToRoot={false} zIndex={toastTokens.zIndex} {...frame} alignItems="center" label={getMessage(item.locale ?? "vi", "notificationsLabel")} />
  </ToastProvider>;
}

export function AppToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  useLayoutEffect(() => {
    if (previousPath.current !== pathname) notifications.changeRoute();
    previousPath.current = pathname;
  }, [pathname]);
  useLayoutEffect(() => useSessionStore.subscribe((next, previous) => {
    if (next.sessionId !== previous.sessionId || next.activeAccountId !== previous.activeAccountId) notifications.reset();
  }), []);
  useEffect(() => {
    notifications.setActive(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", (state) => notifications.setActive(state === "active"));
    return () => { subscription.remove(); notifications.setActive(false); notifications.reset(); };
  }, []);
  const item = useSyncExternalStore(notifications.subscribe, notifications.getSnapshot, notifications.getServerSnapshot);
  const modalOwner = useSyncExternalStore(modalHosts.subscribe, modalHosts.getSnapshot, () => null);
  const rootItem = modalOwner ? null : item;
  const frame = getToastViewportFrame(width, insets, toastTokens.maxWidth, spacing.lg, spacing.sm);
  const viewport = <ToastViewport
    portalToRoot={Platform.OS !== "ios"}
    zIndex={toastTokens.zIndex}
    {...frame}
    alignItems="center"
    label={getMessage(item?.locale ?? "vi", "notificationsLabel")}
  />;
  return <ToastProvider duration={Infinity} swipeDirection="up" swipeThreshold={48} native={false}>
    {children}
    {rootItem ? <AppToastItem key={rootItem.id} item={rootItem} cardWidth={frame.width} /> : null}
    {rootItem ? Platform.OS === "ios" ? <FullWindowOverlay>
      <YStack position="absolute" top={0} right={0} bottom={0} left={0} pointerEvents="box-none">{viewport}</YStack>
    </FullWindowOverlay> : viewport : null}
  </ToastProvider>;
}
