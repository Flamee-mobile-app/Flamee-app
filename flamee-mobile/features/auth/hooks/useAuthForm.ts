import { useState } from 'react';
import type { ZodError } from 'zod';

import { loginSchema, registerSchema } from '@/features/auth/schemas/authSchema';
import { login, register } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { LoginFormValues, RegisterFormValues } from '@/features/auth/types';

type FieldErrors<TValues> = Partial<Record<keyof TValues, string>>;

function mapErrors<TValues extends Record<string, unknown>>(error: ZodError): FieldErrors<TValues> {
  return error.issues.reduce<FieldErrors<TValues>>((acc, issue) => {
    const key = issue.path[0] as keyof TValues | undefined;
    if (key) {
      acc[key] = issue.message;
    }
    return acc;
  }, {});
}

export function useLoginForm(onSuccess: () => void) {
  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState<FieldErrors<LoginFormValues>>({});
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);

  const update = <TKey extends keyof LoginFormValues>(key: TKey, value: LoginFormValues[TKey]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(mapErrors<LoginFormValues>(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const session = await login(parsed.data);
      setSession(session);
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return { values, errors, submitting, update, submit };
}

export function useRegisterForm(onSuccess: () => void) {
  const [values, setValues] = useState<RegisterFormValues>({
    phone: '',
    email: '',
    password: '',
    acceptedPolicy: false,
  });
  const [errors, setErrors] = useState<FieldErrors<RegisterFormValues>>({});
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);

  const update = <TKey extends keyof RegisterFormValues>(
    key: TKey,
    value: RegisterFormValues[TKey],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(mapErrors<RegisterFormValues>(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const session = await register(parsed.data);
      setSession(session);
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return { values, errors, submitting, update, submit };
}
