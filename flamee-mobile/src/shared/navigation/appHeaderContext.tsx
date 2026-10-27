import { createContext, useContext, useId, useLayoutEffect, useMemo, type ReactNode } from "react";
import { useIsFocused, useSegments } from "expo-router";

export type AppHeaderMenuItem = { id: string; label: string; icon: ReactNode };
export type AppHeaderAction = { label: string; icon: ReactNode; onPress: () => void; testID?: string };
export type AppHeaderConfiguration = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onAdd?: () => void;
  activeMenuId?: string;
  compact?: boolean;
};
export type AppHeaderEntry = { owner: string; route: string; configuration: AppHeaderConfiguration };
export const AppHeaderContext = createContext<{ visible: boolean; contentOffset: number; publish: (entry: AppHeaderEntry) => () => void }>({ visible: false, contentOffset: 0, publish: () => () => undefined });

/** Metadata only. The root layout is the sole owner of header rendering. */
export function useAppHeader(configuration: AppHeaderConfiguration, enabled = true) {
  const { publish } = useContext(AppHeaderContext);
  const focused = useIsFocused();
  const route = useSegments().join("/");
  const owner = useId();
  const { title, showBack, onBack, onAdd, activeMenuId, compact } = configuration;
  const stable = useMemo(() => ({ title, showBack, onBack, onAdd, activeMenuId, compact }), [title, showBack, onBack, onAdd, activeMenuId, compact]);
  useLayoutEffect(() => {
    if (!focused || !enabled) return;
    return publish({ owner, route, configuration: stable });
  }, [publish, focused, enabled, owner, route, stable]);
}

export function useAppHeaderVisible() {
  return useContext(AppHeaderContext).visible;
}

export function useAppHeaderLayout() {
  const { visible, contentOffset } = useContext(AppHeaderContext);
  return { visible, contentOffset };
}
