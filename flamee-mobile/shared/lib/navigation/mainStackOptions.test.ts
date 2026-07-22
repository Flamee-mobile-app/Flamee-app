import {
  DETAIL_MAIN_SCREEN_OPTIONS,
  PERSISTENT_MAIN_SCREEN_OPTIONS,
  ROOT_MAIN_SCREEN_OPTIONS,
} from './mainStackOptions';

describe('main stack gesture options', () => {
  it('blocks gesture-back from the root main shell and persistent destinations', () => {
    expect(ROOT_MAIN_SCREEN_OPTIONS).toEqual({ gestureEnabled: false });
    expect(PERSISTENT_MAIN_SCREEN_OPTIONS).toEqual({
      animation: 'none',
      gestureEnabled: false,
    });
  });

  it('keeps pushed detail screens on their existing slide-from-right behaviour', () => {
    expect(DETAIL_MAIN_SCREEN_OPTIONS).toEqual({ animation: 'slide_from_right' });
    expect('gestureEnabled' in DETAIL_MAIN_SCREEN_OPTIONS).toBe(false);
  });
});
