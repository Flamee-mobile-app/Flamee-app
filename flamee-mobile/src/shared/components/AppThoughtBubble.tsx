import type { PropsWithChildren, ReactNode } from "react";
import { YStack } from "tamagui";
import { noteComposerLayoutTokens } from "../constants/tokens";

type Props = PropsWithChildren<{ density?: "regular" | "compact" | "composer"; footer?: ReactNode; fitContent?: boolean; showTail?: boolean }>;

export function AppThoughtBubble({ children, density = "regular", footer, fitContent = false, showTail = true }: Props) {
  const compact = density === "compact";
  const composer = density === "composer";
  return <YStack alignSelf="stretch" width={composer ? "100%" : undefined} alignItems="center">
    <YStack alignSelf={composer || fitContent ? "center" : "stretch"} minWidth={composer ? noteComposerLayoutTokens.bubbleMinWidth : undefined}
      maxWidth={composer ? noteComposerLayoutTokens.bubbleMaxWidth : fitContent ? "100%" : undefined} alignItems="center" gap={composer ? 0 : compact ? 2 : "$xs"}>
    <YStack alignSelf={fitContent ? "center" : "stretch"} minWidth={composer ? noteComposerLayoutTokens.bubbleMinWidth : undefined}
      minHeight={composer ? noteComposerLayoutTokens.bubbleMinHeight : undefined} width={composer ? undefined : fitContent ? undefined : "100%"} maxWidth={fitContent ? "100%" : undefined}
      backgroundColor={composer ? "$white" : "$supportPeachLight"} borderWidth={composer ? noteComposerLayoutTokens.bubbleBorderWidth : 0}
      borderColor={composer ? "$border" : "transparent"} borderRadius={composer ? noteComposerLayoutTokens.bubbleRadius : compact ? "$lg" : "$xl"}
      padding={compact ? "$sm" : composer ? undefined : "$md"}
      paddingHorizontal={composer ? noteComposerLayoutTokens.bubblePaddingHorizontal : undefined}
      paddingVertical={composer ? noteComposerLayoutTokens.bubblePaddingVertical : undefined}
      marginBottom={composer ? noteComposerLayoutTokens.bubbleToLargeTailGap : undefined}>
      {children}
    </YStack>
    {showTail ? <><YStack alignSelf="center" transform={composer ? [{ translateX: -noteComposerLayoutTokens.thoughtTailOffsetX }] : undefined}
      width={composer ? noteComposerLayoutTokens.largeTailSize : compact ? 8 : 10}
      height={composer ? noteComposerLayoutTokens.largeTailSize : compact ? 8 : 10}
      borderRadius={composer ? noteComposerLayoutTokens.largeTailRadius : 6}
      backgroundColor={composer ? "$white" : "$supportPeachLight"} borderWidth={composer ? noteComposerLayoutTokens.bubbleBorderWidth : 0}
      borderColor={composer ? "$border" : "transparent"}
      marginBottom={composer ? noteComposerLayoutTokens.largeToSmallTailGap : undefined} />
    <YStack alignSelf="center" transform={composer ? [{ translateX: -noteComposerLayoutTokens.thoughtTailOffsetX }] : undefined}
      width={composer ? noteComposerLayoutTokens.smallTailSize : compact ? 5 : 6}
      height={composer ? noteComposerLayoutTokens.smallTailSize : compact ? 5 : 6}
      borderRadius={composer ? noteComposerLayoutTokens.smallTailRadius : 4}
      backgroundColor={composer ? "$white" : "$supportPeachLight"} borderWidth={composer ? noteComposerLayoutTokens.bubbleBorderWidth : 0}
      borderColor={composer ? "$border" : "transparent"}
      marginBottom={composer ? noteComposerLayoutTokens.smallTailToAvatarGap : undefined} /></> : null}
    {composer ? footer : null}
    </YStack>
  </YStack>;
}
