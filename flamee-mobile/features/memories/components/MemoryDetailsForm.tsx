import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import { flameeTheme } from '@/constants/flameeTheme';
import { MEMORY_RECURRENCE_LABELS } from '@/features/memories/constants';
import { MEMORY_LAYOUT } from '@/features/memories/memoryLayout';
import type {
  MemoryDraft,
  MemoryRecurrence,
} from '@/features/memories/types';

import { MemoryChip } from './MemoryChip';

const RECURRENCE_OPTIONS: readonly MemoryRecurrence[] = [
  'none',
  'monthly',
  'yearly',
];

export type MemoryDetailsFormProps = {
  draft: Partial<MemoryDraft>;
  errors: Record<string, string>;
  onChange: (patch: Partial<MemoryDraft>) => void;
  includeNote?: boolean;
};

export function MemoryDetailsForm({
  draft,
  errors,
  onChange,
  includeNote = false,
}: MemoryDetailsFormProps) {
  return (
    <View style={styles.container}>
      <TextField
        accessibilityLabel="Tên cột mốc"
        error={errors.title}
        label="Tên cột mốc"
        onChangeText={(title) => onChange({ title })}
        placeholder="Ví dụ: Ngày đầu tiên gặp nhau"
        style={styles.input}
        value={draft.title ?? ''}
      />
      <TextField
        accessibilityLabel="Ngày diễn ra"
        autoCapitalize="none"
        error={errors.eventDate}
        label="Ngày diễn ra"
        onChangeText={(eventDate) => onChange({ eventDate })}
        placeholder="YYYY-MM-DD"
        style={styles.input}
        value={draft.eventDate ?? ''}
      />
      <View style={styles.field}>
        <AppText variant="bodySmall">Lặp lại</AppText>
        <View style={styles.chips}>
          {RECURRENCE_OPTIONS.map((recurrence) => (
            <MemoryChip
              key={recurrence}
              label={MEMORY_RECURRENCE_LABELS[recurrence]}
              onPress={() => onChange({ recurrence })}
              selected={draft.recurrence === recurrence}
            />
          ))}
        </View>
        {errors.recurrence ? (
          <AppText color={flameeTheme.colors.accentRed} variant="caption">
            {errors.recurrence}
          </AppText>
        ) : null}
      </View>
      {includeNote ? (
        <TextField
          accessibilityLabel="Ghi chú"
          error={errors.note}
          label="Ghi chú (không bắt buộc)"
          multiline
          onChangeText={(note) => onChange({ note })}
          placeholder="Viết một điều bạn muốn nhớ..."
          style={[styles.input, styles.note]}
          textAlignVertical="top"
          value={draft.note ?? ''}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: flameeTheme.spacing[2],
  },
  container: {
    gap: flameeTheme.spacing[5],
  },
  field: {
    gap: flameeTheme.spacing[2],
  },
  input: {
    backgroundColor: '#FFFFFF',
    minHeight: MEMORY_LAYOUT.inputMinHeight,
  },
  note: {
    height: 104,
    paddingTop: flameeTheme.spacing[3],
  },
});
