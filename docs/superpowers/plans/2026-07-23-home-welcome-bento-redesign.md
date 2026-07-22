# Home Welcome Bento Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Home as a responsive background-backed welcome and bento dashboard that animates once per app session while preserving its mascot and floating Bottom Nav.

**Architecture:** A pure welcome-content module and an in-memory session consumer determine whether Home plays its entrance. `HomeWelcomeHeader` owns all entrance animation presentation; `HomeBentoGrid` owns the responsive six-function layout. `HomeScreen` remains a small composition layer around the existing background, header Chat AI action, scroll area, mascot, and app-shell navigation.

**Tech Stack:** Expo Router, React Native `Animated`, `AccessibilityInfo`, `useWindowDimensions`, `expo-image`, Ionicons, TypeScript, Jest with React Native Testing Library.

## Global Constraints

- Preserve `brandAssets.background`, existing Flamee header/Chat AI action, Home mascot behavior, and persistent floating Bottom Nav.
- The welcome sequence runs only once per in-memory app session; returning to Home must not replay it.
- Greeting buckets use local device time: `05:00–10:59` morning, `11:00–13:59` noon, `14:00–17:59` afternoon, and evening otherwise.
- Render all six functions: Mood check-in, Chat AI, Dòng thời gian, Lịch hẹn hò, Sổ kỉ niệm, Nhiệm vụ.
- Use `useWindowDimensions`, not module-level `Dimensions`, and reserve 128 px at the end of the scroll content for the floating nav and mascot.
- Respect reduced motion: show final content without entrance movement.
- Do not change route protection, Bottom Nav geometry, Home mascot code, or destination-screen layouts.

---

### Task 1: Add pure welcome content and session-state primitives

**Files:**
- Create: `flamee-mobile/features/home/lib/homeWelcomeContent.ts`
- Create: `flamee-mobile/features/home/lib/homeWelcomeSession.ts`
- Test: `flamee-mobile/features/home/lib/homeWelcomeContent.test.ts`
- Test: `flamee-mobile/features/home/lib/homeWelcomeSession.test.ts`

**Interfaces:**
- Produces `getHomeWelcomeContent(date: Date): { greeting: string; quote: string }`.
- Produces `consumeHomeWelcomeSession(): boolean`, returning `true` once and `false` afterwards in the current JavaScript session.
- Produces `resetHomeWelcomeSessionForTests(): void` for test isolation only.

- [ ] **Step 1: Write failing time and session tests**

Create `homeWelcomeContent.test.ts` with explicit boundary cases:

```ts
expect(getHomeWelcomeContent(new Date(2026, 6, 23, 5)).greeting).toBe('Chào buổi sáng');
expect(getHomeWelcomeContent(new Date(2026, 6, 23, 11)).greeting).toBe('Chào buổi trưa');
expect(getHomeWelcomeContent(new Date(2026, 6, 23, 14)).greeting).toBe('Chào buổi chiều');
expect(getHomeWelcomeContent(new Date(2026, 6, 23, 18)).greeting).toBe('Chào buổi tối');
```

Create `homeWelcomeSession.test.ts`:

```ts
beforeEach(resetHomeWelcomeSessionForTests);

it('consumes the welcome entrance once per session', () => {
  expect(consumeHomeWelcomeSession()).toBe(true);
  expect(consumeHomeWelcomeSession()).toBe(false);
});
```

- [ ] **Step 2: Verify the tests fail**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand features/home/lib/homeWelcomeContent.test.ts features/home/lib/homeWelcomeSession.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement deterministic content and in-memory consumption**

Use these copy values in `homeWelcomeContent.ts`:

```ts
const QUOTES = [
  'Tình yêu được nuôi dưỡng từ những kỷ niệm.',
  'Một lời quan tâm nhỏ cũng có thể làm ngày hôm nay ấm hơn.',
  'Cùng nhau lưu lại những điều đáng nhớ nhé.',
  'Yêu nhau là chọn lắng nghe nhau mỗi ngày.',
] as const;
```

Select the quote with `date.getDate() % QUOTES.length` so it remains deterministic throughout a calendar day. Use one module-scoped `let hasConsumedHomeWelcome = false` in `homeWelcomeSession.ts`; the consume function returns `!hasConsumedHomeWelcome` before setting it to true.

- [ ] **Step 4: Verify green and commit the primitive layer**

Run the Step 2 command again. Expected: both suites pass.

```powershell
git add flamee-mobile/features/home/lib/homeWelcomeContent.ts flamee-mobile/features/home/lib/homeWelcomeSession.ts flamee-mobile/features/home/lib/homeWelcomeContent.test.ts flamee-mobile/features/home/lib/homeWelcomeSession.test.ts
git commit -m "feat: add home welcome session content"
```

### Task 2: Build animated welcome header and responsive bento grid

**Files:**
- Create: `flamee-mobile/features/home/hooks/useHomeWelcome.ts`
- Create: `flamee-mobile/features/home/components/HomeWelcomeHeader.tsx`
- Create: `flamee-mobile/features/home/components/HomeBentoGrid.tsx`
- Create: `flamee-mobile/features/home/components/homeBentoItems.ts`
- Test: `flamee-mobile/features/home/components/HomeWelcomeHeader.test.tsx`
- Test: `flamee-mobile/features/home/components/HomeBentoGrid.test.tsx`

**Interfaces:**
- `useHomeWelcome()` returns `{ content, shouldAnimate, greetingStyle, quoteStyle }`.
- `HomeWelcomeHeader` consumes `{ content, greetingStyle, quoteStyle }` and owns no routing state.
- `HomeBentoGrid` receives `shouldAnimate: boolean` and `onNavigate: (route: Href, mode: 'push' | 'replace') => void`; it owns the staggered card entrance and renders every object in `HOME_BENTO_ITEMS`.

- [ ] **Step 1: Write failing presentation and navigation tests**

In `HomeWelcomeHeader.test.tsx`, render the header with static opacity/translation styles and assert its greeting and quote appear with `testID="home-welcome-header"`.

In `HomeBentoGrid.test.tsx`, use a spy for `onNavigate`, render the grid, and assert all six accessible buttons exist. Press `Mood check-in` and `Lịch hẹn hò` and assert:

```ts
expect(onNavigate).toHaveBeenCalledWith(ROUTES.mood, 'replace');
expect(onNavigate).toHaveBeenCalledWith(ROUTES.dates, 'push');
```

- [ ] **Step 2: Verify red**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand features/home/components/HomeWelcomeHeader.test.tsx features/home/components/HomeBentoGrid.test.tsx
```

Expected: FAIL because the welcome and bento components do not exist.

- [ ] **Step 3: Implement one-session animation with reduced-motion handling**

`useHomeWelcome` consumes `consumeHomeWelcomeSession()` in a lazy state initializer, reads `AccessibilityInfo.isReduceMotionEnabled()`, and subscribes to `reduceMotionChanged`. When `shouldAnimate && !reduceMotion`, run a native-driver sequence:

```ts
Animated.sequence([
  Animated.timing(greeting, { duration: 260, toValue: 1, useNativeDriver: true }),
  Animated.timing(quote, { duration: 220, toValue: 1, useNativeDriver: true }),
]).start();
```

Each animated value begins at `0` only when animation should play; otherwise it begins at `1`. Return opacity and translateY styles derived from these values.

- [ ] **Step 4: Implement the bento hierarchy and responsive card widths**

Define `HOME_BENTO_ITEMS` with these routes and navigation modes:

```ts
[
  { id: 'mood', label: 'Mood check-in', route: ROUTES.mood, mode: 'replace', featured: true },
  { id: 'ai', label: 'Chat AI', route: ROUTES.ai, mode: 'push' },
  { id: 'timeline', label: 'Dòng thời gian', route: ROUTES.timeline, mode: 'replace' },
  { id: 'dates', label: 'Lịch hẹn hò', route: ROUTES.dates, mode: 'push' },
  { id: 'memory-book', label: 'Sổ kỉ niệm', route: ROUTES.memoryBook, mode: 'push' },
  { id: 'missions', label: 'Nhiệm vụ', route: ROUTES.missions, mode: 'replace' },
]
```

Use `useWindowDimensions()` and calculate `smallCardWidth = (width - 48 - 12) / 2`; render the featured Mood card at `width: '100%'`, then the remaining cards at `smallCardWidth`. Every card is a `Pressable` with an accessible Vietnamese label, Ionicon, translucent warm background, and white title/subtitle.

`HomeBentoGrid` creates six `Animated.Value`s. When `shouldAnimate` is true, it starts `Animated.sequence([Animated.delay(380), Animated.stagger(60, cardValues.map((value) => Animated.timing(value, { duration: 220, toValue: 1, useNativeDriver: true })))]);`; when false, values start at `1`. Each card uses its own opacity and `translateY` from its corresponding value.

- [ ] **Step 5: Verify green and commit components**

Run the Step 2 command again. Expected: both suites pass.

```powershell
git add flamee-mobile/features/home/hooks/useHomeWelcome.ts flamee-mobile/features/home/components/HomeWelcomeHeader.tsx flamee-mobile/features/home/components/HomeBentoGrid.tsx flamee-mobile/features/home/components/homeBentoItems.ts flamee-mobile/features/home/components/HomeWelcomeHeader.test.tsx flamee-mobile/features/home/components/HomeBentoGrid.test.tsx
git commit -m "feat: add home welcome bento components"
```

### Task 3: Compose the new Home screen and protect existing integrations

**Files:**
- Modify: `flamee-mobile/features/home/screens/HomeScreen.tsx`
- Create: `flamee-mobile/features/home/screens/HomeScreen.test.tsx`
- Modify: `docs/flamee-mobile-ui-flow-redesign-issues.md`

**Interfaces:**
- Consumes `useHomeWelcome`, `HomeWelcomeHeader`, `HomeBentoGrid`, `HomeMascotCompanion`, `brandAssets.background`, and `ROUTES`.
- Produces the protected `/home` screen with all six app entry points and the existing Home mascot overlay.

- [ ] **Step 1: Write the failing composition test**

Mock `expo-router`, `expo-image`, and `HomeMascotCompanion`. Render `HomeScreen` and assert:

```ts
expect(screen.getByTestId('home-background')).toBeTruthy();
expect(screen.getByTestId('home-welcome-header')).toBeTruthy();
expect(screen.getByTestId('home-bento-grid')).toBeTruthy();
expect(screen.getByTestId('home-mascot-companion')).toBeTruthy();
```

Press `Chat AI` and assert `router.push(ROUTES.ai)`; press `Nhiệm vụ` and assert `router.replace(ROUTES.missions)`.

- [ ] **Step 2: Verify red**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand features/home/screens/HomeScreen.test.tsx
```

Expected: FAIL because the current hard-coded Home has no welcome/bento test IDs and routes directly inside its shortcut map.

- [ ] **Step 3: Replace the hard-coded screen composition**

Remove module-level `Dimensions`, the static `shortcuts` array, fixed greeting copy, and Figma-frame grid styles. Keep the background, dark overlay, StatusBar, header logo, Chat AI header button, `ScrollView`, and `HomeMascotCompanion`.

Compose the content as:

```tsx
<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
  <HomeWelcomeHeader
    content={content}
    greetingStyle={greetingStyle}
    quoteStyle={quoteStyle}
  />
  <HomeBentoGrid onNavigate={handleNavigate} shouldAnimate={shouldAnimate} />
  <View style={styles.bottomReservation} />
</ScrollView>
<HomeMascotCompanion />
```

`handleNavigate` calls `router.push(route)` for `push` and `router.replace(route)` for `replace`. Give the background image `testID="home-background"`; preserve its `contentFit="cover"`.

- [ ] **Step 4: Record completion status and verify focused Home tests**

Update Issue 3 in `docs/flamee-mobile-ui-flow-redesign-issues.md` to state that the welcome/bento implementation is complete and list the one-session animation, responsive six-function bento, preserved background/mascot/nav, and validation result.

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand features/home shared/components/ui/BottomNav.test.tsx features/mascot/components/HomeMascotCompanion.test.tsx
```

Expected: all selected Home, Bottom Nav, and mascot tests pass.

- [ ] **Step 5: Commit the integration**

```powershell
git add flamee-mobile/features/home/screens/HomeScreen.tsx flamee-mobile/features/home/screens/HomeScreen.test.tsx docs/flamee-mobile-ui-flow-redesign-issues.md
git commit -m "feat: redesign home welcome dashboard"
```

### Task 4: Run full regression validation

**Files:**
- Modify: none
- Test: all Jest suites and static checks under `flamee-mobile`

**Interfaces:**
- Consumes the complete Home redesign from Tasks 1–3.
- Produces final evidence that protected navigation, mascot behavior, Bottom Nav, linting, and strict typing remain valid.

- [ ] **Step 1: Run the validation suite**

Run:

```powershell
npm --prefix flamee-mobile test -- --runInBand
npm --prefix flamee-mobile run lint
& '.\flamee-mobile\node_modules\.bin\tsc.cmd' --noEmit -p '.\flamee-mobile\tsconfig.json'
git diff --check
```

Expected: every Jest suite passes, lint exits 0, TypeScript emits no errors, and the working diff has no whitespace errors.
