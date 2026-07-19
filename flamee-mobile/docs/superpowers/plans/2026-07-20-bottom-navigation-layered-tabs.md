# Layered Figma Bottom Navigation Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the four Figma tabs in stable absolute positions and overlay separate transparent route buttons.

**Architecture:** `BottomNav` retains the existing measured Figma layout helper and SVG pieces. It maps navigation metadata twice: visual `View` nodes own icon/caption geometry and transparent `Pressable` nodes own accessibility and routing; neither uses a callback style function.

**Tech Stack:** Expo Router 6, React Native 0.81, TypeScript, `react-native-svg`, Jest Expo, React Native Testing Library.

## Global Constraints

- Keep the existing 72px bar, SVG notch, Flamee logo, icon paths and caption styles.
- Keep exact Figma coordinate mapping and the current numeric width-scaling helper.
- Each visual tab is non-interactive and each transparent button routes to its matching `BOTTOM_NAV_ITEMS` href.
- Do not add a Mood button or alter Stack navigation/visibility paths.

---

### Task 1: Lock the separate visual and interaction layers with a red test

**Files:**
- Modify: `components/ui/BottomNav.test.tsx`

**Interfaces:**
- Consumes `BottomNav` test IDs named `bottom-nav-visual-<key>` and `bottom-nav-button-<key>`.
- Produces a failing assertion that each Figma visual has an absolute numeric layout separate from its button.

- [x] **Step 1: Add the failing visual-layer test**

```tsx
it.each([
  ['home', { left: 23, top: 15, width: 57 }],
  ['memories', { left: 100, top: 15, width: 60 }],
  ['missions', { left: 242, top: 12, width: 55 }],
  ['profile', { left: 321, top: 12, width: 34 }],
] as const)('renders the %s visual at its Figma position', async (key, layout) => {
  const { getByTestId } = await render(<BottomNav />);

  expect(getByTestId(\`bottom-nav-visual-\${key}\`).props.style).toEqual(
    expect.arrayContaining([expect.objectContaining(layout)]),
  );
  expect(getByTestId(\`bottom-nav-button-\${key}\`).props.children).toBeUndefined();
});
```

- [x] **Step 2: Verify the test is red**

Run: `npx jest components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'`

Expected: FAIL because the current component has no separate visual nodes or interaction nodes.

### Task 2: Render fixed visual tabs and transparent route buttons

**Files:**
- Modify: `components/ui/BottomNav.tsx`

**Interfaces:**
- Consumes `BOTTOM_NAV_ITEMS`, `getBottomNavTabLayout(item.key, barWidth)`, `router.replace()`.
- Produces `bottom-nav-visual-<key>` visual nodes and `bottom-nav-button-<key>` accessible buttons.

- [x] **Step 1: Add a pure visual tab component**

```tsx
function BottomNavVisualTab({ item, layout }: { item: BottomNavItem; layout: BottomNavTabLayout }) {
  return (
    <View pointerEvents="none" style={[styles.tabVisual, layout]} testID={\`bottom-nav-visual-\${item.key}\`}>
      <BottomNavIcon itemKey={item.key} />
      <AppText variant="micro" color={flameeTheme.colors.text.inverse} align="center" numberOfLines={1} style={styles.label}>
        {item.label}
      </AppText>
    </View>
  );
}
```

- [x] **Step 2: Replace callback-styled Pressables with two direct-style layers**

```tsx
<View pointerEvents="none" style={styles.visualTabs}>
  {BOTTOM_NAV_ITEMS.map((item) => (
    <BottomNavVisualTab key={item.key} item={item} layout={getBottomNavTabLayout(item.key, barWidth)} />
  ))}
</View>

<View style={styles.interactionTabs}>
  {BOTTOM_NAV_ITEMS.map((item) => {
    const selected = String(item.href).replace('/(main)', '') === pathname;
    return (
      <Pressable
        key={item.key}
        accessibilityLabel={item.label}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        hitSlop={8}
        onPress={() => router.replace(item.href)}
        style={[styles.tabButton, getBottomNavTabLayout(item.key, barWidth)]}
        testID={\`bottom-nav-button-\${item.key}\`}
      />
    );
  })}
</View>
```

Use `visualTabs` and `interactionTabs` with `position: 'absolute'`, all four edges set to 0, and z-index values 1 and 2. Use `tabVisual` with `alignItems: 'center'` and `position: 'absolute'`; use `tabButton` with `height: 42` and `position: 'absolute'`. Remove the old `tabs`, `tab` and `tabPressed` styles.

- [x] **Step 3: Verify the component test is green**

Run: `npx jest components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'`

Expected: PASS with 11 tests.

### Task 3: Verify the full focused navigation contract

**Files:**
- Verify: `components/ui/BottomNav.test.tsx`
- Verify: `components/ui/bottomNavLayout.test.ts`
- Verify: `lib/navigation/routes.test.ts`

**Interfaces:**
- Consumes visual geometry, four buttons, coordinate helper and route metadata tests.
- Produces evidence that all Figma tabs display and navigate at correct positions.

- [x] **Step 1: Run all focused navigation tests**

Run: `npx jest components/ui/BottomNav.test.tsx components/ui/bottomNavLayout.test.ts lib/navigation/routes.test.ts --runInBand --config '{"preset":"jest-expo"}'`

Expected: PASS with 26 tests.

- [x] **Step 2: Run static checks**

Run: `npx tsc --noEmit` then `npm run lint`

Expected: both commands exit 0.

- [x] **Step 3: Record the baseline full-suite limitation**

Run: `npm test`

Expected: the existing missing `test/setup.ts` configuration error; do not change that file.

- [x] **Step 4: Commit the component, test and plan**

```powershell
git add -- components/ui/BottomNav.tsx components/ui/BottomNav.test.tsx docs/superpowers/plans/2026-07-20-bottom-navigation-layered-tabs.md
git commit -m "fix: render Figma bottom navigation tab layers"
```
