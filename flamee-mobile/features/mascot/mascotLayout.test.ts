import {
  getMascotBottomOffset,
  getMascotHaloActionFrame,
  getMascotHaloBubbleFrame,
  MASCOT_ACTION_HIT_SIZE,
  MASCOT_VISUAL_SIZE,
  resolveMascotHaloLayout,
} from './mascotLayout';

describe('getMascotBottomOffset', () => {
  it('derives clearance from the measured Bottom Navigation instead of a device position', () => {
    expect(
      getMascotBottomOffset({
        bottomNavFrame: { y: 700, height: 72 },
        safeBottom: 34,
        windowHeight: 874,
      }),
    ).toBe(192);
  });

  it('uses the shared navigation height only until the Bottom Navigation has been measured', () => {
    expect(getMascotBottomOffset({ bottomNavFrame: null, safeBottom: 34, windowHeight: 874 })).toBe(
      90,
    );
  });
});

describe('resolveMascotHaloLayout', () => {
  const narrowInput = {
    window: { width: 320, height: 640 },
    safeArea: { left: 0, right: 0, bottom: 16 },
    bottomNavFrame: { y: 552, height: 72 },
  };

  it('calculates layout with 64px mascot visual size and 36px action icons', () => {
    const layout = resolveMascotHaloLayout(narrowInput);

    expect(layout.actions).toHaveLength(2);
    expect(MASCOT_ACTION_HIT_SIZE).toBe(36);
    expect(MASCOT_VISUAL_SIZE).toBe(64);
  });

  it('keeps speech bubble layout within narrow viewport limits', () => {
    const layout = resolveMascotHaloLayout(narrowInput);
    const bubble = getMascotHaloBubbleFrame(layout);

    expect(bubble.width).toBeGreaterThanOrEqual(220);
    expect(bubble.width).toBeLessThanOrEqual(280);
  });
});

