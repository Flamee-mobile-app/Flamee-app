import { Stack } from 'expo-router';

import { AuthGroupGuard } from '@/features/auth/components/AuthGroupGuard';

export default function AuthLayout() {
  return (
    <AuthGroupGuard group="auth">
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGroupGuard>
  );
}
