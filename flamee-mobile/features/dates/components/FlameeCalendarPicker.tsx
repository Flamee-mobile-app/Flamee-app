import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { flameeFonts } from '@/shared/constants/flameeTheme';

export type FlameeCalendarPickerProps = {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export function FlameeCalendarPicker({
  selectedDate,
  onSelectDate,
}: FlameeCalendarPickerProps) {
  // Parse initial date
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(
    isNaN(initialDate.getTime()) ? 2026 : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    isNaN(initialDate.getTime()) ? 4 : initialDate.getMonth() // 0-indexed
  );

  // Month navigation helpers
  const handlePrevMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calculate calendar cells
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const gridCells = [];

  // Prev month padding days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    gridCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateString: '',
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const monthStr = viewMonth + 1 < 10 ? `0${viewMonth + 1}` : `${viewMonth + 1}`;
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateString = `${viewYear}-${monthStr}-${dayStr}`;

    gridCells.push({
      day: d,
      isCurrentMonth: true,
      dateString,
    });
  }

  // Next month padding days to complete 7-column rows
  const remainingCells = (7 - (gridCells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    gridCells.push({
      day: i,
      isCurrentMonth: false,
      dateString: '',
    });
  }

  return (
    <View style={styles.calendarCard}>
      {/* Month & Year Navigation Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={18} color="#2B2B2B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>

        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color="#2B2B2B" />
        </TouchableOpacity>
      </View>

      {/* Weekday Row Header */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((dayName, idx) => (
          <Text key={idx} style={styles.weekdayText}>
            {dayName}
          </Text>
        ))}
      </View>

      {/* Calendar Days 7-Column Grid */}
      <View style={styles.daysGrid}>
        {gridCells.map((cell, idx) => {
          const isSelected = cell.isCurrentMonth && cell.dateString === selectedDate;

          return (
            <TouchableOpacity
              key={idx}
              disabled={!cell.isCurrentMonth}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
              onPress={() => {
                if (cell.dateString) {
                  Haptics.selectionAsync();
                  onSelectDate(cell.dateString);
                }
              }}
            >
              <Text
                style={[
                  styles.dayText,
                  !cell.isCurrentMonth && styles.dayTextDisabled,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {cell.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    padding: 16,
    marginVertical: 8,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  navBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 16,
    color: '#2B2B2B',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#888888',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  dayCell: {
    width: '14.28%', // 100% / 7 columns
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#FF7158',
    borderRadius: 18,
  },
  dayText: {
    fontFamily: flameeFonts.bold,
    fontSize: 14,
    color: '#2B2B2B',
  },
  dayTextDisabled: {
    color: '#D0D0D0',
    fontFamily: flameeFonts.medium,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.bold,
  },
});
