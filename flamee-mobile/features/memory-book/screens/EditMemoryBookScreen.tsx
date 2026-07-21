import { ScrollView, StyleSheet, View } from 'react-native';

import { MemoryBookForm } from '@/features/memory-book/components/MemoryBookForm';
import type { MemoryBookDraft } from '@/features/memory-book/types';
import { AppText } from '@/shared/components/ui/AppText';
import { useAppSafeArea } from '@/shared/hooks';

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
        { paddingTop: safeArea.top + 16, paddingBottom: safeArea.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <AppText style={styles.titleText}>Chỉnh sửa kỷ niệm</AppText>
      </View>
      <MemoryBookForm
        draft={props.draft}
        errors={props.errors}
        isEditMode={true}
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
    gap: 20,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 4,
    marginTop: 4,
  },
  titleText: {
    color: '#FF7E67',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});

