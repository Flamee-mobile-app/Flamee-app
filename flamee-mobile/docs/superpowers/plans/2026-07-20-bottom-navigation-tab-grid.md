# Figma Bottom Navigation Tab Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place and route the four Bottom Navigation tabs using the exact Figma 402px baseline on every device width.

**Architecture:** A pure UI-layout module owns immutable Figma tab coordinates and transforms them to numeric React Native pixels. `BottomNav` measures its own bar through `onLayout` and consumes the calculated styles; route metadata remains its current single source of truth.

**Tech Stack:** Expo Router 6, React Native 0.81, TypeScript, Jest Expo, React Native Testing Library.

## Global Constraints

- Keep Figma mapping: home → `/(main)/home`, memories → `/(main)/memories`, missions → `/(main)/missions`, profile → `/(main)/profile`.
- Keep the 72px bar, existing inline SVG notch and logo, 32px glyphs, 10px captions and centre decorative logo.
- Use numeric React Native positions derived from Figma's 402px baseline; no `%` values for tab position or width.
- Keep `mood` as a display-only navigation path and do not add a fifth tab.
- Do not change Stack routing or the remaining main-screen visibility behaviour.

---

### Task 1: Add a tested Figma tab-layout transform

**Files:**
- Create: `components/ui/bottomNavLayout.ts`
- Create: `components/ui/bottomNavLayout.test.ts`

**Interfaces:**
- Produces `FIGMA_BOTTOM_NAV_WIDTH = 402`, `getBottomNavTabLayout(key, barWidth)` and a `BottomNavTabLayout` style type.
- Consumes `BottomNavItem['key']`.
- `BottomNav` will consume numeric `left`, `top` and `width` returned from the helper.

- [x] **Step 1: Write the failing Figma-coordinate tests**

```ts
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
```

- [x] **Step 2: Verify the test is red**

Run: `npx jest components/ui/bottomNavLayout.test.ts --runInBand --config '{"preset":"jest-expo"}'`

Expected: FAIL because `bottomNavLayout` does not exist.

- [x] **Step 3: Implement the minimal layout module**

```ts
import type { ViewStyle } from 'react-native';

import type { BottomNavItem } from '@/lib/navigation/routes';

export const FIGMA_BOTTOM_NAV_WIDTH = 402;

type FigmaTabLayout = Readonly<{ left: number; top: number; width: number }>;
export type BottomNavTabLayout = Pick<ViewStyle, 'left' | 'top' | 'width'>;

const FIGMA_TAB_LAYOUT: Record<BottomNavItem['key'], FigmaTabLayout> = {
  home: { left: 23, top: 15, width: 57 },
  memories: { left: 100, top: 15, width: 60 },
  missions: { left: 242, top: 12, width: 55 },
  profile: { left: 321, top: 12, width: 34 },
};

export function getBottomNavTabLayout(
  key: BottomNavItem['key'],
  barWidth: number,
): BottomNavTabLayout {
  const layout = FIGMA_TAB_LAYOUT[key];
  const scale = barWidth / FIGMA_BOTTOM_NAV_WIDTH;

  return { left: layout.left * scale, top: layout.top, width: layout.width * scale };
}
```

- [x] **Step 4: Verify the layout test is green**

Run: `npx jest components/ui/bottomNavLayout.test.ts --runInBand --config '{"preset":"jest-expo"}'`

Expected: PASS with 5 tests.

### Task 2: Measure the bar and route every tab correctly

**Files:**
- Modify: `components/ui/BottomNav.tsx`
- Modify: `components/ui/BottomNav.test.tsx`

**Interfaces:**
- Consumes `getBottomNavTabLayout(item.key, barWidth)` and `ROUTES`.
- Produces four pressable tab wrappers at Figma coordinates and calls `router.replace()` for the matching route.

- [x] **Step 1: Replace the single-route test and add the failing measured-grid test**

```tsx
it.each([
  ['Trang chủ', ROUTES.home],
  ['Hoạt động', ROUTES.memories],
  ['Nhiệm vụ', ROUTES.missions],
  ['Hồ sơ', ROUTES.profile],
] as const)('replaces the route when %s is pressed', async (label, route) => {
  const { getByRole } = await render(<BottomNav />);

  fireEvent.press(getByRole('tab', { name: label }));

  expect(mockReplace).toHaveBeenCalledWith(route);
});

it('uses measured numeric Figma coordinates after the bar is laid out', async () => {
  const { getByRole, getByTestId } = await render(<BottomNav />);

  fireEvent(getByTestId('bottom-nav-bar'), 'layout', {
    nativeEvent: { layout: { width: 201 } },
  });

  expect(getByRole('tab', { name: 'Nhiệm vụ' }).props.style).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ left: 121, top: 12, width: 27.5 }),
    ]),
  );
});
```

- [x] **Step 2: Verify the existing component is red for numeric measured coordinates**

Run: `npx jest components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'`

Expected: FAIL because the current component keeps percentage-based tab positions and has no `onLayout` handler.

- [x] **Step 3: Measure bar width and use the layout module**

```tsx
import { useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { FIGMA_BOTTOM_NAV_WIDTH, getBottomNavTabLayout } from './bottomNavLayout';

const [barWidth, setBarWidth] = useState(FIGMA_BOTTOM_NAV_WIDTH);

const onBarLayout = ({ nativeEvent }: LayoutChangeEvent) => {
  setBarWidth(nativeEvent.layout.width);
};

<View testID="bottom-nav-bar" onLayout={onBarLayout} style={styles.bar}>
  {/* existing SVG background and tab layer */}
</View>

style={({ pressed }) => [
  styles.tab,
  getBottomNavTabLayout(item.key, barWidth),
  pressed && styles.tabPressed,
]}
```

Remove `TAB_LAYOUT` from `BottomNav.tsx`; keep all other SVG and press handler code unchanged.

- [x] **Step 4: Verify the component suite is green**

Run: `npx jest components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'`

Expected: PASS with 7 tests.

### Task 3: Verify the focused navigation regression suite

**Files:**
- Verify: `components/ui/bottomNavLayout.test.ts`
- Verify: `components/ui/BottomNav.test.tsx`
- Verify: `lib/navigation/routes.test.ts`

**Interfaces:**
- Consumes the pure coordinate helper, BottomNav interaction test and established route metadata test.
- Produces evidence for exact layout inputs and all four route outputs.

- [x] **Step 1: Run all focused navigation tests**

Run: `npx jest components/ui/bottomNavLayout.test.ts components/ui/BottomNav.test.tsx lib/navigation/routes.test.ts --runInBand --config '{"preset":"jest-expo"}'`

Expected: PASS with 22 tests.

- [x] **Step 2: Run static checks**

Run: `npx tsc --noEmit` then `npm run lint`

Expected: both commands exit 0.

- [x] **Step 3: Record the full-suite baseline limitation**

Run: `npm test`

Expected: pre-existing validation error for missing `test/setup.ts`; do not restore it.

- [x] **Step 4: Commit the layout helper, tests, component and plan**

```powershell
git add -- components/ui/bottomNavLayout.ts components/ui/bottomNavLayout.test.ts components/ui/BottomNav.tsx components/ui/BottomNav.test.tsx docs/superpowers/plans/2026-07-20-bottom-navigation-tab-grid.md
git commit -m "fix: align bottom navigation tabs to Figma grid"
```
