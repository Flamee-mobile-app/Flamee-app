# Memories Feature Redesign Design

**Date:** 2026-07-20
**Status:** Approved for implementation planning
**Figma file:** `Ke9lnLL4XvAeYJw0yb0yhb`

## 1. Goal

Rewrite `features/memories/` as Flamee's complete memories flow, using `/memories` as its only route. The implementation must closely reproduce the approved Figma design while remaining responsive, testable, and stable across common mobile screen sizes.

The feature uses deterministic mock data and route-local state. It does not call or extend the backend in this scope.

## 2. Approved Product Decisions

- The only public route for this feature is `/(main)/memories`.
- The old `/timeline` route, route constant, and technical naming are removed.
- The bottom-navigation item `Hoạt động` routes to `/memories` and is selected on that route.
- The visible Figma heading remains `Dòng thời gian`; only technical names and routes stop using `timeline`.
- The existing `features/memories/` implementation may be fully rewritten.
- Data lives in mock seed data and local state for the lifetime of the mounted feature.
- The implementation should match Figma closely but may improve responsive behavior and interaction safety.
- Figma's `402 × 874` frame is a visual reference, not a fixed application viewport.

## 3. Figma Sources

The implementation is based on design context retrieved from these nodes:

| Node | Name | Purpose |
| --- | --- | --- |
| `6511:5766` | Mốc thời gian kỉ niệm | Memories overview |
| `6511:6001` | Bộ lọc | Full-screen filter flow |
| `6511:5821` | Thêm cột mốc | Create step 1: choose type |
| `6511:5887` | Thêm cột mốc | Create step 2: enter details |
| `6511:5927` | Thêm cột mốc | Create step 3: reminder settings |
| `6511:5969` | Chỉnh sửa cột mốc | Edit and delete an existing memory |

## 4. Scope

### 4.1 Included

- Responsive overview screen matching the approved Figma composition.
- Relationship summary hero with days-together and countdown values.
- Upcoming-memory cards.
- Full-screen filter view.
- Three-step create-memory wizard.
- Edit-memory view with prefilled data.
- Local create, update, delete, and filter behavior.
- Form validation and inline validation messages.
- Empty-filter-results state.
- Delete confirmation.
- Bottom-navigation route update.
- Removal of the old `/timeline` technical route and references.
- Automated tests for state behavior, form flow, filtering, editing, deletion, responsive layout helpers, and bottom-navigation routing.

### 4.2 Excluded

- Backend integration or persistence across application restarts.
- Push notifications or operating-system reminder scheduling.
- Real camera, gallery permission, or image upload behavior.
- Date/time picker dependencies not already present in the project.
- Deep links into a particular wizard step or memory.
- Changes to unrelated Flamee features.

The image area in the create flow behaves as a local mock selector. It displays the approved upload state and can attach a bundled mock image without requesting device permissions.

## 5. User Experience

### 5.1 Memories Overview

The overview is the default content of `/memories`.

It contains:

1. The gradient-styled `Dòng thời gian` heading.
2. A relationship hero using the exported Figma image, warm Flamee gradient treatment, days-together value, and countdown units.
3. A section heading for upcoming memories with a small accessible filter action.
4. Memory cards showing the exported type icon, title, relative countdown, and formatted date.
5. A floating add action matching the Figma placement and visual treatment.
6. The shared Flamee bottom navigation, with `Hoạt động` selected.

Pressing the filter action opens the filter view. Pressing the floating add action opens create step 1. Pressing a memory card opens its edit view.

### 5.2 Filter View

The filter view covers the route as a full-screen modal so the route remains `/memories` and the shared bottom navigation is not visible behind the active workflow.

It includes:

- Temporal status chips: all, upcoming, and past.
- A memory-type selector.
- Range chips: all, next 30 days, and past.
- An `Áp dụng` action.

Filter choices are staged locally and only become active after `Áp dụng`. Closing the filter without applying preserves the previously active filter.

If no memory matches, the overview displays a dedicated empty state with a clear-filter action.

### 5.3 Create Memory

The create flow is a three-step full-screen modal.

#### Step 1: Type

The user selects one of:

- Days together
- Birthday
- Anniversary
- Special day
- Holiday
- Custom

The selected type is stored in the draft. Continuing requires a selected type.

#### Step 2: Details

The user enters:

- Name
- Event date
- Recurrence
- Optional cover image

Name and event date are required. Validation messages render directly below the corresponding field. The user cannot continue while the current step is invalid.

#### Step 3: Reminder

The user configures:

- Reminder enabled or disabled
- Reminder lead time: 1, 3, or 7 days
- Reminder time
- Recipient: both or self

When reminder is disabled, reminder-specific values are not stored in the completed memory.

`Hoàn tất` creates the memory in local state and returns to the overview. Going backward preserves the draft. Dismissing the entire wizard clears it.

### 5.4 Edit Memory

The edit view opens with the selected memory's current data.

The user can update:

- Cover image
- Name
- Event date
- Recurrence
- Optional note

Saving validates the same shared rules as creation, updates local state immutably, and returns to the overview.

Deleting requires an explicit confirmation dialog. Confirming removes the memory and returns to the overview; cancelling leaves both the memory and edit draft unchanged.

### 5.5 Back Behavior

- System back from filter or edit returns to the overview.
- System back from create steps 2 or 3 returns to the previous step.
- System back from create step 1 closes the wizard after discarding its draft.
- Back behavior never changes the route away from `/memories`.

## 6. Information Architecture

The feature stays in `features/memories/` and follows the project's frontend-development standards.

```text
features/memories/
├── index.ts
├── types.ts
├── components/
│   ├── MemoryActionBar.tsx
│   ├── MemoryChip.tsx
│   ├── MemoryDetailsForm.tsx
│   ├── MemoryEmptyState.tsx
│   ├── MemoryHero.tsx
│   ├── MemoryListCard.tsx
│   ├── MemoryStepIndicator.tsx
│   ├── MemoryTypeCard.tsx
│   └── MemoriesOverview.tsx
├── hooks/
│   └── useMemories.ts
├── schemas/
│   └── memorySchema.ts
├── screens/
│   ├── CreateMemoryScreen.tsx
│   ├── EditMemoryScreen.tsx
│   ├── MemoryFilterScreen.tsx
│   └── MemoriesScreen.tsx
└── services/
    └── memoryService.ts
```

Responsibilities:

- `MemoriesScreen` is the container. It owns the feature hook, selects the active view, and passes typed props to presentational screens and components.
- Files under `screens/` render full-screen compositions but do not own data operations.
- Files under `components/` are presentational and side-effect free.
- `useMemories` owns route-local reducer state and action orchestration.
- `memoryService` contains deterministic seed creation and pure list operations such as add, update, remove, and filter.
- `memorySchema` contains shared Zod validation used by create and edit.
- `index.ts` is the feature's only public import surface.

No cross-feature imports are introduced. Shared Flamee primitives continue to come from root `components/`, `constants/`, and `lib/`.

## 7. State Model

The feature uses a local `useReducer` inside `useMemories` because the wizard and modal transitions form one cohesive state machine. This remains local UI state; Zustand is not appropriate because no other route consumes it. React Query is not appropriate because there is no server state.

### 7.1 Core Memory

```ts
type MemoryType =
  | 'together'
  | 'birthday'
  | 'anniversary'
  | 'special'
  | 'holiday'
  | 'custom';

type MemoryRecurrence = 'none' | 'monthly' | 'yearly';
type ReminderLeadDays = 1 | 3 | 7;
type ReminderRecipient = 'couple' | 'self';

type MemoryReminder = {
  enabled: true;
  leadDays: ReminderLeadDays;
  time: string;
  recipient: ReminderRecipient;
};

type MemoryItem = {
  id: string;
  type: MemoryType;
  title: string;
  eventDate: string;
  recurrence: MemoryRecurrence;
  coverAssetKey?: string;
  note?: string;
  reminder?: MemoryReminder;
};
```

Dates are stored as ISO calendar strings (`YYYY-MM-DD`). Vietnamese formatting is derived for display. Relative countdowns are calculated through pure functions using an injectable reference date so tests remain deterministic.

### 7.2 Feature View State

```ts
type MemoriesView = 'overview' | 'filter' | 'create' | 'edit';
type CreateMemoryStep = 1 | 2 | 3;
```

The state contains:

- Current memory list.
- Active view.
- Current create step.
- Create draft.
- Selected memory ID and edit draft.
- Applied filter and staged filter.
- Validation errors.

State transitions are immutable and expressed as typed reducer actions. Presentational components never mutate memory arrays or drafts directly.

## 8. Visual and Responsive System

The implementation must not copy Figma's absolute coordinates or scatter screen-specific pixel values through components.

### 8.1 Tokens

- Reuse `flameeTheme` colors, gradients, typography, spacing, and radii.
- Add missing semantic layout tokens centrally only when the existing theme cannot express an approved design value.
- Repeated component dimensions and responsive breakpoints live in one feature layout module or the shared theme, never inline in multiple components.
- Figma values are translated into semantic intent such as content padding, control height, card radius, and content maximum width.

### 8.2 Layout Rules

- Read dimensions with `useWindowDimensions()` at render time.
- Use flex layout, `flexBasis`, `aspectRatio`, and container width.
- Do not use module-level `Dimensions.get()`.
- Do not use fixed `top` or `left` positions for primary content.
- Absolute positioning is limited to decorative layers and the floating action.
- Fields and cards fill their container instead of assuming a device width.
- The type grid has two responsive columns derived from container width and spacing tokens.
- Dynamic text can wrap and increase component height.
- The main content scrolls when vertical space is insufficient.
- Forms use `KeyboardAvoidingView` and scroll-to-visible behavior.
- Safe-area insets protect headers, footer actions, and the bottom navigation.
- Tablet content is centered within a semantic maximum content width instead of stretching indefinitely.

### 8.3 Assets

All non-generic images and illustrated icons are downloaded from the Figma exports and committed under `assets/memories/`. Components do not depend on temporary Figma MCP URLs.

An existing project icon may replace an exported icon only when its glyph clearly matches. No new hand-authored SVG paths are used as substitutes for Figma assets.

## 9. Navigation Changes

- `ROUTES.memories` remains `/(main)/memories`.
- `ROUTES.timeline` is removed.
- `app/(main)/timeline.tsx` is removed.
- `app/(main)/_layout.tsx` no longer registers the `timeline` stack screen.
- Home and profile shortcuts that previously targeted `ROUTES.timeline` target `ROUTES.memories`.
- The bottom-navigation `Hoạt động` item keeps its `memories` key and uses `ROUTES.memories`.
- `/memories` remains a main-navigation path, so the shared bottom navigation renders on the overview.
- Full-screen feature modals visually cover the shared navigation while active.

## 10. Validation, Empty States, and Failure Safety

- Memory name is trimmed, required, and length-bounded.
- Event date must be a valid ISO calendar date.
- A memory type is required before leaving step 1.
- Reminder time uses a validated 24-hour `HH:mm` value.
- Reminder lead time and recipient are required only when reminders are enabled.
- The edit form uses the same shared validation schema as create details.
- Invalid fields retain the user's input and show a specific Vietnamese message.
- A filter with no results renders a stable empty state rather than an empty white screen.
- Delete always requires confirmation.
- Closing a workflow never partially mutates the saved list.

Async loading, retry, and network error states are intentionally absent because the approved implementation has no asynchronous server operations. If an API replaces local data later, it must be introduced through the service layer and React Query with loading, error, empty, and success states.

## 11. Accessibility

- Interactive controls have a minimum 44-point touch target.
- Icon-only buttons have Vietnamese accessibility labels.
- Chips expose selected state.
- Wizard steps expose progress and current-step semantics.
- Form fields connect labels and validation messages.
- Delete confirmation clearly identifies the destructive action.
- Text remains readable when platform font scaling is enabled.
- Color is not the only indicator of selected or error state.

## 12. Testing Strategy

Implementation follows test-driven development.

### 12.1 Pure Logic Tests

- Seed data is deterministic.
- Relative countdown calculation handles future, today, and past dates.
- Filters combine status, type, and date range correctly.
- Add returns a new immutable list.
- Update changes only the selected memory.
- Delete removes only the confirmed memory.

### 12.2 Hook and State Tests

- Opening and closing each workflow produces the expected view.
- Back navigation follows the approved state transitions.
- Create drafts persist between wizard steps.
- Closing step 1 clears the draft.
- Applying filters commits staged filters.
- Cancelling filters preserves the active filter.
- Disabled reminder settings are omitted from saved data.

### 12.3 Component Tests

- Overview renders hero, seeded cards, filter action, and add action.
- Step 1 requires a type.
- Step 2 blocks continuation for invalid name or date.
- Step 3 creates a valid memory.
- Edit is prefilled and saves changes.
- Delete confirmation supports cancel and confirm.
- Empty results expose a clear-filter action.
- Bottom navigation's `Hoạt động` item targets `/memories` and is selected there.
- No route or navigation metadata references `/timeline`.

### 12.4 Verification

Before completion:

- Run focused tests during each red-green cycle.
- Run the full Jest suite.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Render the feature at representative compact-phone, standard-phone, large-phone, and tablet widths.
- Compare the standard-phone render against the six Figma reference nodes.
- Confirm there is no horizontal overflow, clipped action, keyboard overlap, or bottom-navigation overlap.

Known pre-existing test configuration failures must be reported separately and not attributed to this feature.

## 13. Acceptance Criteria

The feature is accepted when:

1. `/memories` is the only technical route and no source reference to `/timeline` remains.
2. `Hoạt động` routes to and is selected on `/memories`.
3. The overview, filter, three create steps, and edit view match the approved Figma structure and Flamee visual language.
4. The interface remains usable without clipping or overlap across the verified screen sizes.
5. Users can locally filter, add, edit, and delete memories.
6. Validation, cancellation, back behavior, and delete confirmation follow this specification.
7. Figma images and illustrated icons are stored locally.
8. The feature follows container/presentational separation and exposes imports through `features/memories/index.ts`.
9. Focused tests, TypeScript, and lint pass; full-suite status is reported with exact evidence.
