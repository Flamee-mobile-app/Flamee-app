# Timeline and Memory Book Separation Design

## Purpose

Restore the existing "Dòng thời gian" experience as an independent Timeline
feature, then introduce "Sổ kỉ niệm" as a separate feature based on the four
provided SVG reference frames. The two features must have distinct modules,
routes, state, tests, and entry points.

## Decisions

### Route ownership

| Experience | Feature module | Expo route | Public URL | Bottom navigation |
| --- | --- | --- | --- | --- |
| Dòng thời gian | `features/timeline` | `app/(main)/timeline.tsx` | `/timeline` | Yes |
| Sổ kỉ niệm | `features/memory-book` | `app/(main)/memory-book.tsx` | `/memory-book` | No |

`ROUTES.memories`, `app/(main)/memories.tsx`, and every `/memories`
reference are removed as part of the migration. There is no compatibility
alias or redirect: Timeline owns `/timeline` and Memory Book owns
`/memory-book`.

### Feature boundaries

`features/timeline` is the semantic rename of the pre-existing Timeline
feature. Its public entry point is `TimelineScreen`; its timeline-specific
types, service, schema, hook, layout values, components, tests, and imports
use Timeline naming. Conventional module filenames such as `index.ts` and
`types.ts` remain conventional, while files whose names convey feature
semantics are renamed (for example `TimelineScreen.tsx`,
`useTimeline.ts`, and `timelineService.ts`).

`features/memory-book` is built independently with the established feature
layout: `components/`, `hooks/`, `screens/`, `services/`, `schemas/`,
`types.ts`, and `index.ts`. It must not import feature-specific code from
Timeline. Shared UI, layouts, navigation, types, and theme values continue to
come from `shared/` according to the shared-architecture design.

### Navigation flow

The Timeline item in `BOTTOM_NAV_ITEMS` uses `ROUTES.timeline`; main-navigation
path detection includes `/timeline`. The Home shortcut labelled "Dòng thời
gian" uses the normal tab replacement behaviour for that route.

The Home shortcut and highlight labelled "Sổ kỉ niệm" use
`router.push(ROUTES.memoryBook)`. `memory-book` is registered as a sliding
Stack screen, but is deliberately excluded from `MAIN_NAV_PATHS` and
`BOTTOM_NAV_ITEMS`, so the BottomNav is not rendered on any Memory Book
screen.

### Timeline recovery

The accidentally altered Memory Book presentation currently inside
`features/memories` is not treated as Timeline source. The implementation
first reconstructs the prior Timeline behaviour from the repository history,
then reapplies only the in-progress `@/shared/*` import migration required by
the current workspace. It will then rename that recovered code to Timeline.
This keeps existing list, filter, create, and edit behaviour intact without
embedding Memory Book state or labels into the Timeline reducer.

The temporary `MemoryDetailScreen.tsx` and obsolete Memory Book plan created
while the feature boundary was incorrect are removed only after Timeline's
recovery source and tests have been captured. Existing unrelated uncommitted
migration changes are preserved. The standalone Jest setup restoration is
kept because the active Jest configuration references it; it is not a Memory
Book workaround.

### Memory Book behaviour and visual scope

The supplied SVG defines four screens: book overview, memory detail, create,
and edit. The new feature implements those four flows with state owned by
`useMemoryBook`, validated input owned by a feature schema, and data access
owned by `memoryBookService`. Overview selection opens detail; adding and
editing operate on the same feature model; save returns to the appropriate
book view and delete/edit actions update the Memory Book collection.

The SVG is the local visual reference. All runtime imagery or icons required
by the implementation must be local project assets or existing project icon
resources—never remote Figma image URLs. A Figma design file was created for
the reference, but its canvas could not be populated because the Starter MCP
quota rejected the import; this does not alter the implementation source of
truth.

### Data and error handling

Feature UI never contains one-off data or route checks to accommodate a
screen. Data defaults belong in the feature service; UI consumes typed state
from the hook; validation errors come from the schema. Empty collections,
unknown item identifiers, and invalid form data have explicit user-facing
states rather than unsafe casts or fallback navigation.

## Testing and validation

Tests are renamed alongside Timeline and assert its `/timeline` ownership,
BottomNav behaviour, and existing create/edit/filter interactions. Memory
Book receives test-first coverage for route wiring, overview/detail
transitions, form validation, save, edit, delete, and the absence of BottomNav
on `/memory-book`.

Each new behaviour follows a red-green-refactor cycle. Final validation runs
the affected Jest suites, the complete test suite, TypeScript checking, and
linting. A repository-wide search confirms no `ROUTES.memories`, `/memories`,
or `features/memories` source references remain.

## Out of scope

- Adding Memory Book to BottomNav.
- Redirecting or retaining `/memories`.
- Reworking unrelated shared-architecture migration changes.
- Depending on a Figma-hosted asset at runtime.
