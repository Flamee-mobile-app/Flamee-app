import { flameeTheme } from '@/constants/flameeTheme';

describe('flameeTheme', () => {
  it('exposes Figma-derived brand and surface colors', () => {
    expect(flameeTheme.colors.brand).toBe('#FF7158');
    expect(flameeTheme.colors.cream).toBe('#FFF1E4');
    expect(flameeTheme.colors.text.secondary).toBe('#555555');
  });

  it('uses a consistent spacing scale', () => {
    expect(flameeTheme.spacing[1]).toBe(4);
    expect(flameeTheme.spacing[6]).toBe(24);
    expect(flameeTheme.spacing[12]).toBe(48);
  });

  it('defines typography variants used by the shared text primitive', () => {
    expect(flameeTheme.typography.display.fontSize).toBe(32);
    expect(flameeTheme.typography.sectionTitle.fontSize).toBe(20);
    expect(flameeTheme.typography.caption.fontSize).toBe(12);
  });
});
