# Timeline and Memory Book Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the current Timeline feature from `memories` to `/timeline` without losing its behaviour, and deliver a separate, SVG-faithful Memory Book at `/memory-book` that Home can open without BottomNav.

**Architecture:** Recover the pre-overwrite Timeline source, apply the existing `shared/` import migration, and rename its public API consistently. Build Memory Book as a separate feature with a typed reducer hook, feature-local service and schema; route definitions are the sole source of route ownership and BottomNav visibility.

**Tech Stack:** Expo Router 6, React Native 0.81, React 19, TypeScript 5.9, Jest/React Native Testing Library, Zod 4, `@expo/vector-icons`, project `shared/` UI/layout primitives.

## Global Constraints

- `ROUTES.timeline` is `/(main)/timeline`; `/memories`, `ROUTES.memories`, and `features/memories` must not remain in application source.
- `ROUTES.memoryBook` is `/(main)/memory-book`; it is a Stack route, not a BottomNav route.
- No route aliases, redirect shims, screen-specific conditionals, or hard-coded UI-only workaround state.
- Timeline and Memory Book never import each other's feature files.
- Preserve unrelated uncommitted shared-architecture migration changes and do not rewrite the accidental mixed commit without explicit user authorization.
- New production behaviour is test-first: observe the test fail before adding implementation.
- Runtime assets must be local files or existing project icons; no Figma-hosted URLs.

---

## File structure

| Path | Responsibility |
| --- | --- |
| `app/(main)/timeline.tsx` | Expo Router entry exporting `TimelineScreen`. |
| `app/(main)/memory-book.tsx` | Expo Router entry exporting `MemoryBookScreen`. |
| `app/(main)/_layout.tsx` | Registers Timeline and Memory Book Stack screens. |
| `shared/lib/navigation/routes.ts` | Central route constants, BottomNav items, and main-navigation visibility. |
| `features/timeline/` | Recovered Timeline list, filter, create, and edit flows. |
| `features/memory-book/types.ts` | Memory Book record, draft, and screen-state types. |
| `features/memory-book/services/memoryBookService.ts` | Seed data and immutable create/update/delete helpers. |
| `features/memory-book/schemas/memoryBookSchema.ts` | Create/edit input validation. |
| `features/memory-book/hooks/useMemoryBook.ts` | Reducer-backed selection, create, edit, delete and validation state. |
| `features/memory-book/components/` | Reusable gallery card, detail card, and form controls. |
| `features/memory-book/screens/` | Overview, detail, add, and edit visual compositions. |

### Task 1: Establish route ownership and navigation contracts

**Files:**
- Modify: `flamee-mobile/shared/lib/navigation/routes.ts`
- Modify: `flamee-mobile/shared/lib/navigation/routes.test.ts`
- Modify: `flamee-mobile/shared/components/ui/BottomNav.test.tsx`
- Modify: `flamee-mobile/app/(main)/_layout.tsx`
- Modify: `flamee-mobile/features/home/screens/HomeScreen.tsx`
- Modify: `flamee-mobile/features/home/services/homeService.ts`

**Interfaces:**
- Produces `ROUTES.timeline`, `ROUTES.memoryBook`, `BOTTOM_NAV_ITEMS` with `key: 'timeline'`, and `isMainNavigationPath('/timeline') === true` / `isMainNavigationPath('/memory-book') === false`.

- [ ] **Step 1: Write failing route and shortcut tests**

```ts
expect(ROUTES.timeline).toBe('/(main)/timeline');
expect(ROUTES.memoryBook).toBe('/(main)/memory-book');
expect(isMainNavigationPath('/timeline')).toBe(true);
expect(isMainNavigationPath('/memory-book')).toBe(false);
expect(BOTTOM_NAV_ITEMS).toContainEqual({
  key: 'timeline', label: 'Hoạt động', href: ROUTES.timeline,
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- shared/lib/navigation/routes.test.ts shared/components/ui/BottomNav.test.tsx --runInBand`

Expected: failures because the `timeline` and `memoryBook` route keys do not exist.

- [ ] **Step 3: Implement central route ownership**

Replace the memories entry with:

```ts
timeline: '/(main)/timeline',
memoryBook: '/(main)/memory-book',
```

and use `timeline` in `BottomNavItem`, `MAIN_NAV_PATHS`, and
`BOTTOM_NAV_ITEMS`. Register `timeline` with animation `none`, register
`memory-book` with animation `slide_from_right`, and update Home so Timeline
uses `router.replace(ROUTES.timeline)` while Memory Book uses
`router.push(ROUTES.memoryBook)`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- shared/lib/navigation/routes.test.ts shared/components/ui/BottomNav.test.tsx --runInBand`

Expected: PASS.

### Task 2: Recover and semantically rename Timeline

**Files:**
- Delete after source recovery: `flamee-mobile/features/memories/**`, `flamee-mobile/app/(main)/memories.tsx`
- Create: `flamee-mobile/app/(main)/timeline.tsx`
- Create/rename: `flamee-mobile/features/timeline/**`
- Modify: any feature consumer found by `rg "memories|Memories" flamee-mobile/app flamee-mobile/features flamee-mobile/shared`

**Interfaces:**
- Produces `TimelineScreen` from `@/features/timeline` and Timeline-only
  imports such as `useTimeline`, `timelineService`, and `timelineSchema`.
- Preserves existing Timeline list, filter, create, and edit interactions.

- [ ] **Step 1: Write failing Timeline entry test**

```ts
import { TimelineScreen } from './TimelineScreen';

test('renders the recovered timeline overview', () => {
  render(<TimelineScreen />);
  expect(screen.getByText('Dòng thời gian')).toBeTruthy();
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- features/timeline/screens/TimelineScreen.test.tsx --runInBand`

Expected: FAIL because `features/timeline` does not exist.

- [ ] **Step 3: Recover before rename and apply the rename mechanically**

Read the pre-overwrite Timeline implementation from the last repository state
that contained it, copy only those source files into `features/timeline`, and
then reapply the present `@/shared/*` import paths. Rename semantic symbols:

```text
MemoriesScreen -> TimelineScreen
useMemories -> useTimeline
memoriesReducer -> timelineReducer
memoryService -> timelineService
memorySchema -> timelineSchema
Memory* -> Timeline* where the type/component is Timeline-specific
```

Keep `index.ts` and `types.ts` as conventional module filenames. Update
all test imports and create `app/(main)/timeline.tsx`:

```ts
import { TimelineScreen } from '@/features/timeline';
export default TimelineScreen;
```

- [ ] **Step 4: Run Timeline tests and verify GREEN**

Run: `npm test -- features/timeline --runInBand`

Expected: all recovered Timeline suites PASS with Timeline names and no
Memory Book copy.

### Task 3: Specify Memory Book model and reducer with test-first behaviour

**Files:**
- Create: `flamee-mobile/features/memory-book/types.ts`
- Create: `flamee-mobile/features/memory-book/services/memoryBookService.ts`
- Create: `flamee-mobile/features/memory-book/services/memoryBookService.test.ts`
- Create: `flamee-mobile/features/memory-book/schemas/memoryBookSchema.ts`
- Create: `flamee-mobile/features/memory-book/schemas/memoryBookSchema.test.ts`
- Create: `flamee-mobile/features/memory-book/hooks/useMemoryBook.ts`
- Create: `flamee-mobile/features/memory-book/hooks/useMemoryBook.test.tsx`

**Interfaces:**
- Produces `MemoryBookEntry`, `MemoryBookDraft`, `MemoryBookView`, and
  `useMemoryBook()` returning `entries`, `selectedEntry`, `view`, `errors`,
  `openDetail`, `openCreate`, `openEdit`, `saveCreate`, `saveEdit`,
  `requestDelete`, `confirmDelete`, and close/update callbacks.

- [ ] **Step 1: Write failing service, schema, and hook tests**

```ts
expect(createMemoryBookSeed()).toHaveLength(3);
expect(memoryBookSchema.safeParse({ title: '', occurredOn: '' }).success).toBe(false);
expect(result.current.saveCreate()).toBe(false);
expect(result.current.errors.title).toBeTruthy();
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- features/memory-book/services/memoryBookService.test.ts features/memory-book/schemas/memoryBookSchema.test.ts features/memory-book/hooks/useMemoryBook.test.tsx --runInBand`

Expected: FAIL because Memory Book modules do not exist.

- [ ] **Step 3: Implement typed feature-local data flow**

Define a record with `id`, `title`, `occurredOn`, `coverAssetKey`, `note`,
and optional `location`. Keep immutable `addMemoryBookEntry`,
`updateMemoryBookEntry`, and `removeMemoryBookEntry` in the service. Define
Zod validation for non-empty trimmed title and an ISO date. The reducer must
ignore unknown ids, retain validation errors for invalid saves, and return to
the overview only after a successful create, update, or confirmed delete.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- features/memory-book/services/memoryBookService.test.ts features/memory-book/schemas/memoryBookSchema.test.ts features/memory-book/hooks/useMemoryBook.test.tsx --runInBand`

Expected: PASS.

### Task 4: Build Memory Book’s four SVG-derived screens

**Files:**
- Create: `flamee-mobile/features/memory-book/components/MemoryBookCard.tsx`
- Create: `flamee-mobile/features/memory-book/components/MemoryBookForm.tsx`
- Create: `flamee-mobile/features/memory-book/components/MemoryBookEmptyState.tsx`
- Create: `flamee-mobile/features/memory-book/screens/MemoryBookScreen.tsx`
- Create: `flamee-mobile/features/memory-book/screens/MemoryBookDetailScreen.tsx`
- Create: `flamee-mobile/features/memory-book/screens/CreateMemoryBookScreen.tsx`
- Create: `flamee-mobile/features/memory-book/screens/EditMemoryBookScreen.tsx`
- Create: `flamee-mobile/features/memory-book/index.ts`
- Create: focused screen/component tests beside each screen

**Interfaces:**
- Consumes `useMemoryBook` only through explicit props/callbacks.
- Produces `MemoryBookScreen` as the route entry and four visual states
  matching overview, detail, add, and edit SVG frames.

- [ ] **Step 1: Write failing screen-flow tests**

```ts
render(<MemoryBookScreen />);
fireEvent.press(screen.getByText('Kỉ niệm 500 ngày bên nhau'));
expect(screen.getByText('Chi tiết kỉ niệm')).toBeTruthy();
fireEvent.press(screen.getByLabelText('Thêm kỉ niệm'));
expect(screen.getByText('Thêm kỉ niệm mới')).toBeTruthy();
```

- [ ] **Step 2: Run screen tests and verify RED**

Run: `npm test -- features/memory-book/screens --runInBand`

Expected: FAIL because the feature screens do not exist.

- [ ] **Step 3: Implement the visual compositions and interactions**

Use existing shared `AppScreen`, `ScreenHeader`, `Card`, `Button`,
`TextField`, theme tokens, `Image`, and Ionicons. Recreate the supplied
frame hierarchy: gallery header and add action, image-led book cards, detailed
entry view, and add/edit forms. Screen components are presentational; the
route-level `MemoryBookScreen` selects child screens from `view` and passes
the hook's typed callbacks. Provide an explicit empty collection state and
disabled/visible error treatment from schema state.

- [ ] **Step 4: Run screen tests and verify GREEN**

Run: `npm test -- features/memory-book/screens --runInBand`

Expected: PASS for overview/detail/create/edit/delete transitions.

### Task 5: Integrate, remove obsolete files, and validate the migration

**Files:**
- Delete: `flamee-mobile/features/memories/screens/MemoryDetailScreen.tsx`
- Delete: `flamee-mobile/docs/superpowers/plans/2026-07-21-memories-svg-interface.md`
- Modify: affected barrel exports, route tests, and Home tests
- Create: `flamee-mobile/app/(main)/memory-book.tsx`

**Interfaces:**
- Produces two independent route entries with no legacy memories imports.

- [ ] **Step 1: Write failing integration tests**

```ts
expect(isMainNavigationPath('/memory-book')).toBe(false);
expect(HomeScreen).toNavigateWith('Sổ kỉ niệm', ROUTES.memoryBook, 'push');
expect(() => require('@/features/memories')).toThrow();
```

- [ ] **Step 2: Run integration tests and verify RED**

Run: `npm test -- features/home shared/lib/navigation --runInBand`

Expected: FAIL until the new Memory Book route and old module removal are
complete.

- [ ] **Step 3: Wire the Memory Book route and remove only obsolete artefacts**

Create `app/(main)/memory-book.tsx` exporting `MemoryBookScreen`. Once
Timeline has passed its recovered test suite and Memory Book passes its
feature tests, remove `features/memories`, `app/(main)/memories.tsx`, the
temporary detail screen, and the obsolete plan. Do not touch
`.tmp-memories-svg/` without a separate cleanup authorization.

- [ ] **Step 4: Run migration checks and verify GREEN**

Run:

```powershell
rg -n "ROUTES\.memories|/memories|features/memories|MemoriesScreen" flamee-mobile/app flamee-mobile/features flamee-mobile/shared
npm test -- --runInBand
npx tsc --noEmit
npm run lint
```

Expected: `rg` returns no application-source matches; Jest, TypeScript, and
lint all exit with code 0.

## Plan self-review

- Route, BottomNav, Home, recovery, isolated Memory Book state, all four SVG
  screens, validation, deletion, obsolete files, and final verification map
  to Tasks 1–5.
- The plan uses no compatibility aliases or screen-specific workaround logic.
- Public type and callback names are defined in Task 3 before Task 4 consumes
  them.
- The plan intentionally omits commits because the current Git index was
  already contaminated by an earlier mixed commit; commit history requires a
  separate user-authorized cleanup.
