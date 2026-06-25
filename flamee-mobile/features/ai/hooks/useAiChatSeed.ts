import { useQuery } from '@tanstack/react-query';

import { getAiChatSeed } from '@/features/ai/services/aiService';

export function useAiChatSeed() {
  return useQuery({
    queryKey: ['ai-chat-seed'],
    queryFn: getAiChatSeed,
  });
}
