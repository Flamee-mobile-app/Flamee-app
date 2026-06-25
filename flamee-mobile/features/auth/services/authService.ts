import type { AuthSession, LoginFormValues, RegisterFormValues } from '@/features/auth/types';

export async function login(values: LoginFormValues): Promise<AuthSession> {
  return {
    userId: 'demo-user',
    displayName: 'An & Bình',
    email: values.email,
  };
}

export async function register(values: RegisterFormValues): Promise<AuthSession> {
  return {
    userId: 'demo-user',
    displayName: 'An & Bình',
    email: values.email,
  };
}
