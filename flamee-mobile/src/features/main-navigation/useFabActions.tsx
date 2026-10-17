import { HeartHandshake } from "@tamagui/lucide-icons-2/icons/HeartHandshake";
import { NotebookPen } from "@tamagui/lucide-icons-2/icons/NotebookPen";
import { Send } from "@tamagui/lucide-icons-2/icons/Send";
import { Sparkles } from "@tamagui/lucide-icons-2/icons/Sparkles";
import { useRouter } from "expo-router";
import { useRef } from "react";
import type { BottomNavigationQuickAction } from "../../shared/components";
import { menuTokens } from "../../shared/constants/tokens";
import { getMessage } from "../../shared/localization/messages";
import { getFabIntent, type FabAction } from "./mainNavigationModel";

export function useFabActions(tone: "light" | "accent" = "light") {
  const router = useRouter();
  const iconColor = tone === "accent" ? "$accentText" : "$white";
  const iconSize = tone === "accent" ? menuTokens.iconSize : 20;
  const sequence = useRef(0);
  const open = (action: FabAction) => {
    const requestId = `fab-${Date.now()}-${++sequence.current}`;
    router.navigate(getFabIntent(action, requestId));
  };
  const quickActions: BottomNavigationQuickAction[] = [
    { key: "emotion", label: getMessage("vi", "fabEmotion"), icon: <NotebookPen color={iconColor} size={iconSize} />, onPress: () => open("emotion") },
    { key: "nudge", label: getMessage("vi", "fabNudge"), icon: <Sparkles color={iconColor} size={iconSize} />, onPress: () => open("nudge") },
    { key: "moment", label: getMessage("vi", "fabMoment"), icon: <Send color={iconColor} size={iconSize} />, onPress: () => open("moment") },
    { key: "connection", label: getMessage("vi", "fabConnection"), icon: <HeartHandshake color={iconColor} size={iconSize} />, onPress: () => open("connection") },
  ];
  return { quickActions, onFabPress: () => open("timeline") };
}
