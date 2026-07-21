import { ScrollView, StyleSheet } from 'react-native';
import { MemoryBookForm } from '@/features/memory-book/components/MemoryBookForm';
import { AppText } from '@/shared/components/ui/AppText';
import type { MemoryBookDraft } from '@/features/memory-book/types';
export function CreateMemoryBookScreen(props: { draft: Partial<MemoryBookDraft>; errors: Record<string,string>; onChange: (patch: Partial<MemoryBookDraft>) => void; onSave: () => void; onClose: () => void }) { return <ScrollView contentContainerStyle={styles.page}><AppText style={styles.title} variant="heading">Thêm kỉ niệm mới</AppText><MemoryBookForm draft={props.draft} errors={props.errors} onCancel={props.onClose} onChange={props.onChange} onSubmit={props.onSave} submitLabel="Lưu kỉ niệm"/></ScrollView> }
const styles = StyleSheet.create({ page: { backgroundColor: '#FFFDFB', flexGrow: 1, gap: 28, padding: 20, paddingTop: 56 }, title: { fontSize: 30 } });
