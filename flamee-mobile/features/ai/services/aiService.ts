import type { AiChatSeed } from '@/features/ai/types';

const chatSeed: AiChatSeed = {
  messages: [
    {
      id: 'welcome',
      author: 'assistant',
      text: 'Flamee AI sẵn sàng gợi ý một lời nhắn, lịch hẹn hoặc nhiệm vụ nhỏ cho hai bạn.',
    },
  ],
  suggestions: [
    {
      id: 'message',
      title: 'Viết lời nhắn dễ thương',
      prompt: 'Gợi ý một lời nhắn ngắn để động viên người yêu sau một ngày dài.',
    },
    {
      id: 'date',
      title: 'Lên plan hẹn hò',
      prompt: 'Gợi ý một buổi hẹn cuối tuần nhẹ nhàng và tiết kiệm.',
    },
    {
      id: 'mission',
      title: 'Tạo tiny mission',
      prompt: 'Tạo một nhiệm vụ nhỏ để hai người quan tâm nhau hơn hôm nay.',
    },
  ],
};

export async function getAiChatSeed(): Promise<AiChatSeed> {
  return chatSeed;
}
