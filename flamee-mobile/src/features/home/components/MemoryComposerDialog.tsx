import { useEffect, useRef, useState, type RefObject } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppSheet, AppField, AppPhotoPicker, type AppBlurTargetView } from "../../../shared/components";
import { buttonTokens, memoryComposerTokens, spacing } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { localMediaAdapter } from "../../media";
import { createMemoryPhotoDraft } from "../memoryPhotoDraft";

/** Text/photo are a disposable preview. Posting stays disabled until upload/create is integrated. */
export function MemoryComposerDialog({ blurTarget, onClose }: {
  blurTarget: RefObject<AppBlurTargetView | null>;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ uri: string; width?: number; height?: number } | null>(null);
  const [position, setPosition] = useState(memoryComposerTokens.initialPosition);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"denied" | "unavailable" | null>(null);
  const draft = useRef<ReturnType<typeof createMemoryPhotoDraft> | null>(null);
  const picking = useRef(false);

  useEffect(() => {
    const current = createMemoryPhotoDraft(localMediaAdapter);
    draft.current = current;
    return () => { draft.current = null; void current.dispose(); };
  }, []);

  const selectPhoto = async () => {
    const current = draft.current;
    if (!current || picking.current) return;
    picking.current = true;
    setBusy(true); setError(null);
    try {
      const result = await current.select();
      if (draft.current !== current || !result) return;
      if (result.kind === "selected") { setPhoto(result); setPosition(0); }
      else if (result.kind !== "cancelled") setError(result.kind);
    } finally {
      picking.current = false;
      if (draft.current === current) setBusy(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setError(null);
    const current = draft.current;
    if (current) void current.remove();
  };

  return <AppSheet open onOpenChange={(open) => { if (!open) onClose(); }} blurTarget={blurTarget}
    snapPoints={memoryComposerTokens.snapPoints} position={position} onPositionChange={setPosition} onBodyHeightChange={setBodyHeight}
    title={getMessage("vi", "memoryComposerTitle")} titleAlign="center" disableDrag
    footer={<YStack gap="$sm">
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "memoryComposerNotReady")}</Text>
      <XStack justifyContent="flex-end" gap="$sm">
        <AppButton variant="ghost" onPress={onClose}>{getMessage("vi", "cancel")}</AppButton>
        <AppButton disabled onPress={() => undefined}>{getMessage("vi", "memoryComposerPost")}</AppButton>
      </XStack>
    </YStack>}>
    <AppField id="memory-composer-text" multiline showLabel={false} label={getMessage("vi", "memoryComposerDescription")}
      placeholder={getMessage("vi", "memoryComposerPlaceholder")} value={text} onChangeText={setText} maxLength={200} />
    <AppPhotoPicker uri={photo?.uri ?? null} imageWidth={photo?.width} imageHeight={photo?.height} busy={busy}
      maxPreviewHeight={bodyHeight ? Math.max(1, bodyHeight - buttonTokens.height - spacing.sm * 2) : undefined}
      label={getMessage("vi", photo ? "memoryComposerChangePhoto" : "memoryComposerAddPhoto")}
      removeLabel={getMessage("vi", "memoryComposerRemovePhoto")} hint={getMessage("vi", "memoryComposerPhotoHint")}
      onPress={() => void selectPhoto()} onRemove={removePhoto} />
    {error ? <Text role="alert" fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$accentText">{getMessage("vi", error === "denied" ? "memoryComposerPermission" : "memoryComposerPhotoError")}</Text> : null}
  </AppSheet>;
}
