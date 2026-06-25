import { useQuery } from '@tanstack/react-query';

import { getProfileData } from '@/features/profile/services/profileService';

export function useProfileData() {
  return useQuery({
    queryKey: ['profile-data'],
    queryFn: getProfileData,
  });
}
