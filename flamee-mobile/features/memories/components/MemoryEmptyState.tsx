import { StateView } from '@/components/ui/StateView';

export type MemoryEmptyStateProps = {
  onClearFilter: () => void;
};

export function MemoryEmptyState({
  onClearFilter,
}: MemoryEmptyStateProps) {
  return (
    <StateView
      actionLabel="Xóa bộ lọc"
      description="Thử thay đổi bộ lọc để xem lại những cột mốc của hai bạn."
      onAction={onClearFilter}
      title="Chưa tìm thấy cột mốc"
    />
  );
}
