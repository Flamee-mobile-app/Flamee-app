import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { TextField } from '@/shared/components/ui/TextField';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import type { MemoryBookDraft } from '@/features/memory-book/types';

const covers: MemoryBookDraft['coverAssetKey'][] = ['together', 'birthday', 'trip'];
export function MemoryBookForm({ draft, errors, submitLabel, onChange, onSubmit, onCancel }: { draft: Partial<MemoryBookDraft>; errors: Record<string, string>; submitLabel: string; onChange: (patch: Partial<MemoryBookDraft>) => void; onSubmit: () => void; onCancel: () => void }) {
  return <View style={styles.form}><TextField accessibilityLabel="Tiêu đề kỉ niệm" error={errors.title} label="Tiêu đề" onChangeText={(title) => onChange({ title })} value={draft.title ?? ''} /><TextField accessibilityLabel="Ngày kỉ niệm" error={errors.occurredOn} label="Ngày diễn ra" onChangeText={(occurredOn) => onChange({ occurredOn })} placeholder="YYYY-MM-DD" value={draft.occurredOn ?? ''} /><TextField accessibilityLabel="Ghi chú kỉ niệm" label="Ghi chú" multiline onChangeText={(note) => onChange({ note })} value={draft.note ?? ''} /><View><AppText variant="bodySmall">Ảnh bìa</AppText><View style={styles.covers}>{covers.map((cover) => <Pressable key={cover} accessibilityRole="button" accessibilityState={{ selected: draft.coverAssetKey === cover }} onPress={() => onChange({ coverAssetKey: cover })} style={[styles.coverChoice, draft.coverAssetKey === cover && styles.selected]}><AppText>{cover === 'together' ? 'Bên nhau' : cover === 'birthday' ? 'Sinh nhật' : 'Chuyến đi'}</AppText></Pressable>)}</View></View><View style={styles.actions}><Button title="Hủy" onPress={onCancel} variant="secondary" /><Button title={submitLabel} onPress={onSubmit} /></View></View>;
}
const styles = StyleSheet.create({ form: { gap: 18 }, covers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }, coverChoice: { borderColor: flameeTheme.colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 }, selected: { backgroundColor: flameeTheme.colors.brandLight, borderColor: flameeTheme.colors.brand }, actions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' } });
