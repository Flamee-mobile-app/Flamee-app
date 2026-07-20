import type { ProfileData } from '@/features/profile/types';

const profile: ProfileData = {
  displayName: 'An',
  partnerName: 'Bình',
  streakDays: 21,
  relationshipLabel: '365 ngày yêu nhau',
  stats: [
    { label: 'Kỉ niệm', value: '42' },
    { label: 'Mission', value: '18' },
    { label: 'Mood', value: '96%' },
  ],
  menuItems: [
    {
      id: 'memories',
      title: 'Dòng thời gian',
      subtitle: 'Xem lại những cột mốc đáng nhớ',
      icon: 'time',
    },
    {
      id: 'settings',
      title: 'Cài đặt cặp đôi',
      subtitle: 'Tên gọi, ngày yêu và quyền riêng tư',
      icon: 'settings',
    },
    {
      id: 'support',
      title: 'Trợ giúp Flamee',
      subtitle: 'Gửi phản hồi và câu hỏi thường gặp',
      icon: 'help-circle',
    },
  ],
};

export async function getProfileData(): Promise<ProfileData> {
  return profile;
}
