# Bottom Nav Home Icon States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Home use a correctly sized white outline icon while inactive and a white filled icon while active, without altering the Bottom Nav layout or any other tab.

**Architecture:** SVG assets in `assets/navigation` define the two semantic Home visual states. The icon manifest generates React Native SVG components; `FlameeIcon` exposes them through `homeActive` and `homeInactive`; `BottomNav` chooses the variant from the current route. This keeps route state out of the asset layer and preserves the 32 px Bottom Nav icon slot.

**Tech Stack:** Expo Router, React Native, `react-native-svg`, TypeScript, Jest with React Native Testing Library, Node icon generator.

## Global Constraints

- All four Bottom Nav icons stay in the existing 32 px icon slot.
- Home inactive is white outline artwork with the same apparent size and inactive opacity as the other tabs.
- Home active is white filled artwork; label and tab opacity behavior remain unchanged.
- Do not alter the center Flamee badge, Bottom Nav geometry, touch targets, routes, or the non-Home tabs.
- Regenerate `shared/components/icons/generated/` using `npm --prefix flamee-mobile run icons:generate`; do not edit generated SVG components manually.

---

### Task 1: Add semantic white Home icon variants and route selection

**Files:**
- Create: `flamee-mobile/assets/navigation/bottom-nav-home-active.svg`
- Modify: `flamee-mobile/assets/navigation/bottom-nav-home-inactive.svg`
- Modify: `flamee-mobile/assets/icons/manifest.json`
- Modify: `flamee-mobile/shared/components/icons/iconNames.ts`
- Modify: `flamee-mobile/shared/components/icons/FlameeIcon.tsx`
- Modify: `flamee-mobile/shared/components/icons/generated/index.ts` (generated)
- Create: `flamee-mobile/shared/components/icons/generated/HomeActiveIcon.tsx` (generated)
- Modify: `flamee-mobile/shared/components/icons/generated/HomeInactiveIcon.tsx` (generated)
- Modify: `flamee-mobile/shared/components/ui/BottomNav.tsx`
- Test: `flamee-mobile/shared/components/ui/BottomNav.test.tsx`

**Interfaces:**
- Consumes: `BottomNavItem['key']`, `selected: boolean`, and the generated SVG component convention used by `FlameeIcon`.
- Produces: `FlameeIcon` names `homeActive` and `homeInactive`; `BottomNavIcon({ itemKey, selected })` renders `homeActive` exactly when `itemKey === 'home' && selected`.

- [ ] **Step 1: Write two failing route-visual tests**

Replace the gradient-specific test with these state assertions in `flamee-mobile/shared/components/ui/BottomNav.test.tsx`:

```tsx
it('uses the filled Home artwork while Home is selected', async () => {
  mockPathname = '/home';
  const { getByTestId } = await render(<BottomNav />);
  const homeVisual = getByTestId('bottom-nav-visual-home');

  expect(within(homeVisual).getByTestId('flamee-icon-home-active')).toBeTruthy();
  expect(within(homeVisual).queryByTestId('flamee-icon-home-inactive')).toBeNull();
});

it('uses the white outline Home artwork while another tab is selected', async () => {
  mockPathname = '/timeline';
  const { getByTestId } = await render(<BottomNav />);
  const homeVisual = getByTestId('bottom-nav-visual-home');

  expect(within(homeVisual).getByTestId('flamee-icon-home-inactive')).toBeTruthy();
  expect(within(homeVisual).queryByTestId('flamee-icon-home-active')).toBeNull();
});
```

- [ ] **Step 2: Run the focused test and confirm the expected red failure**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand shared/components/ui/BottomNav.test.tsx
```

Expected: FAIL because `flamee-icon-home-active` is not rendered by the current Home branch.

- [ ] **Step 3: Replace the incompatible gradient asset with a correctly framed white outline asset**

Create `bottom-nav-home-active.svg` by copying the current filled `bottom-nav-home.svg` artwork and preserve its `viewBox="0 0 27.3599 24.2099"` plus white `var(--fill-0, white)` fill.

In `bottom-nav-home-inactive.svg`, replace all gradient fills and `<defs>` with white fills (`#FFFFFF`). Keep the supplied roof, house-outline, and heart shapes, and change its manifest view box to the cropped art frame `6 9 88 77`. This removes the 100×100 transparent padding so its apparent height and width match the existing 32 px nav icons.

Update `flamee-mobile/assets/icons/manifest.json` to define:

```json
"homeActive": {
  "kind": "icon",
  "source": "../navigation/bottom-nav-home-active.svg",
  "viewBox": "0 0 27.3599 24.2099"
},
"homeInactive": {
  "kind": "icon",
  "source": "../navigation/bottom-nav-home-inactive.svg",
  "viewBox": "6 9 88 77"
}
```

- [ ] **Step 4: Generate the updated React Native SVG components**

Run:

```powershell
npm --prefix flamee-mobile run icons:generate
```

Expected: `HomeActiveIcon.tsx` is created and the generated index exports both `HomeActiveIcon` and `HomeInactiveIcon`.

- [ ] **Step 5: Expose the variants and select them in Bottom Nav**

Add `homeActive` to `FLAMEE_ICON_NAMES`. Import `HomeActiveIcon` in `FlameeIcon.tsx` and render it with `testID="flamee-icon-home-active"`. Keep `homeInactive` on `HomeInactiveIcon` with `testID="flamee-icon-home-inactive"`.

Set `BottomNavIcon` to select the semantic Home name while leaving the other keys unchanged:

```tsx
const iconName =
  itemKey === 'home' ? (selected ? 'homeActive' : 'homeInactive') : itemKey;

return <FlameeIcon color="#FFFFFF" name={iconName} size={32} />;
```

The surrounding `tabVisualActive` / `tabVisualInactive` styles must remain as-is so Home gets the same active/inactive opacity treatment as the other tab visuals.

- [ ] **Step 6: Run focused tests and asset freshness check**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand shared/components/ui/BottomNav.test.tsx shared/components/icons/FlameeIcon.test.tsx
npm --prefix flamee-mobile run icons:check
```

Expected: both test suites pass and the icon check reports no stale generated files.

- [ ] **Step 7: Commit the focused feature**

```powershell
git add flamee-mobile/assets/icons/manifest.json flamee-mobile/assets/navigation/bottom-nav-home-active.svg flamee-mobile/assets/navigation/bottom-nav-home-inactive.svg flamee-mobile/shared/components/icons/iconNames.ts flamee-mobile/shared/components/icons/FlameeIcon.tsx flamee-mobile/shared/components/icons/generated/HomeActiveIcon.tsx flamee-mobile/shared/components/icons/generated/HomeInactiveIcon.tsx flamee-mobile/shared/components/icons/generated/index.ts flamee-mobile/shared/components/ui/BottomNav.tsx flamee-mobile/shared/components/ui/BottomNav.test.tsx
git commit -m "fix: align home nav icon states"
```

### Task 2: Run regression validation

**Files:**
- Modify: none
- Test: all test suites and static checks under `flamee-mobile`

**Interfaces:**
- Consumes: completed Home active/inactive assets and Bottom Nav route selection from Task 1.
- Produces: evidence that no regression was introduced to navigation, icon generation, linting, or strict typing.

- [ ] **Step 1: Run the full validation suite**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand
npm --prefix flamee-mobile run lint
& '.\flamee-mobile\node_modules\.bin\tsc.cmd' --noEmit -p '.\flamee-mobile\tsconfig.json'
git diff --check HEAD~1..HEAD
```

Expected: all Jest suites pass, lint exits 0, TypeScript emits no errors, and the committed diff has no whitespace errors.
