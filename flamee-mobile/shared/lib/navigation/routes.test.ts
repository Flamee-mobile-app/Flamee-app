import { BOTTOM_NAV_ITEMS, isMainNavigationPath, ROUTES } from './routes';

describe('memories navigation', () => {
  it('uses /memories as the only memories route', () => {
    expect(ROUTES.memories).toBe('/(main)/memories');
    expect('timeline' in ROUTES).toBe(false);
    expect(Object.values(ROUTES).some((href) => String(href).includes('/timeline'))).toBe(false);
  });

  it('shows the bottom navigation on /memories', () => {
    expect(isMainNavigationPath('/memories')).toBe(true);
  });

  it('routes Hoạt động to /memories', () => {
    expect(BOTTOM_NAV_ITEMS.find((item) => item.key === 'memories')).toEqual({
      key: 'memories',
      label: 'Hoạt động',
      href: ROUTES.memories,
    });
  });
});

describe('BOTTOM_NAV_ITEMS', () => {
  it('contains the four interactive tabs from Figma and excludes Mood', () => {
    expect(BOTTOM_NAV_ITEMS.map((item) => item.key)).toEqual([
      'home',
      'memories',
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
