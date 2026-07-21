import { StateView } from '@/shared/components/ui/StateView';

export type TimelineEmptyStateProps = {
  onClearFilter: () => void;
};

export function TimelineEmptyState({
  onClearFilter,
}: TimelineEmptyStateProps) {
  return (
    <StateView
      actionLabel="Xóa bộ lọc"
      description="Thử thay đổi bộ lọc để xem lại những cột mốc của hai bạn."
      onAction={onClearFilter}
      title="Chưa tìm thấy cột mốc"
    />
  );
}
