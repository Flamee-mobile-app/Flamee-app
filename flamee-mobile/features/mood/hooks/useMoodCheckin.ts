import { useState } from 'react';

import { MOOD_CHECKIN_OPTIONS, saveMoodCheckin } from '../services/moodService';
import type { MoodCheckinDraft, MoodCheckinItem, MoodEntry } from '../types';

export function useMoodCheckin(initialMoodId: string = 'happy_great') {
  const defaultIndex = Math.max(
    0,
    MOOD_CHECKIN_OPTIONS.findIndex((opt) => opt.id === initialMoodId),
  );

  const [selectedIndex, setSelectedIndex] = useState<number>(defaultIndex);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedEntry, setSavedEntry] = useState<MoodEntry | null>(null);

  const selectedOption: MoodCheckinItem =
    MOOD_CHECKIN_OPTIONS[selectedIndex] || MOOD_CHECKIN_OPTIONS[0];

  const selectMoodByIndex = (index: number) => {
    if (index >= 0 && index < MOOD_CHECKIN_OPTIONS.length) {
      setSelectedIndex(index);
    }
  };

  const selectMoodOption = (option: MoodCheckinItem) => {
    const idx = MOOD_CHECKIN_OPTIONS.findIndex((opt) => opt.id === option.id);
    if (idx !== -1) {
      setSelectedIndex(idx);
    }
  };

  const reset = () => {
    setSelectedIndex(defaultIndex);
    setNote('');
    setIsSubmitting(false);
    setSavedEntry(null);
  };

  const submit = async (onSuccess?: (entry: MoodEntry) => void) => {
    try {
      setIsSubmitting(true);
      const draft: MoodCheckinDraft = {
        selectedMood: selectedOption.mood,
        selectedLabel: selectedOption.label,
        note: note.trim(),
      };
      const entry = await saveMoodCheckin(draft);
      setSavedEntry(entry);
      setIsSubmitting(false);
      onSuccess?.(entry);
      return entry;
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  return {
    selectedIndex,
    selectedOption,
    note,
    isSubmitting,
    savedEntry,
    options: MOOD_CHECKIN_OPTIONS,
    selectMoodByIndex,
    selectMoodOption,
    setNote,
    reset,
    submit,
  };
}
