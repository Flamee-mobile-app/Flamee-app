import { ScrollView, StyleSheet } from 'react-native';
import { MemoryBookForm } from '@/features/memory-book/components/MemoryBookForm';
import { AppText } from '@/shared/components/ui/AppText';
import { useAppSafeArea } from '@/shared/hooks';
import type { MemoryBookDraft } from '@/features/memory-book/types';

export function EditMemoryBookScreen(props: {
  draft: Partial<MemoryBookDraft>;
  errors: Record<string, string>;
  onChange: (patch: Partial<MemoryBookDraft>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const safeArea = useAppSafeArea();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { paddingTop: safeArea.top + 16, paddingBottom: safeArea.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}>
      <AppText style={styles.title} variant="heading">
        Chỉnh sửa kỉ niệm
      </AppText>
      <MemoryBookForm
        draft={props.draft}
        errors={props.errors}
        onCancel={props.onClose}
        onChange={props.onChange}
        onSubmit={props.onSave}
        submitLabel="Lưu thay đổi"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFDFB',
    flexGrow: 1,
    gap: 28,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
  },
});
