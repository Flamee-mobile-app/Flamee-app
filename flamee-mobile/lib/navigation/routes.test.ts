import { BOTTOM_NAV_ITEMS, isMainNavigationPath } from './routes';

describe('isMainNavigationPath', () => {
  test.each(['/home', '/memories', '/mood', '/missions', '/profile'])(
    'shows the bottom navigation on %s',
    (pathname) => {
      expect(isMainNavigationPath(pathname)).toBe(true);
    },
  );

  test.each(['/ai', '/dates', '/timeline', '/login'])(
    'hides the bottom navigation on %s',
    (pathname) => {
      expect(isMainNavigationPath(pathname)).toBe(false);
    },
  );
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
