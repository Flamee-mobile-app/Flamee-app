import { BOTTOM_NAV_ITEMS, isMainNavigationPath, ROUTES } from './routes';

describe('timeline and memory book navigation', () => {
  it('owns Timeline and Memory Book with separate routes', () => {
    expect(ROUTES.timeline).toBe('/(main)/timeline');
    expect(ROUTES.memoryBook).toBe('/(main)/memory-book');
    expect('memories' in ROUTES).toBe(false);
  });

  it('shows the bottom navigation on the Timeline and Memory Book routes', () => {
    expect(isMainNavigationPath('/timeline')).toBe(true);
    expect(isMainNavigationPath('/memory-book')).toBe(true);
  });

  it('routes Hoạt động to /timeline', () => {
    expect(BOTTOM_NAV_ITEMS.find((item) => item.key === 'timeline')).toEqual({
      key: 'timeline',
      label: 'Hoạt động',
      href: ROUTES.timeline,
    });
  });
});

describe('BOTTOM_NAV_ITEMS', () => {
  it('contains the four interactive tabs from Figma and excludes Mood', () => {
    expect(BOTTOM_NAV_ITEMS.map((item) => item.key)).toEqual([
      'home',
      'timeline',
      'missions',
      'profile',
    ]);
    expect(BOTTOM_NAV_ITEMS.map((item) => item.label)).toEqual([
      'Trang chủ',
      'Hoạt động',
      'Nhiệm vụ',
      'Hồ sơ',
    ]);
    expect(BOTTOM_NAV_ITEMS).toHaveLength(4);
  });
});
