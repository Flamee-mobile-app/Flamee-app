import type {
  TimelineRangeFilter,
  TimelineRecurrence,
  TimelineStatusFilter,
  TimelineType,
  TimelineTypeFilter,
  ReminderLeadDays,
  ReminderRecipient,
} from '@/features/timeline/types';

export type TimelineTypeOption = {
  value: TimelineType;
  label: string;
  description: string;
};

export const TIMELINE_TYPE_OPTIONS: readonly TimelineTypeOption[] = [
  {
    value: 'together',
    label: 'Ngày bên nhau',
    description: 'Đếm những ngày mình có nhau',
  },
  {
    value: 'birthday',
    label: 'Sinh nhật',
    description: 'Ngày đặc biệt của hai đứa',
  },
  {
    value: 'anniversary',
    label: 'Ngày kỉ niệm',
    description: 'Lưu lại một dấu mốc đáng nhớ',
  },
  {
    value: 'special',
    label: 'Ngày đặc biệt',
    description: 'Một điều chỉ hai mình hiểu',
  },
  {
    value: 'holiday',
    label: 'Ngày lễ',
    description: 'Hẹn nhau vào dịp lễ sắp tới',
  },
  {
    value: 'custom',
    label: 'Tự tạo',
    description: 'Tạo cột mốc theo cách của bạn',
  },
];

export const TIMELINE_TYPE_LABELS: Record<TimelineTypeFilter, string> = {
  all: 'Tất cả',
  together: 'Ngày bên nhau',
  birthday: 'Sinh nhật',
  anniversary: 'Ngày kỉ niệm',
  special: 'Ngày đặc biệt',
  holiday: 'Ngày lễ',
  custom: 'Tự tạo',
};

export const TIMELINE_STATUS_LABELS: Record<TimelineStatusFilter, string> = {
  all: 'Tất cả',
  upcoming: 'Sắp tới',
  past: 'Đã qua',
};

export const TIMELINE_RANGE_LABELS: Record<TimelineRangeFilter, string> = {
  all: 'Tất cả',
  next30: '30 ngày tới',
  past: 'Đã qua',
};

export const TIMELINE_RECURRENCE_LABELS: Record<TimelineRecurrence, string> = {
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
