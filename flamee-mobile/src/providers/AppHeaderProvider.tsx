import { useCallback, useEffect, useMemo, useReducer, useState, type PropsWithChildren } from "react";
import { useRouter, useSegments } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MemoryFeedHeader } from "../features/home";
import { memoryFeedTokens } from "../shared/constants/tokens";
import { AppHeaderContext, type AppHeaderEntry } from "../shared/navigation/appHeaderContext";
import { useHeaderNavigation } from "../features/main-navigation";
import { AppSheet } from "../shared/components/AppSheet";
import { FeatureTitle } from "../shared/components/FeatureTitle";
import { getMessage } from "../shared/localization/messages";
import { initialAppHeaderPresence, reduceAppHeaderPresence } from "./appHeaderPresenceModel";
import { getAppHeaderContentOffset } from "./appHeaderLayoutModel";

/** One application header, outside the navigator's screen content. */
export function AppHeaderProvider({ children }: PropsWithChildren) {
  const [presence, dispatch] = useReducer(reduceAppHeaderPresence, initialAppHeaderPresence);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsMounted, setNotificationsMounted] = useState(false);
  const route = useSegments().join("/");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const publish = useCallback((next: AppHeaderEntry) => {
    dispatch({ type: "publish", entry: next });
    return () => dispatch({ type: "release", owner: next.owner });
  }, []);
  const visible = presence.active !== null && presence.active.route === route;
  const configuration = presence.retained?.configuration ?? null;
  const menu = useHeaderNavigation(route, configuration);
  const contentOffset = visible ? getAppHeaderContentOffset(menu.isHome) : 0;
  const value = useMemo(() => ({ visible, contentOffset, publish }), [visible, contentOffset, publish]);
  const openNotifications = useCallback(() => { setNotificationsMounted(true); setNotificationsOpen(true); }, []);
  useEffect(() => { setNotificationsOpen(false); setNotificationsMounted(false); }, [route]);
  return <AppHeaderContext.Provider value={value}>
    <View style={styles.fill}>
      {children}
      {configuration ? <View pointerEvents={visible ? "box-none" : "none"} style={[StyleSheet.absoluteFill, !visible && styles.hidden]}>
        <View pointerEvents={visible ? "box-none" : "none"} style={styles.headerBounds}>
          {menu.isHome ? <MemoryFeedHeader title={configuration.title} menuItems={menu.items} activeMenuId={menu.activeId} onMenuSelect={menu.select}
            leftAction={menu.leftAction} onNotifications={openNotifications} topInset={insets.top} compact={configuration.compact ?? false}
            onBack={configuration.showBack ? configuration.onBack ?? router.back : undefined} />
            : <View style={{ paddingTop: insets.top }}><FeatureTitle title={configuration.title} onBack={configuration.showBack ? configuration.onBack ?? router.back : undefined} /></View>}
        </View>
      </View> : null}
      {notificationsMounted ? <AppSheet open={notificationsOpen} fitContent disableDrag onOpenChange={setNotificationsOpen} onAfterClose={() => setNotificationsMounted(false)}
        title={getMessage("vi", "memoryFeedNotifications")} description={getMessage("vi", "memoryFeedNotificationsUnavailable")} /> : null}
    </View>
  </AppHeaderContext.Provider>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { opacity: 0 },
  headerBounds: { flex: 1, width: "100%", maxWidth: memoryFeedTokens.maxWidth, alignSelf: "center" },
});
