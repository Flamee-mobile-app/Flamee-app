import { MAIN_NAV_ITEMS, ROUTES } from '@/lib/navigation/routes';

describe('routes', () => {
  it('maps onboarding and auth routes', () => {
    expect(ROUTES.start).toBe('/');
    expect(ROUTES.login).toBe('/(auth)/login');
    expect(ROUTES.register).toBe('/(auth)/register');
  });

  it('defines the five main bottom navigation targets', () => {
    expect(MAIN_NAV_ITEMS.map((item) => item.href)).toEqual([
      '/(main)/home',
      '/(main)/memories',
      '/(main)/mood',
      '/(main)/missions',
      '/(main)/profile',
    ]);
  });
});
