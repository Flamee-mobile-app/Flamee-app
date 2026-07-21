import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { TextField } from '@/shared/components/ui/TextField';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { TIMELINE_RECURRENCE_LABELS } from '@/features/timeline/timelineConstants';
import { TIMELINE_LAYOUT } from '@/features/timeline/timelineLayout';
import type {
  TimelineDraft,
  TimelineRecurrence,
} from '@/features/timeline/types';

import { TimelineChip } from './TimelineChip';

const RECURRENCE_OPTIONS: readonly TimelineRecurrence[] = [
  'none',
  'monthly',
  'yearly',
];

export type TimelineDetailsFormProps = {
  draft: Partial<TimelineDraft>;
  errors: Record<string, string>;
  onChange: (patch: Partial<TimelineDraft>) => void;
  includeNote?: boolean;
  noteLabel?: string;
};

export function TimelineDetailsForm({
  draft,
  errors,
  onChange,
  includeNote = false,
  noteLabel = 'Ghi chú (không bắt buộc)',
}: TimelineDetailsFormProps) {
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
            <TimelineChip
              key={recurrence}
              label={TIMELINE_RECURRENCE_LABELS[recurrence]}
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
          label={noteLabel}
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
    minHeight: TIMELINE_LAYOUT.inputMinHeight,
  },
  note: {
    height: 104,
    paddingTop: flameeTheme.spacing[3],
  },
});
