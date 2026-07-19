import { getBottomNavTabLayout } from './bottomNavLayout';

describe('getBottomNavTabLayout', () => {
  it.each([
    ['home', { left: 23, top: 15, width: 57 }],
    ['memories', { left: 100, top: 15, width: 60 }],
    ['missions', { left: 242, top: 12, width: 55 }],
    ['profile', { left: 321, top: 12, width: 34 }],
  ] as const)('returns the %s Figma position at 402px', (key, expected) => {
    expect(getBottomNavTabLayout(key, 402)).toEqual(expected);
  });

  it('scales only horizontal coordinates for a narrower bar', () => {
    expect(getBottomNavTabLayout('missions', 201)).toEqual({
      left: 121,
      top: 12,
      width: 27.5,
    });
  });
});
