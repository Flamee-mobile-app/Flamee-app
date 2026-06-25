export type AiSuggestion = {
  id: string;
  title: string;
  prompt: string;
};

export type AiMessage = {
  id: string;
  author: 'assistant' | 'user';
  text: string;
};

export type AiChatSeed = {
  suggestions: AiSuggestion[];
  messages: AiMessage[];
};
