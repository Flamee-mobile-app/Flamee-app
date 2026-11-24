import { X } from "@tamagui/lucide-icons-2/icons/X";
import { useEffect, useState } from "react";
import { Modal, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";
import type { ReactNode } from "react";
import { getMessage } from "../localization/messages";
import { AppButton } from "./AppButton";
import { AppIconButton } from "./AppIconButton";
import { AppRemoteImage } from "./AppRemoteImage";
import { AppToastModalHost } from "./AppToast";

type Props = { uri: string; previewUri?: string | null; title: string; onClose: () => void; onRetry: () => void; footer?: ReactNode };

/** A media overlay above sheets; the owner controls account/focus lifetime. */
export function AppImageViewer({ uri, previewUri, title, onClose, onRetry, footer }: Props) {
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); onClose(); }
    };
    document.addEventListener("keydown", escape, true);
    return () => document.removeEventListener("keydown", escape, true);
  }, [onClose]);
  return <Modal visible animationType="none" presentationStyle="fullScreen" onRequestClose={onClose} supportedOrientations={["portrait", "landscape"]}>
    <YStack flex={1} backgroundColor="$textPrimary" paddingTop={insets.top} paddingBottom={insets.bottom} accessibilityViewIsModal>
      <XStack alignItems="center" paddingHorizontal="$md" gap="$md">
        <Text flex={1} fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$surface" numberOfLines={2}>{title}</Text>
        <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "close")} icon={<X size={22} color="$surface" />} onPress={onClose} />
      </XStack>
      <YStack flex={1} minHeight={0} alignItems="center" justifyContent="center">
        {failed ? <YStack alignItems="center" gap="$md" padding="$lg">
          <Text fontFamily="$body" fontSize="$bodyM" color="$surface">{getMessage("vi", "memoryFeedPhotoError")}</Text>
          <AppButton variant="secondary" onPress={() => { onClose(); onRetry(); }}>{getMessage("vi", "retry")}</AppButton>
        </YStack> : <AppRemoteImage uri={uri} previewUri={previewUri} resizeMode="contain" accessibilityLabel={title} onError={() => setFailed(true)} />}
      </YStack>
      {footer ? <YStack padding="$lg" gap="$sm" maxHeight="30%">{footer}</YStack> : null}
      <AppToastModalHost />
    </YStack>
  </Modal>;
}
