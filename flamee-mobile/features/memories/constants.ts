import type { ImageSourcePropType } from 'react-native';

import type {
  MemoryRangeFilter,
  MemoryRecurrence,
  MemoryStatusFilter,
  MemoryType,
  MemoryTypeFilter,
  ReminderLeadDays,
  ReminderRecipient,
} from '@/features/memories/types';

export const MEMORY_ASSETS = {
  hero: require('../../assets/memories/relationship-hero.jpg'),
  together: require('../../assets/memories/memory-together.png'),
  birthday: require('../../assets/memories/memory-birthday.png'),
  anniversary: require('../../assets/memories/memory-anniversary.png'),
  special: require('../../assets/memories/memory-special.png'),
  holiday: require('../../assets/memories/memory-holiday.png'),
  custom: require('../../assets/memories/memory-custom.png'),
  movie: require('../../assets/memories/memory-movie.png'),
  trip: require('../../assets/memories/memory-trip.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export type MemoryTypeOption = {
  value: MemoryType;
  label: string;
  description: string;
  asset: ImageSourcePropType;
};

export const MEMORY_TYPE_OPTIONS: readonly MemoryTypeOption[] = [
  {
    value: 'together',
    label: 'Ngày bên nhau',
    description: 'Đếm những ngày mình có nhau',
    asset: MEMORY_ASSETS.together,
  },
  {
    value: 'birthday',
    label: 'Sinh nhật',
    description: 'Ngày đặc biệt của hai đứa',
    asset: MEMORY_ASSETS.birthday,
  },
  {
    value: 'anniversary',
    label: 'Ngày kỉ niệm',
    description: 'Lưu lại một dấu mốc đáng nhớ',
    asset: MEMORY_ASSETS.anniversary,
  },
  {
    value: 'special',
    label: 'Ngày đặc biệt',
    description: 'Một điều chỉ hai mình hiểu',
    asset: MEMORY_ASSETS.special,
  },
  {
    value: 'holiday',
    label: 'Ngày lễ',
    description: 'Hẹn nhau vào dịp lễ sắp tới',
    asset: MEMORY_ASSETS.holiday,
  },
  {
    value: 'custom',
    label: 'Tự tạo',
    description: 'Tạo cột mốc theo cách của bạn',
    asset: MEMORY_ASSETS.custom,
  },
];

export const MEMORY_TYPE_LABELS: Record<MemoryTypeFilter, string> = {
  all: 'Tất cả',
  together: 'Ngày bên nhau',
  birthday: 'Sinh nhật',
  anniversary: 'Ngày kỉ niệm',
  special: 'Ngày đặc biệt',
  holiday: 'Ngày lễ',
  custom: 'Tự tạo',
};

export const MEMORY_STATUS_LABELS: Record<MemoryStatusFilter, string> = {
  all: 'Tất cả',
  upcoming: 'Sắp tới',
  past: 'Đã qua',
};

export const MEMORY_RANGE_LABELS: Record<MemoryRangeFilter, string> = {
  all: 'Tất cả',
  next30: '30 ngày tới',
  past: 'Đã qua',
};

export const MEMORY_RECURRENCE_LABELS: Record<MemoryRecurrence, string> = {
  none: 'Không lặp lại',
  monthly: 'Hàng tháng',
  yearly: 'Hàng năm',
};

export const REMINDER_LEAD_LABELS: Record<ReminderLeadDays, string> = {
  1: 'Trước 1 ngày',
  3: 'Trước 3 ngày',
  7: 'Trước 7 ngày',
};

export const REMINDER_RECIPIENT_LABELS: Record<ReminderRecipient, string> = {
  couple: 'Cả hai',
  self: 'Chỉ mình tôi',
};
