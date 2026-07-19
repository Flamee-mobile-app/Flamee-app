import { isMainNavigationPath } from './routes';

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
