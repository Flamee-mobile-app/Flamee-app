# Inline SVG Bottom Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the approved Flamee Figma bottom navigation entirely with inline `react-native-svg` code, fixing the cropped bar and safe-area offset.

**Architecture:** `BottomNav` remains the sole route-aware component. Its vector-only internal components render the cropped Union path, original tab paths and the supplied embedded-logo SVG data; route metadata and Stack mounting do not change.

**Tech Stack:** Expo Router 6, React Native 0.81, TypeScript, `react-native-svg`, Jest Expo, React Native Testing Library.

## Global Constraints

- Keep the current five navigation display paths and four interactive tabs unchanged.
- Keep the centre Flamee logo decorative; it has no press handler or tab role.
- Do not render BottomNav with `expo-image`, `expo-linear-gradient`, local SVG assets or `useSafeAreaInsets`.
- Use the Figma dimensions exactly: 72px bar, 56px badge at top -28px, 32px icons, 10px white captions.
- Render the Figma Union path in an SVG `viewBox="20 18 402 72"` so the Figma crop is encoded, not left to image sizing.
- Keep the supplied Flamee SVG's embedded `data:image/png;base64` glyph inline in code; do not create a file or network request for it.

---

### Task 1: Lock the SVG renderer and edge-to-edge geometry with a test

**Files:**
- Modify: `components/ui/BottomNav.test.tsx`

**Interfaces:**
- Consumes: rendered `BottomNav`.
- Produces: a failing expectation for SVG background and 72px edge-to-edge bar test IDs.

- [x] **Step 1: Add the failing geometry test**

```tsx
it('uses the inline SVG renderer at the Figma bar geometry', async () => {
  const { getByTestId } = await render(<BottomNav />);

  expect(getByTestId('bottom-nav-bar').props.style).toEqual(
    expect.objectContaining({ height: 72 }),
  );
  expect(getByTestId('bottom-nav-background-svg')).toBeTruthy();
  expect(getByTestId('bottom-nav-logo-svg')).toBeTruthy();
});
```

- [x] **Step 2: Verify it is red**

Run: `npx jest components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'`

Expected: FAIL because the asset-based component has none of the SVG test IDs.

### Task 2: Replace asset rendering with Figma paths encoded in React Native SVG

**Files:**
- Modify: `components/ui/BottomNav.tsx`

**Interfaces:**
- Consumes: `BOTTOM_NAV_ITEMS`, Expo Router APIs and SVG path data from Figma node `6528:8281`.
- Produces: internal `BottomNavBackground`, `BottomNavIcon` and `FlameeLogoBadge` components; the public export remains `BottomNav`.

- [x] **Step 1: Remove image, gradient and safe-area imports**

```tsx
import Svg, {
  Defs,
  Image as SvgImage,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
```

- [x] **Step 2: Render the Figma Union as a cropped vector**

```tsx
<Svg testID="bottom-nav-background-svg" height="72" width="100%" viewBox="20 18 402 72">
  <Defs>
    <SvgLinearGradient id="bottom-nav-gradient" x1="221" x2="221" y1="90" y2="-9.5" gradientUnits="userSpaceOnUse">
      <Stop offset="0" stopColor="#FCB76D" />
      <Stop offset="1" stopColor="#FF7158" />
    </SvgLinearGradient>
  </Defs>
  <Path d="M148 18C165.673 18 ... H148Z" fill="url(#bottom-nav-gradient)" />
</Svg>
```

- [x] **Step 3: Render original Figma icon paths and supplied logo data inline**

Use a 32×32 SVG viewbox for each tab icon and the path data from the Figma exports. Render the supplied logo as a 56×56 SVG with its diagonal gradient and `SvgImage` `href` set to the exact `data:image/png;base64,...` string from the user-provided SVG. The logo is a decorative sibling of the tab layer.

- [x] **Step 4: Put the bar against the viewport edge and retain route behavior**

```tsx
<View pointerEvents="box-none" style={styles.container}>
  <View testID="bottom-nav-bar" style={styles.bar}>{/* SVG background, tabs, logo */}</View>
</View>
```

Keep `router.replace(item.href)`, four tab accessibility roles and Figma baseline-position calculation.

- [x] **Step 5: Run the component test green**

Run: `npx jest components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'`

Expected: PASS with three tests.

### Task 3: Verify and commit the self-contained redesign

**Files:**
- Verify: `components/ui/BottomNav.tsx`
- Verify: `components/ui/BottomNav.test.tsx`

**Interfaces:**
- Consumes: focused Jest suite, TypeScript checker and Expo linter.
- Produces: evidence that navigation behaviour is unchanged and the image-rendering regression is removed.

- [x] **Step 1: Run focused component and route suites**

Run: `npx jest lib/navigation/routes.test.ts components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'`

Expected: PASS with 13 tests.

- [x] **Step 2: Run static checks**

Run: `npx tsc --noEmit` then `npm run lint`

Expected: both commands exit 0.

- [x] **Step 3: Record baseline full-suite constraint**

Run: `npm test`

Expected: existing Jest configuration error for missing `test/setup.ts`; do not restore it.

- [x] **Step 4: Commit the changed production component, test and plan**

```powershell
git add -- components/ui/BottomNav.tsx components/ui/BottomNav.test.tsx docs/superpowers/plans/2026-07-20-bottom-navigation-inline-svg-redesign.md
git commit -m "fix: render bottom navigation with inline SVG"
```
