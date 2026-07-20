# Memories Feature Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing memories/timeline code with a responsive, Figma-faithful `/memories` feature that supports local filtering, creation, editing, and deletion.

**Architecture:** `MemoriesScreen` is the container for a route-local reducer exposed through `useMemories`; all child screens and components are typed presentational units. Pure mock-data operations and date/filter logic live in `memoryService.ts`, while Zod owns form validation and the shared Flamee theme plus a feature layout module own responsive values.

**Tech Stack:** Expo 54, React Native 0.81, Expo Router 6, TypeScript 5.9, Zod 4, React Native Testing Library, Jest Expo, Expo Image, Expo Linear Gradient.

## Global Constraints

- The only public route for this feature is `/(main)/memories`.
- Remove the old `/timeline` route, route constant, and technical naming.
- Keep the visible Figma heading `Dòng thời gian`.
- The bottom-navigation item `Hoạt động` routes to `/memories` and is selected there.
- Use deterministic mock data and route-local state; do not call or extend the backend.
- Do not add React Query or Zustand to this feature.
- Do not add a date-picker, camera, gallery, or notification dependency.
- Follow `skills/frontend-development-standards/SKILL.md`.
- Keep containers, hooks, services, schemas, and presentational components separate.
- Reuse `flameeTheme`; repeated values belong in centralized semantic tokens.
- Do not use module-level `Dimensions.get()` or fixed absolute coordinates for primary content.
- Use exact downloaded Figma assets for non-generic artwork and illustrated icons.
- Preserve unrelated user changes and the pre-existing deleted docs in the working tree.

---

## File Map

### Route and navigation

- Modify `lib/navigation/routes.ts`: remove `ROUTES.timeline`; keep `ROUTES.memories` as the `Hoạt động` target.
- Modify `lib/navigation/routes.test.ts`: prove `/memories` is a main route and no route metadata contains `/timeline`.
- Modify `app/(main)/_layout.tsx`: remove the timeline stack registration.
- Delete `app/(main)/timeline.tsx`: remove the old route file.
- Modify `features/home/screens/HomeScreen.tsx`: point the visible `Dòng thời gian` shortcut at `ROUTES.memories`.
- Modify `features/profile/services/profileService.ts`: rename the technical menu ID from `timeline` to `memories`.

### Domain and state

- Replace `features/memories/types.ts`: canonical memory, filter, draft, reminder, and view types.
- Replace `features/memories/services/memoryService.ts`: deterministic seed, date math, filter, immutable CRUD.
- Create `features/memories/services/memoryService.test.ts`: pure behavior tests.
- Create `features/memories/schemas/memorySchema.ts`: Zod schemas and Vietnamese validation messages.
- Create `features/memories/schemas/memorySchema.test.ts`: validation tests.
- Replace `features/memories/hooks/useMemories.ts`: local reducer and typed action facade.
- Create `features/memories/hooks/useMemories.test.tsx`: state-machine tests.

### Responsive design and assets

- Create `features/memories/memoryLayout.ts`: pure content/grid width helpers and semantic constants.
- Create `features/memories/memoryLayout.test.ts`: compact, standard, and tablet width tests.
- Create `features/memories/constants.ts`: labels and local asset map.
- Create `assets/memories/relationship-hero.jpg`.
- Create `assets/memories/memory-together.png`.
- Create `assets/memories/memory-birthday.png`.
- Create `assets/memories/memory-anniversary.png`.
- Create `assets/memories/memory-special.png`.
- Create `assets/memories/memory-holiday.png`.
- Create `assets/memories/memory-custom.png`.
- Create `assets/memories/memory-movie.png`.
- Create `assets/memories/memory-trip.png`.

### Presentational components and screens

- Delete `features/memories/components/MemoryCard.tsx`.
- Delete `features/memories/screens/TimelineScreen.tsx`.
- Create `features/memories/components/MemoryActionBar.tsx`.
- Create `features/memories/components/MemoryChip.tsx`.
- Create `features/memories/components/MemoryDetailsForm.tsx`.
- Create `features/memories/components/MemoryEmptyState.tsx`.
- Create `features/memories/components/MemoryHero.tsx`.
- Create `features/memories/components/MemoryListCard.tsx`.
- Create `features/memories/components/MemoryStepIndicator.tsx`.
- Create `features/memories/components/MemoryTypeCard.tsx`.
- Create `features/memories/components/MemoryControls.test.tsx`.
- Create `features/memories/components/MemoriesOverview.tsx`.
- Create `features/memories/components/MemoriesOverview.test.tsx`.
- Create `features/memories/screens/MemoryFilterScreen.tsx`.
- Create `features/memories/screens/MemoryFilterScreen.test.tsx`.
- Create `features/memories/screens/CreateMemoryScreen.tsx`.
- Create `features/memories/screens/CreateMemoryScreen.test.tsx`.
- Create `features/memories/screens/EditMemoryScreen.tsx`.
- Create `features/memories/screens/EditMemoryScreen.test.tsx`.
- Replace `features/memories/screens/MemoriesScreen.tsx`.
- Create `features/memories/screens/MemoriesScreen.test.tsx`.
- Replace `features/memories/index.ts`: export only the feature's public screen and types.

---

### Task 1: Consolidate Navigation on `/memories`

**Files:**

- Modify: `lib/navigation/routes.test.ts`
- Modify: `lib/navigation/routes.ts`
- Modify: `app/(main)/_layout.tsx`
- Delete: `app/(main)/timeline.tsx`
- Modify: `features/home/screens/HomeScreen.tsx`
- Modify: `features/profile/services/profileService.ts`
- Modify: `features/memories/index.ts`
- Delete: `features/memories/screens/TimelineScreen.tsx`

**Interfaces:**

- Consumes: existing `ROUTES`, `BOTTOM_NAV_ITEMS`, `isMainNavigationPath`.
- Produces: `ROUTES.memories` as the only memories route and no TypeScript/TSX reference to `timeline`.

- [ ] **Step 1: Write the failing route test**

Replace the route test expectations with:

```ts
import { BOTTOM_NAV_ITEMS, isMainNavigationPath, ROUTES } from './routes';

describe('memories navigation', () => {
  it('uses /memories as the only memories route', () => {
    expect(ROUTES.memories).toBe('/(main)/memories');
    expect('timeline' in ROUTES).toBe(false);
    expect(Object.values(ROUTES).some((href) => String(href).includes('/timeline'))).toBe(false);
  });

  it('shows the bottom navigation on /memories', () => {
    expect(isMainNavigationPath('/memories')).toBe(true);
  });

  it('routes Hoạt động to /memories', () => {
    expect(BOTTOM_NAV_ITEMS.find((item) => item.key === 'memories')).toEqual({
      key: 'memories',
      label: 'Hoạt động',
      href: ROUTES.memories,
    });
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npx jest lib/navigation/routes.test.ts --runInBand --config '{"preset":"jest-expo"}'
```

Expected: FAIL because `timeline` still exists in `ROUTES`.

- [ ] **Step 3: Remove the old route and technical references**

Make these exact changes:

```ts
// lib/navigation/routes.ts
export const ROUTES = {
  start: '/',
  login: '/(auth)/login',
  register: '/(auth)/register',
  home: '/(main)/home',
  memories: '/(main)/memories',
  mood: '/(main)/mood',
  missions: '/(main)/missions',
  dates: '/(main)/dates',
  ai: '/(main)/ai',
  profile: '/(main)/profile',
} as const satisfies Record<string, Href>;
```

Remove `<Stack.Screen name="timeline" ... />` from `app/(main)/_layout.tsx`, delete `app/(main)/timeline.tsx`, replace `ROUTES.timeline` with `ROUTES.memories` in `HomeScreen.tsx`, rename profile menu ID `timeline` to `memories`, remove the `TimelineScreen` export, and delete the old screen file.

- [ ] **Step 4: Verify GREEN and scan source naming**

Run:

```powershell
npx jest lib/navigation/routes.test.ts components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'
rg -n "ROUTES\.timeline|/\(main\)/timeline|/timeline|TimelineScreen|useTimeline" app features lib components -g '*.ts' -g '*.tsx'
```

Expected: route tests PASS and `rg` returns no matches.

- [ ] **Step 5: Commit**

```powershell
git add -- 'flamee-mobile/lib/navigation/routes.ts' 'flamee-mobile/lib/navigation/routes.test.ts' 'flamee-mobile/app/(main)/_layout.tsx' 'flamee-mobile/app/(main)/timeline.tsx' 'flamee-mobile/features/home/screens/HomeScreen.tsx' 'flamee-mobile/features/profile/services/profileService.ts' 'flamee-mobile/features/memories/index.ts' 'flamee-mobile/features/memories/screens/TimelineScreen.tsx'
git commit -m "refactor: consolidate memories navigation"
```

---

### Task 2: Define the Domain Model, Validation, and Pure Data Operations

**Files:**

- Replace: `features/memories/types.ts`
- Replace: `features/memories/services/memoryService.ts`
- Create: `features/memories/services/memoryService.test.ts`
- Create: `features/memories/schemas/memorySchema.ts`
- Create: `features/memories/schemas/memorySchema.test.ts`

**Interfaces:**

- Produces: `MemoryItem`, `MemoryDraft`, `MemoryFilter`, `RelationshipSummary`, `createMemorySeed`, `createRelationshipSummary`, `getDaysUntil`, `filterMemories`, `addMemory`, `updateMemory`, `removeMemory`, `memoryDetailsSchema`, and `memoryReminderSchema`.
- Consumes: JavaScript `Date` and Zod only.

- [ ] **Step 1: Write failing service and schema tests**

Create tests covering these exact examples:

```ts
const referenceDate = new Date('2026-05-31T00:00:00.000Z');

expect(getDaysUntil('2026-06-12', referenceDate)).toBe(12);
expect(getDaysUntil('2026-05-31', referenceDate)).toBe(0);
expect(filterMemories(items, { status: 'upcoming', type: 'all', range: 'next30' }, referenceDate))
  .toHaveLength(2);
expect(addMemory(items, newItem)).toEqual([...items, newItem]);
expect(updateMemory(items, updatedItem).find((item) => item.id === updatedItem.id))
  .toEqual(updatedItem);
expect(removeMemory(items, items[0].id)).not.toContainEqual(items[0]);

expect(memoryDetailsSchema.safeParse({
  title: '  ',
  eventDate: 'not-a-date',
  recurrence: 'none',
}).success).toBe(false);

expect(memoryReminderSchema.safeParse({
  enabled: true,
  leadDays: 3,
  time: '09:00',
  recipient: 'couple',
}).success).toBe(true);
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npx jest features/memories/services/memoryService.test.ts features/memories/schemas/memorySchema.test.ts --runInBand --config '{"preset":"jest-expo"}'
```

Expected: FAIL because the new exports and schema files do not exist.

- [ ] **Step 3: Implement canonical types**

Define the exact unions and records from the approved spec:

```ts
export type MemoryType =
  | 'together'
  | 'birthday'
  | 'anniversary'
  | 'special'
  | 'holiday'
  | 'custom';
export type MemoryRecurrence = 'none' | 'monthly' | 'yearly';
export type ReminderLeadDays = 1 | 3 | 7;
export type ReminderRecipient = 'couple' | 'self';
export type MemoryStatusFilter = 'all' | 'upcoming' | 'past';
export type MemoryRangeFilter = 'all' | 'next30' | 'past';
export type MemoriesView = 'overview' | 'filter' | 'create' | 'edit';
export type CreateMemoryStep = 1 | 2 | 3;

export type MemoryReminder = {
  enabled: true;
  leadDays: ReminderLeadDays;
  time: string;
  recipient: ReminderRecipient;
};

export type MemoryItem = {
  id: string;
  type: MemoryType;
  title: string;
  eventDate: string;
  recurrence: MemoryRecurrence;
  coverAssetKey?: string;
  note?: string;
  reminder?: MemoryReminder;
};

export type MemoryDraft = Omit<MemoryItem, 'id'>;
export type MemoryTypeFilter = MemoryType | 'all';
export type MemoryFilter = {
  status: MemoryStatusFilter;
  type: MemoryTypeFilter;
  range: MemoryRangeFilter;
};
export type RelationshipSummary = {
  daysTogether: number;
  countdownDays: number;
  countdownHours: number;
};
```

- [ ] **Step 4: Implement Zod validation**

Use:

```ts
import { z } from 'zod';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const memoryDetailsSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên cột mốc').max(120, 'Tên cột mốc tối đa 120 ký tự'),
  eventDate: z.string().regex(isoDatePattern, 'Ngày diễn ra phải có định dạng YYYY-MM-DD'),
  recurrence: z.enum(['none', 'monthly', 'yearly']),
  coverAssetKey: z.string().optional(),
  note: z.string().trim().max(300, 'Ghi chú tối đa 300 ký tự').optional(),
});

export const memoryReminderSchema = z.discriminatedUnion('enabled', [
  z.object({ enabled: z.literal(false) }),
  z.object({
    enabled: z.literal(true),
    leadDays: z.union([z.literal(1), z.literal(3), z.literal(7)]),
    time: z.string().regex(timePattern, 'Thời gian nhắc phải có định dạng HH:mm'),
    recipient: z.enum(['couple', 'self']),
  }),
]);
```

- [ ] **Step 5: Implement deterministic pure operations**

`createMemorySeed(referenceDate)` returns three items 12, 27, and 167 days after the reference date. `createRelationshipSummary()` returns the Figma values `500`, `12`, and `8`. `getDaysUntil()` normalizes both dates to UTC midnight. `filterMemories()` applies status, type, and range together. CRUD functions return new arrays and never mutate their arguments.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
npx jest features/memories/services/memoryService.test.ts features/memories/schemas/memorySchema.test.ts --runInBand --config '{"preset":"jest-expo"}'
```

Expected: both suites PASS with no warnings.

- [ ] **Step 7: Commit**

```powershell
git add -- 'flamee-mobile/features/memories/types.ts' 'flamee-mobile/features/memories/services/memoryService.ts' 'flamee-mobile/features/memories/services/memoryService.test.ts' 'flamee-mobile/features/memories/schemas/memorySchema.ts' 'flamee-mobile/features/memories/schemas/memorySchema.test.ts'
git commit -m "feat: add memories domain model"
```

---

### Task 3: Implement the Local Memories State Machine

**Files:**

- Replace: `features/memories/hooks/useMemories.ts`
- Create: `features/memories/hooks/useMemories.test.tsx`

**Interfaces:**

- Consumes: domain types, schemas, and pure service functions from Task 2.
- Produces: `useMemories(referenceDate?: Date)` and exported pure test helpers `createInitialMemoriesState()` and `memoriesReducer()`.

- [ ] **Step 1: Write failing reducer and hook tests**

Cover these transitions:

```ts
expect(state.view).toBe('overview');
state = memoriesReducer(state, { type: 'OPEN_CREATE' });
expect(state).toMatchObject({ view: 'create', createStep: 1 });
state = memoriesReducer(state, { type: 'SELECT_CREATE_TYPE', memoryType: 'together' });
state = memoriesReducer(state, { type: 'NEXT_CREATE_STEP' });
expect(state.createStep).toBe(2);
state = memoriesReducer(state, { type: 'UPDATE_CREATE_DETAILS', patch: validDetails });
state = memoriesReducer(state, { type: 'NEXT_CREATE_STEP' });
expect(state.createStep).toBe(3);

const { result } = renderHook(() => useMemories(referenceDate));
act(() => result.current.openFilter());
act(() => result.current.updateStagedFilter({ status: 'upcoming' }));
act(() => result.current.applyFilter());
expect(result.current.state.appliedFilter.status).toBe('upcoming');
```

Also test draft preservation on back, draft clearing on close, disabled-reminder omission, edit prefill/save, delete request/cancel/confirm, and filter cancel preserving the applied filter.

- [ ] **Step 2: Run tests and verify RED**

```powershell
npx jest features/memories/hooks/useMemories.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: FAIL because the reducer contract does not exist.

- [ ] **Step 3: Implement state and typed reducer actions**

Use this state shape:

```ts
export type MemoriesState = {
  items: MemoryItem[];
  view: MemoriesView;
  createStep: CreateMemoryStep;
  createDraft: Partial<MemoryDraft>;
  selectedMemoryId?: string;
  editDraft?: MemoryDraft;
  appliedFilter: MemoryFilter;
  stagedFilter: MemoryFilter;
  validationErrors: Record<string, string>;
  deleteConfirmationVisible: boolean;
};
```

Implement typed actions for open/close, staged filter updates, create type/details/reminder updates, step movement, create completion, edit updates/save, and delete confirmation.

Validation is performed before moving from create step 2, completing create, or saving edit. Map Zod issues by field name into `validationErrors`.

- [ ] **Step 4: Implement the hook facade**

The hook memoizes filtered items and exposes named callbacks instead of raw dispatch:

```ts
return {
  state,
  visibleItems,
  selectedMemory,
  openFilter,
  updateStagedFilter,
  applyFilter,
  closeFilter,
  clearFilter,
  openCreate,
  selectCreateType,
  updateCreateDetails,
  updateCreateReminder,
  nextCreateStep,
  previousCreateStep,
  closeCreate,
  completeCreate,
  openEdit,
  updateEditDraft,
  saveEdit,
  closeEdit,
  requestDelete,
  cancelDelete,
  confirmDelete,
};
```

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npx jest features/memories/hooks/useMemories.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: PASS for all reducer and hook transitions.

- [ ] **Step 6: Commit**

```powershell
git add -- 'flamee-mobile/features/memories/hooks/useMemories.ts' 'flamee-mobile/features/memories/hooks/useMemories.test.tsx'
git commit -m "feat: add memories local state machine"
```

---

### Task 4: Add Responsive Layout Helpers and Exact Figma Assets

**Files:**

- Create: `features/memories/memoryLayout.ts`
- Create: `features/memories/memoryLayout.test.ts`
- Create: `features/memories/constants.ts`
- Create: `assets/memories/*`

**Interfaces:**

- Produces: `MEMORY_LAYOUT`, `getMemoryContentWidth`, `getMemoryGridItemWidth`, `MEMORY_TYPE_OPTIONS`, and `MEMORY_ASSETS`.
- Consumes: `flameeTheme`, `MemoryType`, and local bundled images.

- [ ] **Step 1: Write failing responsive helper tests**

```ts
expect(getMemoryContentWidth(320)).toBe(272);
expect(getMemoryContentWidth(402)).toBe(354);
expect(getMemoryContentWidth(1024)).toBe(MEMORY_LAYOUT.maxContentWidth);
expect(getMemoryGridItemWidth(354)).toBe((354 - MEMORY_LAYOUT.gridGap) / 2);
expect(getMemoryGridItemWidth(272)).toBe((272 - MEMORY_LAYOUT.gridGap) / 2);
```

- [ ] **Step 2: Run the helper test and verify RED**

```powershell
npx jest features/memories/memoryLayout.test.ts --runInBand --config '{"preset":"jest-expo"}'
```

Expected: FAIL because `memoryLayout.ts` does not exist.

- [ ] **Step 3: Implement centralized responsive helpers**

```ts
export const MEMORY_LAYOUT = {
  horizontalPadding: flameeTheme.spacing[6],
  maxContentWidth: 402 - flameeTheme.spacing[6] * 2,
  gridGap: flameeTheme.spacing[4],
  bottomNavClearance: 112,
  actionMinHeight: 44,
} as const;

export function getMemoryContentWidth(viewportWidth: number) {
  return Math.min(
    Math.max(viewportWidth - MEMORY_LAYOUT.horizontalPadding * 2, 0),
    MEMORY_LAYOUT.maxContentWidth,
  );
}

export function getMemoryGridItemWidth(contentWidth: number) {
  return Math.max((contentWidth - MEMORY_LAYOUT.gridGap) / 2, 0);
}
```

Components consume these tokens; they do not repeat the numeric values.

- [ ] **Step 4: Download Figma assets**

Create `assets/memories/`, then download the exact bytes from the design-context URLs:

```powershell
Invoke-WebRequest 'https://www.figma.com/api/mcp/asset/d0a87bc5-3d92-4cd8-9b70-25db02384bc4' -OutFile 'assets/memories/relationship-hero.jpg'
Invoke-WebRequest 'https://www.figma.com/api/mcp/asset/1c9e9f3b-e6a1-4fdc-9693-073220956947' -OutFile 'assets/memories/memory-together.png'
Invoke-WebRequest 'https://www.figma.com/api/mcp/asset/029d3f81-a876-414c-b635-6729d7a989f0' -OutFile 'assets/memories/memory-birthday.png'
Invoke-WebRequest 'https://www.figma.com/api/mcp/asset/82ce4f77-3cf9-4b80-80b1-af27cca876fa' -OutFile 'assets/memories/memory-anniversary.png'
Invoke-WebRequest 'https://www.figma.com/api/mcp/asset/a9834504-6d84-4770-86fc-ef8e8519dffe' -OutFile 'assets/memories/memory-special.png'
Invoke-WebRequest 'https://www.figma.com/api/mcp/asset/e29d00da-37d6-4982-bdcb-c364d7d64893' -OutFile 'assets/memories/memory-holiday.png'
Invoke-WebRequest 'https://www.figma.com/api/mcp/asset/6de6490f-8c1f-4e56-9e2b-466649ec7317' -OutFile 'assets/memories/memory-custom.png'
Invoke-WebRequest 'https://www.figma.com/api/mcp/asset/6b543e69-b2ab-4751-bb23-e93db6ff9e20' -OutFile 'assets/memories/memory-movie.png'
Invoke-WebRequest 'https://www.figma.com/api/mcp/asset/19d988a9-9021-4820-8ee1-d2ef42fe6a3d' -OutFile 'assets/memories/memory-trip.png'
```

If a URL returns non-image content, stop and reacquire that node's design context rather than creating a substitute.

- [ ] **Step 5: Map labels and assets**

Create a typed `MEMORY_TYPE_OPTIONS` array with Vietnamese labels and matching local `require()` values. Include recurrence, reminder lead-time, recipient, status, and range label maps in the same module.

- [ ] **Step 6: Verify GREEN and asset integrity**

```powershell
npx jest features/memories/memoryLayout.test.ts --runInBand --config '{"preset":"jest-expo"}'
Get-ChildItem 'assets/memories' | Select-Object Name,Length
```

Expected: helper tests PASS and all nine assets have a non-zero byte length.

- [ ] **Step 7: Commit**

```powershell
git add -- 'flamee-mobile/features/memories/memoryLayout.ts' 'flamee-mobile/features/memories/memoryLayout.test.ts' 'flamee-mobile/features/memories/constants.ts' 'flamee-mobile/assets/memories'
git commit -m "feat: add memories design assets"
```

---

### Task 5: Build Reusable Memories Controls

**Files:**

- Delete: `features/memories/components/MemoryCard.tsx`
- Create: `features/memories/components/MemoryActionBar.tsx`
- Create: `features/memories/components/MemoryChip.tsx`
- Create: `features/memories/components/MemoryDetailsForm.tsx`
- Create: `features/memories/components/MemoryEmptyState.tsx`
- Create: `features/memories/components/MemoryStepIndicator.tsx`
- Create: `features/memories/components/MemoryTypeCard.tsx`
- Create: `features/memories/components/MemoryControls.test.tsx`

**Interfaces:**

- Produces typed presentational controls with no service, router, reducer, or storage imports.
- Consumes `AppText`, `Button`, `TextField`, `flameeTheme`, constants, and callback props.

- [ ] **Step 1: Write failing component tests**

Create `MemoryControls.test.tsx` and assert:

- chips expose `accessibilityState.selected`;
- step indicator exposes current step;
- type cards have a 44-point minimum touch target and selected state;
- action bar invokes back and primary callbacks;
- details form renders field-specific errors;
- empty state invokes clear filter.

- [ ] **Step 2: Run the screen/component suites and verify RED**

```powershell
npx jest features/memories/components/MemoryControls.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: FAIL because the controls do not exist.

- [ ] **Step 3: Implement the controls**

Use typed props and semantic styles. `MemoryChip` supports selected and unselected visual states; `MemoryStepIndicator` renders three flexible segments without absolute coordinates; `MemoryActionBar` uses two equal-width actions; `MemoryDetailsForm` is controlled and emits typed patches; `MemoryTypeCard` receives its computed width from its parent; `MemoryEmptyState` wraps `StateView`.

Do not add data operations or router calls to any of these files.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npx jest features/memories/components/MemoryControls.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: the control-level assertions PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- 'flamee-mobile/features/memories/components'
git commit -m "feat: add memories form controls"
```

---

### Task 6: Build the Responsive Memories Overview

**Files:**

- Create: `features/memories/components/MemoryHero.tsx`
- Create: `features/memories/components/MemoryListCard.tsx`
- Create: `features/memories/components/MemoriesOverview.tsx`
- Create: `features/memories/components/MemoriesOverview.test.tsx`

**Interfaces:**

- Consumes: `RelationshipSummary`, filtered `MemoryItem[]`, local asset map, date/countdown helpers, and callbacks.
- Produces: complete overview content without owning feature state.

- [ ] **Step 1: Write the failing overview test**

Render with deterministic props and assert:

```ts
expect(getByText('Dòng thời gian')).toBeTruthy();
expect(getByText('500')).toBeTruthy();
expect(getByText('Các cột mốc sắp đến')).toBeTruthy();
expect(getByText('Kỉ niệm 500 ngày bên nhau')).toBeTruthy();
fireEvent.press(getByRole('button', { name: 'Lọc cột mốc' }));
expect(onOpenFilter).toHaveBeenCalledTimes(1);
fireEvent.press(getByRole('button', { name: 'Thêm cột mốc' }));
expect(onAdd).toHaveBeenCalledTimes(1);
fireEvent.press(getByRole('button', { name: /Mở Kỉ niệm 500 ngày bên nhau/ }));
expect(onOpenMemory).toHaveBeenCalledWith('together-500');
```

- [ ] **Step 2: Run test and verify RED**

```powershell
npx jest features/memories/components/MemoriesOverview.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: FAIL because the overview components do not exist.

- [ ] **Step 3: Implement hero and cards**

`MemoryHero` uses the local relationship image, `LinearGradient`, an `aspectRatio`, flexible copy, and summary values. `MemoryListCard` uses a local exported type icon, flexible text, a derived countdown, and a Vietnamese date. Neither fixes width from the Figma viewport.

- [ ] **Step 4: Implement overview composition**

Use `SafeAreaView`, `ScrollView`, `useWindowDimensions()`, `getMemoryContentWidth()`, and bottom-nav clearance. Center the computed content width. Render the empty state when `memories.length === 0`. The add action is the only primary element using absolute positioning.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npx jest features/memories/components/MemoriesOverview.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: PASS without act warnings.

- [ ] **Step 6: Commit**

```powershell
git add -- 'flamee-mobile/features/memories/components/MemoryHero.tsx' 'flamee-mobile/features/memories/components/MemoryListCard.tsx' 'flamee-mobile/features/memories/components/MemoriesOverview.tsx' 'flamee-mobile/features/memories/components/MemoriesOverview.test.tsx'
git commit -m "feat: add memories overview"
```

---

### Task 7: Build the Filter Screen

**Files:**

- Create: `features/memories/screens/MemoryFilterScreen.tsx`
- Create: `features/memories/screens/MemoryFilterScreen.test.tsx`

**Interfaces:**

- Consumes: staged `MemoryFilter`, typed patch callback, apply callback, and close callback.
- Produces: a controlled full-screen filter composition.

- [ ] **Step 1: Write the failing filter test**

Assert that the screen renders `Bộ lọc`, exposes selected chips, updates status/type/range through callbacks, closes on back, and calls apply exactly once.

- [ ] **Step 2: Run test and verify RED**

```powershell
npx jest features/memories/screens/MemoryFilterScreen.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: FAIL because the screen does not exist.

- [ ] **Step 3: Implement the controlled screen**

Use a safe-area container, centered responsive content, a scrollable body, flexible wrapping chip rows, a controlled type selector, and a footer action that remains visible without fixed `top` coordinates. The footer respects bottom insets.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npx jest features/memories/screens/MemoryFilterScreen.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- 'flamee-mobile/features/memories/screens/MemoryFilterScreen.tsx' 'flamee-mobile/features/memories/screens/MemoryFilterScreen.test.tsx'
git commit -m "feat: add memories filter screen"
```

---

### Task 8: Build Create and Edit Workflows

**Files:**

- Create: `features/memories/screens/CreateMemoryScreen.tsx`
- Create: `features/memories/screens/CreateMemoryScreen.test.tsx`
- Create: `features/memories/screens/EditMemoryScreen.tsx`
- Create: `features/memories/screens/EditMemoryScreen.test.tsx`

**Interfaces:**

- Create consumes current step, draft, validation errors, and typed callbacks.
- Edit consumes the edit draft, validation errors, delete-confirmation state, and typed callbacks.
- Both remain controlled and side-effect free.

- [ ] **Step 1: Write failing controlled-screen tests**

Create `CreateMemoryScreen.test.tsx` and `EditMemoryScreen.test.tsx`. Test:

- step 1 renders all six types and invokes the selected-type callback;
- step 2 emits controlled detail patches and renders validation errors;
- step 3 emits reminder patches and invokes completion;
- every step invokes the supplied back callback;
- edit opens with prefilled title/date/recurrence/note;
- edit emits controlled patches and invokes save;
- edit invokes request-delete without mutating data itself.

- [ ] **Step 2: Run the integration test and verify RED**

```powershell
npx jest features/memories/screens/CreateMemoryScreen.test.tsx features/memories/screens/EditMemoryScreen.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: FAIL because the workflow screens are not implemented.

- [ ] **Step 3: Implement create**

Use `KeyboardAvoidingView` plus `ScrollView`. Step 1 uses responsive two-column type cards. Step 2 uses the controlled details form and a dashed local mock-image selector. Step 3 uses reminder chips, switch, time field, and recipient chips. Render the shared step indicator and action bar on every step.

- [ ] **Step 4: Implement edit**

Render a responsive cover preview, controlled fields, shared validation messages, and the outlined `Xóa cột mốc` action. Use React Native `Alert.alert` or a controlled accessible confirmation dialog; tests mock the chosen mechanism and verify both branches.

- [ ] **Step 5: Run focused integration test**

Run:

```powershell
npx jest features/memories/screens/CreateMemoryScreen.test.tsx features/memories/screens/EditMemoryScreen.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: controlled create and edit screen assertions PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- 'flamee-mobile/features/memories/screens/CreateMemoryScreen.tsx' 'flamee-mobile/features/memories/screens/CreateMemoryScreen.test.tsx' 'flamee-mobile/features/memories/screens/EditMemoryScreen.tsx' 'flamee-mobile/features/memories/screens/EditMemoryScreen.test.tsx'
git commit -m "feat: add memories create and edit flows"
```

---

### Task 9: Integrate the Container, Public API, and Verify the Feature

**Files:**

- Replace: `features/memories/screens/MemoriesScreen.tsx`
- Create or complete: `features/memories/screens/MemoriesScreen.test.tsx`
- Replace: `features/memories/index.ts`
- Modify only if required by TypeScript: affected memories component files from Tasks 5–8.

**Interfaces:**

- Consumes: `useMemories`, overview, filter, create, and edit screens.
- Produces: public `MemoriesScreen` consumed by `app/(main)/memories.tsx`.

- [ ] **Step 1: Complete the failing container test**

Mock `expo-linear-gradient`, image rendering, and safe-area insets consistently with existing tests. Verify the overview initially, full-screen `Modal` rendering for each workflow, Android back callbacks, local CRUD, and bottom-nav compatibility.

- [ ] **Step 2: Run the container test and verify RED**

Run:

```powershell
npx jest features/memories/screens/MemoriesScreen.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: FAIL until `MemoriesScreen` wires every callback and modal correctly.

- [ ] **Step 3: Implement the container**

`MemoriesScreen` calls `useMemories()` once, passes data and named callbacks to the overview, and renders filter/create/edit through full-screen React Native `Modal` instances. It contains no date math, CRUD logic, or schema logic.

`features/memories/index.ts` exports:

```ts
export * from './screens/MemoriesScreen';
export type {
  MemoryFilter,
  MemoryItem,
  MemoryReminder,
  MemoryType,
  RelationshipSummary,
} from './types';
```

- [ ] **Step 4: Run all focused memories and navigation tests**

```powershell
npx jest features/memories lib/navigation/routes.test.ts components/ui/BottomNav.test.tsx --runInBand --config '{"preset":"jest-expo"}'
```

Expected: all focused suites PASS with zero failures.

- [ ] **Step 5: Run static verification**

```powershell
npx tsc --noEmit
npm run lint
rg -n "ROUTES\.timeline|/\(main\)/timeline|/timeline|TimelineScreen|useTimeline" app features lib components -g '*.ts' -g '*.tsx'
```

Expected: TypeScript and lint exit `0`; `rg` returns no matches.

- [ ] **Step 6: Run the full test suite**

```powershell
npm test
```

Expected: PASS. If it stops at the pre-existing missing `test/setup.ts`, record that exact configuration blocker and rely on the explicit focused Jest configuration for feature evidence.

- [ ] **Step 7: Perform responsive visual QA**

Start Expo web:

```powershell
npm run web -- --port 8081
```

Inspect `/memories` at representative widths `320`, `402`, `430`, and `768`. Verify:

- no horizontal overflow;
- no clipped title, card copy, or actions;
- the two-column type grid stays within its container;
- keyboard/form content remains scrollable;
- full-screen workflows cover the bottom navigation;
- the overview clears the bottom navigation;
- the standard-phone render matches the six Figma reference frames.

- [ ] **Step 8: Commit**

```powershell
git add -- 'flamee-mobile/features/memories' 'flamee-mobile/app/(main)' 'flamee-mobile/lib/navigation' 'flamee-mobile/features/home/screens/HomeScreen.tsx' 'flamee-mobile/features/profile/services/profileService.ts' 'flamee-mobile/assets/memories'
git commit -m "feat: redesign memories experience"
```

Do not stage the unrelated deleted docs under `docs/superpowers/`.

---

## Plan Self-Review

- Spec coverage: route consolidation, all six Figma views, mock CRUD, filter, validation, back behavior, empty state, responsive layout, assets, accessibility, and verification are assigned to tasks.
- Placeholder scan: no placeholder, deferred implementation, or undefined neighboring interface remains.
- Type consistency: all tasks use `MemoryItem`, `MemoryDraft`, `MemoryFilter`, `MemoriesView`, `CreateMemoryStep`, `MemoryReminder`, and the named hook callbacks consistently.
- Scope check: this is one cohesive frontend feature; backend, device media, notifications, and new dependencies remain excluded.
