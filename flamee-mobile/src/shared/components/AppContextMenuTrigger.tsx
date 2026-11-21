import { useRef, type PropsWithChildren } from "react";
import { Platform, Pressable, type View } from "react-native";
import { useTheme } from "tamagui";
import { colors, radii } from "../constants/tokens";
import { getMessage } from "../localization/messages";
import type { PopupAnchor } from "./anchoredPopupModel";

/** Native long press with equivalent keyboard, context-click and screen-reader actions. */
export function AppContextMenuTrigger({ children, onOpen, disabled, label, surfaceTone }: PropsWithChildren<{
  onOpen: (anchor: PopupAnchor) => void; disabled?: boolean; label: string;
  surfaceTone?: "default" | "highlighted";
}>) {
  const theme = useTheme();
  const surfaceColor = surfaceTone === "highlighted" ? theme.accentSoft?.get() ?? colors.accentSoft : theme.fieldSurface?.get() ?? colors.fieldSurface;
  const target = useRef<View>(null);
  const open = () => {
    if (disabled) return;
    target.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) onOpen({ x, y, width, height });
    });
  };
  return <Pressable ref={target} collapsable={false} disabled={disabled} delayLongPress={400} onLongPress={open}
    style={surfaceTone ? { borderRadius: radii.lg, overflow: "hidden", backgroundColor: surfaceColor } : undefined}
    accessibilityRole="button" accessibilityLabel={label} accessibilityHint={getMessage("vi", "conversationActionsHint")}
    accessibilityState={{ disabled: !!disabled }} accessibilityActions={[{ name: "activate", label: getMessage("vi", "conversationActions") }]}
    onAccessibilityAction={open}
    {...(Platform.OS === "web" ? {
      onContextMenu: (event: { preventDefault: () => void }) => { event.preventDefault(); open(); },
      onKeyDown: (event: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
        if (event.key === "Enter" || event.key === " " || event.key === "ContextMenu" || event.shiftKey && event.key === "F10") { event.preventDefault(); open(); }
      },
    } : {})}>
    {children}
  </Pressable>;
}
