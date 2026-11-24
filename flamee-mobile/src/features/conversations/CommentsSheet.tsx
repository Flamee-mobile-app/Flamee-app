import { AppSheet } from "../../shared/components";
import { getMessage } from "../../shared/localization/messages";
import { CommentsPanel } from "./CommentsPanel";
import { useConversationContext } from "./useConversationContext";

export function CommentsSheet({ memoryId, title, open, onClose, onAfterClose }: { memoryId: string; title?: string; open: boolean; onClose: () => void; onAfterClose: () => void }) {
  const { key } = useConversationContext();
  return <AppSheet open={open} fitContent disableDrag title={getMessage("vi", "conversationTitle")} description={title} onOpenChange={(next) => { if (!next) onClose(); }} onAfterClose={onAfterClose}
    renderBody={({ maxHeight }) => <CommentsPanel key={`${key}:${memoryId}`} memoryId={memoryId} height={maxHeight} enabled={open} />} />;
}
