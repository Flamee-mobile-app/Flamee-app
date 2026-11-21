import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppField, AppPhotoPicker } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import type { MemoryPostEditor } from "../useInlineMemoryEdit";
import { photoPickerTokens } from "../../../shared/constants/tokens";

export function MemoryInlineEditor({ editor, availableHeight }: { editor: MemoryPostEditor; availableHeight: number }) {
  const invalid = (!editor.title.trim() && !editor.photo.uri) || Array.from(editor.title.trim()).length > 200;
  return <YStack gap="$md" testID="memory-inline-editor">
    <AppPhotoPicker uri={editor.photo.uri} imageWidth={editor.photo.width} imageHeight={editor.photo.height} maxPreviewHeight={Math.min(photoPickerTokens.height, availableHeight * 0.35)} busy={editor.photo.picking} disabled={editor.busy || editor.photo.frozen}
      label={getMessage("vi", editor.photo.uri ? "memoryComposerChangePhoto" : "memoryComposerAddPhoto")} removeLabel={getMessage("vi", "memoryComposerRemovePhoto")} hint={getMessage("vi", "memoryComposerPhotoHint")}
      onPress={() => { void editor.photo.select(); }} onRemove={editor.photo.remove} />
    <AppField multiline showLabel={false} label={getMessage("vi", "memoryComposerDescription")} placeholder={getMessage("vi", "memoryComposerPlaceholder")}
      value={editor.title} onChangeText={editor.setTitle} maxLength={200} editable={!editor.busy && !editor.photo.frozen} />
    {editor.photo.error ? <Text role="alert" fontFamily="$body" fontSize="$bodyS" color="$accentText">{getMessage("vi", editor.photo.error === "denied" ? "memoryComposerPermission" : "memoryComposerPhotoError")}</Text> : null}
    {editor.failed ? <Text role="alert" fontFamily="$body" fontSize="$bodyM" color="$accentText">{getMessage("vi", "memoryActionError")}</Text> : null}
    <XStack gap="$sm">
      <AppButton grow loading={editor.busy} disabled={invalid} onPress={() => { void editor.save(); }}>{getMessage("vi", editor.photo.frozen && editor.failed ? "retry" : "memorySave")}</AppButton>
      <AppButton variant="ghost" disabled={editor.busy} onPress={editor.cancel}>{getMessage("vi", "memoryActionCancel")}</AppButton>
    </XStack>
  </YStack>;
}
