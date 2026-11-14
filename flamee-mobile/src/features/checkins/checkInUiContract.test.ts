import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const readSource = (...parts: string[]) => readFileSync(join(process.cwd(), "src", "features", ...parts), "utf8");

test("emphasizes the selected feeling with the primary brand color", () => {
  const source = readSource("checkins", "components", "CheckInReflectionForm.tsx");
  assert.match(source, /<Text color="\$primary" fontWeight="\$bold">\{emotionName\}<\/Text>/);
});

test("keeps the progress header free of a bottom divider", () => {
  const screen = readSource("checkins", "pages", "MoodCheckInScreen.tsx");
  assert.doesNotMatch(screen, /borderBottomWidth|borderBottomColor/);
});

test("uses a centered one-row note header, hides progress and has no overlay layout", () => {
  const screen = readSource("checkins", "pages", "MoodCheckInScreen.tsx");
  assert.match(screen, /height=\{noteComposerLayoutTokens\.headerHeight\}/);
  assert.match(screen, /moodFlowNoteHeaderTitle/);
  assert.match(screen, /AppTextButton tone=\{hasNote \? "accent" : "neutral"\} disabled=\{!hasNote\}/);
  assert.match(screen, /!noteStep \? <XStack[\s\S]*?accessibilityRole="progressbar"/);
  assert.match(screen, /noteStep \? <KeyboardAvoidingView[\s\S]*?\{screen\}/);
  assert.match(screen, /const screen = <AppScreen[\s\S]*?<CheckInNoteComposer/);
  assert.doesNotMatch(screen, /position="absolute"|moodFlowNotePrivacy|moodFlowNoteShareUnavailable/);
});

test("autofocuses once, commits Return without scrolling and caps at 60 characters", () => {
  const composer = readSource("checkins", "components", "CheckInNoteComposer.tsx");
  const field = readFileSync(join(process.cwd(), "src", "shared", "components", "AppField.tsx"), "utf8");
  assert.match(composer, /AppField showLabel=\{false\} autoFocus multiline autoGrow/);
  assert.match(composer, /maxLength=\{60\}/);
  assert.match(composer, /maxAutoGrowLines=\{3\}/);
  assert.match(composer, /returnKeyType="done"/);
  assert.match(composer, /submitBehavior="submit"/);
  assert.match(composer, /noteLength >= 45/);
  assert.doesNotMatch(composer, /requestFocus|onTouchEnd|scrollTo|onFocusTargetReady|keepFocusOnSubmit/);
  assert.match(field, /useEffect[\s\S]*requestAnimationFrame[\s\S]*textAreaRef\.current as unknown as TextInput \| null\)\?\.focus\(\)/);
  assert.match(field, /autoFocus: autoGrow && multiline \? undefined : autoFocus/);
  assert.match(field, /ref=\{autoGrow \? textAreaRef : undefined\}/);
  assert.doesNotMatch(composer, /Keyboard\.addListener|keyboardVisible/);
  assert.match(field, /autoFocus/);
  assert.doesNotMatch(composer, /Keyboard\.dismiss/);
});

test("uses an intrinsic thought bubble, centered avatar and 56px picker row", () => {
  const composer = readSource("checkins", "components", "CheckInNoteComposer.tsx");
  const bubble = readFileSync(join(process.cwd(), "src", "shared", "components", "AppThoughtBubble.tsx"), "utf8");
  const tokens = readFileSync(join(process.cwd(), "src", "shared", "constants", "tokens.ts"), "utf8");
  assert.match(composer, /AppThoughtBubble density="composer"/);
  assert.match(bubble, /minWidth=\{composer \? noteComposerLayoutTokens\.bubbleMinWidth/);
  assert.match(bubble, /maxWidth=\{composer \? noteComposerLayoutTokens\.bubbleMaxWidth/);
  assert.match(bubble, /width=\{composer \? undefined/);
  assert.match(bubble, /borderRadius=\{composer \? noteComposerLayoutTokens\.bubbleRadius/);
  assert.match(bubble, /width=\{composer \? noteComposerLayoutTokens\.largeTailSize/);
  assert.match(bubble, /width=\{composer \? noteComposerLayoutTokens\.smallTailSize/);
  assert.match(bubble, /width=\{composer \? "100%" : undefined\}/);
  assert.match(bubble, /alignSelf="center"/);
  assert.match(bubble, /translateX: -noteComposerLayoutTokens\.thoughtTailOffsetX/);
  assert.match(tokens, /export const noteComposerLayoutTokens =/);
  assert.match(tokens, /headerHeight: 56/);
  assert.match(tokens, /headerHorizontalInset: 20/);
  assert.match(tokens, /composerBalancedEdgeGap: 24/);
  assert.match(tokens, /avatarWidthRatio: 0\.24/);
  assert.match(tokens, /avatarMaxSize: 140/);
  assert.match(tokens, /bubbleMinHeight: 48/);
  assert.match(tokens, /bubbleCharactersPerLineEstimate: 20/);
  assert.match(tokens, /bubbleBorderWidth: 1/);
  assert.match(tokens, /bubbleToLargeTailGap: 6/);
  assert.match(tokens, /thoughtTailOffsetX: 16/);
  assert.match(tokens, /largeTailSize: 12/);
  assert.match(tokens, /largeTailRadius: 6/);
  assert.match(tokens, /largeToSmallTailGap: 4/);
  assert.match(tokens, /smallTailSize: 7/);
  assert.match(tokens, /smallTailRadius: 4/);
  assert.match(tokens, /smallTailToAvatarGap: 6/);
  assert.match(tokens, /avatarToToolsGap: 12/);
  assert.match(tokens, /toolSize: 44/);
  assert.match(tokens, /toolGap: 16/);
  assert.match(tokens, /toolBorderWidth: 2/);
  assert.match(tokens, /toolIconSize: 24/);
  assert.match(tokens, /pickerHeight: 56/);
  assert.match(tokens, /pickerItemSize: 48/);
  assert.match(tokens, /pickerHorizontalPadding: 20/);
  assert.match(tokens, /pickerGap: 12/);
  assert.match(tokens, /pickerIconSize: 28/);
  assert.match(tokens, /pickerKeyboardGap: 12/);
  assert.match(composer, /<AppProfileAvatar[^>]+size=\{avatarSize\}/);
  assert.match(composer, /const \{ width \} = useWindowDimensions\(\)/);
  assert.match(composer, /const avatarSize = Math\.min\(width \* noteComposerLayoutTokens\.avatarWidthRatio, noteComposerLayoutTokens\.avatarMaxSize\)/);
  assert.match(composer, /justifyContent="center"[^>]*paddingVertical=\{noteComposerLayoutTokens\.composerBalancedEdgeGap\}/);
  assert.match(composer, /autoGrowTextAlignVertical="center"/);
  assert.match(composer, /autoGrowMinHeight=\{noteComposerLayoutTokens\.bubbleInputMinHeight\}/);
  assert.match(composer, /height=\{noteComposerLayoutTokens\.pickerHeight\}/);
  assert.match(composer, /sizeVariant="large"/);
  assert.doesNotMatch(composer, /marginHorizontal=\{-spacing\.page\}/);
  assert.match(composer, /paddingHorizontal: noteComposerLayoutTokens\.pickerHorizontalPadding/);
  assert.match(composer, /keyboardShouldPersistTaps="always" keyboardDismissMode="none"/);
  assert.match(bubble, /minHeight=\{composer \? noteComposerLayoutTokens\.bubbleMinHeight/);
  assert.match(bubble, /marginBottom=\{composer \? noteComposerLayoutTokens\.bubbleToLargeTailGap/);
  assert.match(bubble, /marginBottom=\{composer \? noteComposerLayoutTokens\.largeToSmallTailGap/);
  assert.match(bubble, /marginBottom=\{composer \? noteComposerLayoutTokens\.smallTailToAvatarGap/);
  assert.match(composer, /<YStack flex=\{1\} minHeight=\{0\}[^>]*justifyContent="center"[^>]*paddingVertical=\{noteComposerLayoutTokens\.composerBalancedEdgeGap\}>/);
  assert.match(composer, /<ScrollView horizontal/);
  assert.doesNotMatch(composer, /<ScrollView(?! horizontal)|Spacer|position="absolute"|overflow="hidden"/);
  assert.doesNotMatch(composer, /resolveNoteComposerLayout|avatarSizeRef|stageHeightRef|onLayout=\{handleStageLayout\}/);
  assert.doesNotMatch(composer, /bubbleHeight|onBubbleLayout|composerToPickerGap/);
  assert.match(composer, /<YStack flex=\{1\} minHeight=\{0\} width="100%" paddingBottom=\{noteComposerLayoutTokens\.pickerKeyboardGap\}>[\s\S]*?<YStack flex=\{1\} minHeight=\{0\} alignItems="center" justifyContent="center"[\s\S]*?<XStack justifyContent="center" alignItems="center" gap=\{noteComposerLayoutTokens\.toolGap\}[\s\S]*?<ScrollView horizontal alignSelf="stretch" height=\{noteComposerLayoutTokens\.pickerHeight\}/);
  assert.match(composer, /keyboardDismissMode="none"/);
  assert.doesNotMatch(composer, /marginTop=\{noteComposerLayoutTokens\.toolToPickerGap\}/);
  assert.match(composer, /setSuggestionGroup\(tool\.kind\)/);
  assert.match(composer, /keyboardShouldPersistTaps="always" keyboardDismissMode="none"/);
  assert.match(tokens, /multilineAutoGrowMaxLines: 3/);
});

test("uses shared note composer dimensions for the fixed header and no-dismiss picker layout", () => {
  const screen = readSource("checkins", "pages", "MoodCheckInScreen.tsx");
  const composer = readSource("checkins", "components", "CheckInNoteComposer.tsx");
  assert.match(screen, /allowOverflow=\{noteStep\}/);
  assert.match(screen, /height=\{noteComposerLayoutTokens\.headerHeight\} paddingHorizontal=\{noteComposerLayoutTokens\.headerHorizontalInset\}/);
  assert.match(screen, /noteStep \? <KeyboardAvoidingView style=\{\{ flex: 1, minHeight: 0 \}\} behavior=\{Platform\.OS === "ios" \? "padding" : "height"\} keyboardVerticalOffset=\{0\}>\s*\{screen\}\s*<\/KeyboardAvoidingView> : screen/);
  assert.match(screen, /const screen = <AppScreen[\s\S]*?\{header\}[\s\S]*?<CheckInNoteComposer/);
  assert.match(screen, /<YStack flex=\{1\} minHeight=\{0\} width="100%" maxWidth=\{noteStep \? undefined/);
  assert.match(composer, /paddingBottom=\{noteComposerLayoutTokens\.pickerKeyboardGap\}/);
  assert.doesNotMatch(composer, /expandedTopPadding/);
  assert.match(composer, /gap: noteComposerLayoutTokens\.pickerGap/);
});

test("mode buttons switch one picker row without stealing keyboard focus", () => {
  const composer = readSource("checkins", "components", "CheckInNoteComposer.tsx");
  const iconButton = readFileSync(join(process.cwd(), "src", "shared", "components", "AppIconButton.tsx"), "utf8");
  assert.match(composer, /type SuggestionGroup = "gif" \| "emoji" \| "sticker"/);
  assert.match(composer, /suggestionGroup === "gif" \? gifs : suggestionGroup === "emoji" \? emojis : stickers/);
  assert.match(composer, /preventNativeFocus/);
  assert.match(iconButton, /focusable: false/);
  assert.match(iconButton, /sizeVariant === "large" \? noteComposerLayoutTokens\.pickerItemSize/);
  assert.match(iconButton, /borderRadius=\{tone === "composer" \? size \/ 2/);
  assert.match(composer, /setSuggestionGroup\(tool\.kind\)/);
  assert.doesNotMatch(composer, /badgeLabel|ComingSoonBadge|AppFilterChip/);
});
