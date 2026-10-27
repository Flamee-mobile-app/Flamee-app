import { Bookmark } from "@tamagui/lucide-icons-2/icons/Bookmark";
import { LayoutList } from "@tamagui/lucide-icons-2/icons/LayoutList";
import { NotebookPen } from "@tamagui/lucide-icons-2/icons/NotebookPen";
import { Plus } from "@tamagui/lucide-icons-2/icons/Plus";
import { Sparkles } from "@tamagui/lucide-icons-2/icons/Sparkles";
import { UserRound } from "@tamagui/lucide-icons-2/icons/UserRound";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { appToast } from "../../shared/components/AppToast";
import { getMessage } from "../../shared/localization/messages";
import type { AppHeaderAction, AppHeaderConfiguration } from "../../shared/navigation/appHeaderContext";
import { getHeaderDestinationRoute, headerDestinations, isHomeHeaderRoute, resolveHeaderDestination } from "./headerNavigationModel";

const icons = { timeline: LayoutList, memories: Bookmark, moments: NotebookPen, tasks: Sparkles, profile: UserRound };

export function useHeaderNavigation(route: string, configuration: AppHeaderConfiguration | null) {
  const router = useRouter();
  const activeId = resolveHeaderDestination(route, configuration?.activeMenuId);
  const items = useMemo(() => headerDestinations.map((destination) => {
    const Icon = icons[destination.id];
    return { id: destination.id, label: getMessage("vi", destination.titleKey), icon: <Icon size={21} strokeWidth={2} color={destination.id === activeId ? "$accentText" : "$textPrimary"} /> };
  }), [activeId]);
  const select = useCallback((id: string) => {
    const target = headerDestinations.find((item) => item.id === id);
    if (!target) return;
    if ((target.id === "timeline" || target.id === "memories") && isHomeHeaderRoute(route)) router.setParams({ view: target.id });
    else router.navigate(getHeaderDestinationRoute(target.id));
  }, [router, route]);
  const leftAction: AppHeaderAction = activeId === "timeline" || activeId === "memories" ? {
    label: getMessage("vi", "memoryFeedAdd"), icon: <Plus size={24} color="$textPrimary" />, testID: "home-add-memory",
    onPress: configuration?.onAdd ?? (() => router.navigate({ pathname: "/(main)", params: { view: activeId, momentRequest: `header-${Date.now()}` } })),
  } : activeId === "moments" ? {
    label: getMessage("vi", "moodStartCheckIn"), icon: <NotebookPen size={23} color="$textPrimary" />, onPress: () => router.push("/mood/check-in"),
  } : activeId === "profile" ? {
    label: getMessage("vi", "profileEditTitle"), icon: <UserRound size={23} color="$textPrimary" />, onPress: () => router.push({ pathname: "/settings", params: { section: "profile" } }),
  } : {
    label: getMessage("vi", "tasksTitle"), icon: <Sparkles size={23} color="$textPrimary" />,
    onPress: () => appToast.info(getMessage("vi", "featureNotConnectedTitle"), { description: getMessage("vi", "nudgesNotConnectedBody") }),
  };
  return { activeId, items, select, leftAction, isHome: isHomeHeaderRoute(route) };
}
