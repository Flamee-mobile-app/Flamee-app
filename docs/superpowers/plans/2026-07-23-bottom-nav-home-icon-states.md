# Bottom Nav Home Icon States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use one correctly sized Home artwork whose active state is filled and inactive state is unfilled, while removing every old Home asset.

**Architecture:** `HomeNavIcon` is a hand-authored `react-native-svg` component containing the three user-supplied paths once. `FlameeIcon` renders it only for its existing `home` name and accepts a `filled` prop. `BottomNav` determines that boolean from the selected route without changing icon names.

**Tech Stack:** Expo Router, React Native, `react-native-svg`, TypeScript, Jest with React Native Testing Library.

## Global Constraints

- Home has one canonical shape, one `name="home"`, one `testID="flamee-icon-home"`, and no `homeActive` or `homeInactive` alternatives.
- Its root SVG always renders in the 32 px Bottom Nav slot with `viewBox="6 9 88 77"` and `preserveAspectRatio="none"`.
- Active paths use `fill="#FFFFFF"`; inactive paths use `fill="none"`, `stroke="#FFFFFF"`, and `strokeWidth={3.5}`.
- Remove the old Figma Home SVG, copied active SVG, old canonical SVG, corresponding manifest entries, and generated Home components/exports.
- Do not alter Bottom Nav layout, labels, opacity, routes, touch targets, central badge, or non-Home tabs.

---

### Task 1: Implement the single HomeNavIcon and delete legacy icon outputs

**Files:**
- Create: `flamee-mobile/shared/components/icons/HomeNavIcon.tsx`
- Modify: `flamee-mobile/shared/components/icons/FlameeIcon.tsx`
- Modify: `flamee-mobile/shared/components/icons/FlameeIcon.test.tsx`
- Modify: `flamee-mobile/shared/components/icons/iconNames.ts`
- Modify: `flamee-mobile/shared/components/ui/BottomNav.tsx`
- Modify: `flamee-mobile/shared/components/ui/BottomNav.test.tsx`
- Modify: `flamee-mobile/assets/icons/manifest.json`
- Modify: `flamee-mobile/shared/components/icons/generated/index.ts`
- Delete: `flamee-mobile/assets/navigation/bottom-nav-home.svg`
- Delete: `flamee-mobile/assets/navigation/bottom-nav-home-active.svg`
- Delete: `flamee-mobile/assets/navigation/bottom-nav-home-inactive.svg`
- Delete: `flamee-mobile/shared/components/icons/generated/HomeIcon.tsx`
- Delete: `flamee-mobile/shared/components/icons/generated/HomeActiveIcon.tsx`
- Delete: `flamee-mobile/shared/components/icons/generated/HomeInactiveIcon.tsx`

**Interfaces:**
- `HomeNavIconProps = { filled: boolean; size: number; color: string; accessibilityLabel?: string }`
- `FlameeIconProps` gains `filled?: boolean`; it is consumed only by `name="home"`.
- For Home, `BottomNavIcon({ itemKey, selected })` calls `<FlameeIcon color="#FFFFFF" filled={selected} name="home" size={32} />`.

- [ ] **Step 1: Write the failing single-icon tests**

Replace the two Home-variant tests in `flamee-mobile/shared/components/ui/BottomNav.test.tsx` with:

```tsx
it.each([
  ['/home', '#FFFFFF'],
  ['/timeline', 'none'],
] as const)('renders one Home icon with %s fill on %s', async (pathname, expectedFill) => {
  mockPathname = pathname;
  const { getByTestId } = await render(<BottomNav />);
  const homeIcon = getByTestId('flamee-icon-home');

  expect(homeIcon.findAllByType(Path)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ props: expect.objectContaining({ fill: expectedFill }) }),
    ]),
  );
  expect(homeIcon.findAllByType(Path)).toHaveLength(3);
});
```

Add to `flamee-mobile/shared/components/icons/FlameeIcon.test.tsx`:

```tsx
it('renders the canonical Home artwork without a fill', async () => {
  const screen = await render(
    <FlameeIcon color="#FFFFFF" filled={false} name="home" size={32} />,
  );

  expect(screen.getByTestId('flamee-icon-home')).toBeTruthy();
});
```

- [ ] **Step 2: Run the focused tests and verify red**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand shared/components/ui/BottomNav.test.tsx shared/components/icons/FlameeIcon.test.tsx
```

Expected: FAIL because current Home renders `flamee-icon-home-active` and `flamee-icon-home-inactive`, not one `flamee-icon-home` in both routes.

- [ ] **Step 3: Add the canonical HomeNavIcon**

Create `HomeNavIcon.tsx` with one `Svg` using `viewBox="6 9 88 77"`, `preserveAspectRatio="none"`, `width={size}`, `height={size}`, and `testID="flamee-icon-home"`. It contains exactly three `Path` nodes holding the roof, home-outline, and heart path data from the SVG the user supplied.

Use this state style for every path:

```tsx
const pathStyle = filled
  ? { fill: color }
  : { fill: 'none' as const, stroke: color, strokeWidth: 3.5 };
```

The component has no alternate icon source or alternate path set.

- [ ] **Step 4: Wire the one icon through FlameeIcon and BottomNav**

Add `filled = false` to `FlameeIcon` props, import `HomeNavIcon`, and replace all three existing Home branches with:

```tsx
if (name === 'home') {
  return <HomeNavIcon {...accessibilityProps} color={color} filled={filled} size={size} />;
}
```

Remove `homeActive` and `homeInactive` from `FLAMEE_ICON_NAMES`.

Replace BottomNav's Home variant selection with:

```tsx
if (itemKey === 'home') {
  return <FlameeIcon color="#FFFFFF" filled={selected} name="home" size={32} />;
}

return <FlameeIcon color="#FFFFFF" name={itemKey} size={32} />;
```

- [ ] **Step 5: Remove legacy assets and generated components**

Remove `home`, `homeActive`, and `homeInactive` from `assets/icons/manifest.json`, and their three lines from `generated/index.ts`.

Run:

```powershell
git rm flamee-mobile/assets/navigation/bottom-nav-home.svg flamee-mobile/assets/navigation/bottom-nav-home-active.svg flamee-mobile/assets/navigation/bottom-nav-home-inactive.svg flamee-mobile/shared/components/icons/generated/HomeIcon.tsx flamee-mobile/shared/components/icons/generated/HomeActiveIcon.tsx flamee-mobile/shared/components/icons/generated/HomeInactiveIcon.tsx
```

Do not run `icons:generate`: it preserves stale generated files, while Home is intentionally hand-authored.

- [ ] **Step 6: Run focused tests and verify green**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand shared/components/ui/BottomNav.test.tsx shared/components/icons/FlameeIcon.test.tsx
```

Expected: both suites pass; each Home route has exactly three paths under the same Home test ID, filled when selected and unfilled when not selected.

- [ ] **Step 7: Commit the corrected implementation**

```powershell
git add flamee-mobile/assets/icons/manifest.json flamee-mobile/shared/components/icons/HomeNavIcon.tsx flamee-mobile/shared/components/icons/FlameeIcon.tsx flamee-mobile/shared/components/icons/FlameeIcon.test.tsx flamee-mobile/shared/components/icons/iconNames.ts flamee-mobile/shared/components/icons/generated/index.ts flamee-mobile/shared/components/ui/BottomNav.tsx flamee-mobile/shared/components/ui/BottomNav.test.tsx
git add -u flamee-mobile/assets/navigation flamee-mobile/shared/components/icons/generated
git commit -m "fix: unify home navigation icon"
```

### Task 2: Run regression validation

**Files:**
- Modify: none
- Test: all test suites and static checks under `flamee-mobile`

**Interfaces:**
- Consumes the canonical HomeNavIcon from Task 1.
- Produces fresh evidence that navigation, linting, and strict typing have no regression.

- [ ] **Step 1: Run the full validation suite**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand
npm --prefix flamee-mobile run lint
& '.\flamee-mobile\node_modules\.bin\tsc.cmd' --noEmit -p '.\flamee-mobile\tsconfig.json'
git diff --check HEAD~1..HEAD
```

Expected: all Jest suites pass, lint exits 0, TypeScript emits no errors, and the committed diff has no whitespace errors.
