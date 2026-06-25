import { loginSchema, registerSchema } from '@/features/auth/schemas/authSchema';

describe('auth schemas', () => {
  it('accepts a valid login payload', () => {
    expect(loginSchema.parse({ email: 'love@flamee.app', password: 'secret123' })).toEqual({
      email: 'love@flamee.app',
      password: 'secret123',
      remember: false,
    });
  });

  it('rejects invalid email for login', () => {
    expect(() => loginSchema.parse({ email: 'bad', password: 'secret123' })).toThrow();
  });

  it('requires registration consent', () => {
    expect(() =>
      registerSchema.parse({
        phone: '0901234567',
        email: 'love@flamee.app',
        password: 'secret123',
        acceptedPolicy: false,
      }),
    ).toThrow();
  });
});
