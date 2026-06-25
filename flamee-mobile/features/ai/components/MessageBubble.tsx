import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { flameeTheme } from '@/constants/flameeTheme';
import type { AiMessage } from '@/features/ai/types';

export type MessageBubbleProps = {
  message: AiMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.author === 'user';

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      <AppText
        variant="bodySmall"
        color={isUser ? flameeTheme.colors.text.inverse : flameeTheme.colors.text.primary}>
        {message.text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: flameeTheme.radii.xl,
    maxWidth: '88%',
    paddingHorizontal: flameeTheme.spacing[4],
    paddingVertical: flameeTheme.spacing[3],
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: flameeTheme.colors.softCream,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: flameeTheme.colors.brand,
  },
});
