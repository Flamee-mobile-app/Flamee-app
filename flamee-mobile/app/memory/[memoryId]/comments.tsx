import { useLocalSearchParams } from "expo-router";
import { MemoryConversationScreen } from "../../../src/features/conversations";
export default function CommentsRoute() {
  const { memoryId, commentId } = useLocalSearchParams<{ memoryId: string; commentId?: string }>();
  return <MemoryConversationScreen memoryId={memoryId} commentId={commentId} />;
}
