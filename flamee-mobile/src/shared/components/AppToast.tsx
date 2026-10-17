import { Toast, toast, type ToastT } from "@tamagui/toast/v2";
import type { PropsWithChildren, ReactNode } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { spacing, toastTokens } from "../constants/tokens";
import { getMessage } from "../localization/messages";
import { getAppToastPresentation, type AppToastTone } from "./appToastModel";

type AppToastOptions = {
  description?: string;
  duration?: number;
};

function showToast(tone: Exclude<AppToastTone, "default">, title: string, options?: AppToastOptions) {
  return toast[tone](title, options);
}

export const appToast = {
  success: (title: string, options?: AppToastOptions) => showToast("success", title, options),
  error: (title: string, options?: AppToastOptions) => showToast("error", title, options),
  warning: (title: string, options?: AppToastOptions) => showToast("warning", title, options),
  info: (title: string, options?: AppToastOptions) => showToast("info", title, options),
  loading: (title: string, options?: AppToastOptions) => showToast("loading", title, options),
  dismiss: (id?: string | number) => toast.dismiss(id),
};

function renderToastText(value: ToastT["title"] | ToastT["description"]): ReactNode {
  return typeof value === "function" ? value() : value;
}

function AppToastItem({ item, index }: { item: ToastT; index: number }) {
  const tone = item.type ?? "default";
  const presentation = getAppToastPresentation(tone);
  const description = renderToastText(item.description);

  return (
    <Toast.Item
      unstyled
      toast={item}
      index={index}
      width="100%"
      maxWidth={toastTokens.maxWidth}
      minHeight={toastTokens.minHeight}
      backgroundColor="$white"
      borderWidth={0}
      borderColor="transparent"
      outlineWidth={0}
      outlineStyle="none"
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      borderRadius={toastTokens.radius}
      paddingHorizontal={toastTokens.paddingHorizontal}
      paddingVertical={toastTokens.paddingVertical}
      justifyContent="center"
      overflow="hidden"
      role={tone === "error" ? "alert" : "status"}
      aria-live={presentation.liveMode}
      onPress={(event) => {
        event.stopPropagation();
        // Release keyboard/touch focus before unmounting so the toast timer resumes.
        if (Platform.OS === "web") {
          const activeElement = document.activeElement;
          if (activeElement instanceof HTMLElement && activeElement.closest("[data-front]")) activeElement.blur();
        }
        toast.dismiss(item.id);
      }}
      {...(Platform.OS === "web" ? {} : { accessibilityHint: getMessage("vi", "closeNotification") })}
    >
      <YStack minWidth={0} gap="$xs" pointerEvents="none">
        <Toast.Title fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$semibold" color={presentation.textColor}>
          {renderToastText(item.title)}
        </Toast.Title>
        {description ? (
          <Toast.Description fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">
            {description}
          </Toast.Description>
        ) : null}
      </YStack>
    </Toast.Item>
  );
}

export function AppToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <Toast position="top-center" duration={toastTokens.duration} gap={0} visibleToasts={1} swipeDirection="up" toastHeight={toastTokens.minHeight}>
      {children}
      <Toast.Viewport
        width={Math.max(0, Math.min(toastTokens.maxWidth, width - spacing.lg * 2))}
        offset={{ top: insets.top + spacing.md, left: spacing.lg, right: spacing.lg }}
        label={getMessage("vi", "notificationsLabel")}
      >
        <Toast.List renderItem={({ toast: item, index }) => <AppToastItem key={item.id} item={item} index={index} />} />
      </Toast.Viewport>
    </Toast>
  );
}
