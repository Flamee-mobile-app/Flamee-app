import { Smile } from "@tamagui/lucide-icons-2/icons/Smile";
import { Sticker } from "@tamagui/lucide-icons-2/icons/Sticker";
import { useMemo, useState } from "react";
import { Image, useWindowDimensions } from "react-native";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { AppField, AppIconButton, AppProfileAvatar, AppThoughtBubble } from "../../../shared/components";
import { choiceTokens, noteComposerLayoutTokens, spacing } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { checkInFeelingCatalog } from "../checkInFeelingCatalog";
import { emotionCatalog } from "../emotionCatalog";
import { mascotStickerCatalog } from "../mascotCatalog";
import { moodEmojiCatalog } from "../moodEmojiCatalog";
import { setCheckInAttachment, type CheckInAttachment, type CheckInDraft } from "../checkInFlowModel";

type Suggestion = CheckInAttachment & { label: string; source: () => number };
type SuggestionGroup = "gif" | "emoji" | "sticker";

export function CheckInNoteComposer({ draft, onChange }: { draft: CheckInDraft; onChange: (draft: CheckInDraft) => void }) {
  const [suggestionGroup, setSuggestionGroup] = useState<SuggestionGroup>("emoji");
  const avatarUrl = useSessionStore((session) => session.activeAvatarUrl);
  const accountId = useSessionStore((session) => session.activeAccountId);
  const { width } = useWindowDimensions();
  const avatarSize = Math.min(width * noteComposerLayoutTokens.avatarWidthRatio, noteComposerLayoutTokens.avatarMaxSize);
  const noteLength = Array.from(draft.note).length;
  const gifs = useMemo<Suggestion[]>(() => checkInFeelingCatalog.map((item) => ({ kind: "gif", id: item.id, label: getMessage("vi", item.labelKey), source: item.source })), []);
  const emojis = useMemo<Suggestion[]>(() => Object.values(moodEmojiCatalog).map((item) => ({
    kind: "emoji",
    id: item.emojiId,
    label: getMessage("vi", emotionCatalog.find((emotion) => emotion.id === item.emojiId)?.labelKey ?? "moodFlowNoteImageEmoji"),
    source: item.source,
  })), []);
  const stickers = useMemo<Suggestion[]>(() => mascotStickerCatalog.map((item) => ({ kind: "sticker", id: item.id, label: getMessage("vi", item.labelKey), source: item.source })), []);
  const suggestions = suggestionGroup === "gif" ? gifs : suggestionGroup === "emoji" ? emojis : stickers;
  const tools = [
    { kind: "gif" as const, label: getMessage("vi", "moodFlowNoteImageGif"), icon: <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$bold" color="$accentText" aria-hidden={true}>GIF</Text> },
    { kind: "emoji" as const, label: getMessage("vi", "moodFlowNoteImageEmoji"), icon: <Smile size={noteComposerLayoutTokens.toolIconSize} color="$accentText" strokeWidth={2.5} aria-hidden={true} /> },
    { kind: "sticker" as const, label: getMessage("vi", "moodFlowNoteImageSticker"), icon: <Sticker size={noteComposerLayoutTokens.toolIconSize} color="$accentText" strokeWidth={2.5} aria-hidden={true} /> },
  ];
  const noteLabel = getMessage("vi", "moodFlowNotePlaceholder");
  const commitNote = () => {
    onChange({ ...draft, note: draft.note.trim() });
  };
  const characterCount = noteLength >= 45 ? `${noteLength}/60` : undefined;
  const chooseAttachment = (suggestion: Suggestion) => {
    onChange({ ...draft, attachments: setCheckInAttachment(draft.attachments, suggestion) });
  };

  return <YStack flex={1} minHeight={0} width="100%" paddingBottom={noteComposerLayoutTokens.pickerKeyboardGap}>
    <YStack flex={1} minHeight={0} alignItems="center" justifyContent="center"
      paddingVertical={noteComposerLayoutTokens.composerBalancedEdgeGap}>
      <YStack width="100%" alignItems="center" flexShrink={0}>
        <AppThoughtBubble density="composer" footer={characterCount ? <XStack alignSelf="stretch" justifyContent="flex-end">
          <Text fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" color="$textSecondary">{characterCount}</Text>
        </XStack> : undefined}>
          <AppField showLabel={false} autoFocus multiline autoGrow maxAutoGrowLines={3}
            autoGrowMinHeight={noteComposerLayoutTokens.bubbleInputMinHeight}
            autoGrowPaddingHorizontal={noteComposerLayoutTokens.bubbleInputPaddingHorizontal}
            autoGrowPaddingVertical={noteComposerLayoutTokens.bubbleInputPaddingVertical}
            autoGrowTextAlignVertical="center" multilineSize="compact" surfaceTone="thought"
            label={noteLabel} placeholder={noteLabel} value={draft.note} onChangeText={(note) => onChange({ ...draft, note })}
            onSubmitEditing={commitNote} maxLength={60} returnKeyType="done" submitBehavior="submit" />
          {draft.attachments.length ? <XStack flexWrap="wrap" gap={spacing.xs} paddingTop={spacing.xs}>
            {draft.attachments.map((attachment) => {
              const item = [...gifs, ...emojis, ...stickers].find((suggestion) => suggestion.kind === attachment.kind && suggestion.id === attachment.id);
              return item ? <Image key={`${attachment.kind}:${attachment.id}`} source={item.source()} resizeMode="contain"
                accessibilityLabel={item.label} style={{ width: choiceTokens.artworkSize, height: choiceTokens.artworkSize }} /> : null;
            })}
          </XStack> : null}
        </AppThoughtBubble>
        <AppProfileAvatar uri={avatarUrl} fallbackSeed={accountId} size={avatarSize} accessibilityLabel={getMessage("vi", "moodFlowNoteSelfLabel")} />
        <XStack justifyContent="center" alignItems="center" gap={noteComposerLayoutTokens.toolGap} marginTop={noteComposerLayoutTokens.avatarToToolsGap}>
          {tools.map((tool) => <AppIconButton key={tool.kind} tone="composer" selected={suggestionGroup === tool.kind} preventNativeFocus
            icon={tool.icon} accessibilityLabel={tool.label} onPress={() => setSuggestionGroup(tool.kind)} />)}
        </XStack>
      </YStack>
    </YStack>
    <ScrollView horizontal alignSelf="stretch" height={noteComposerLayoutTokens.pickerHeight} flexGrow={0} flexShrink={0}
      keyboardShouldPersistTaps="always" keyboardDismissMode="none"
      showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", gap: noteComposerLayoutTokens.pickerGap, paddingHorizontal: noteComposerLayoutTokens.pickerHorizontalPadding }}>
      {suggestions.map((item) => {
        const selected = draft.attachments.some((attachment) => attachment.kind === item.kind && attachment.id === item.id);
        return <AppIconButton key={`${item.kind}:${item.id}`} tone="composer" sizeVariant="large" selected={selected} preventNativeFocus
          icon={<Image source={item.source()} resizeMode="contain" style={{ width: noteComposerLayoutTokens.pickerIconSize, height: noteComposerLayoutTokens.pickerIconSize }} accessible={false} />}
          accessibilityLabel={item.label} accessibilityHint={getMessage("vi", "moodFlowNoteAddSuggestion")}
          onPress={() => chooseAttachment(item)} />;
      })}
    </ScrollView>
  </YStack>;
}
