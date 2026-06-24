# Flamee Mobile Component System Design

Date: 2026-06-24

## Goal

Build Flamee mobile as a maintainable Expo React Native project, not a throwaway Figma prototype. The implementation will convert only the Figma `Demo` section from the Flamee design file into production-oriented screens, components, theme tokens, and feature modules.

The first implementation milestone should produce a complete app structure, reusable component system, and all Demo screens wired through Expo Router with mock/local data. Backend integration remains outside this milestone, but the folders and contracts must make later API integration straightforward.

## Source Design Scope

Figma file: `Ke9lnLL4XvAeYJw0yb0yhb`

Figma section: `Demo`, node `5785:423`

Included Demo frames:

- `Chính`
- `Đăng nhập`
- `Đăng ký`
- `Trang chủ`
- `Profile`
- `Chat AI`
- `Dòng thời gian`
- `Sổ kỉ niệm`
- `Mood checkin`
- `Tiny mission`
- `Lịch hẹn hò`

Everything outside the `Demo` section is reference material only. It may inform tokens and naming, but implementation scope is limited to the 11 frames above.

## Current Project Context

The mobile app is an Expo Router project using:

- Expo SDK 54
- React Native 0.81
- TypeScript strict mode
- NativeWind
- Zustand
- TanStack Query and Axios already installed

The current Expo starter routes import missing `components`, `constants`, and `hooks` files. The implementation should replace the starter app shell with Flamee routes and project structure instead of trying to preserve the starter examples.

The local frontend standards require:

- Feature-based architecture by business domain
- Container/presentational component split
- API access through services only
- Feature hooks for reusable logic
- Zustand for global state
- React Query for future server data
- Local `useState` for screen-local UI state
- Strict TypeScript types for props, services, stores, and hooks

## Recommended Approach

Use a feature-first component system.

Create shared primitives and layout components first, then compose each Figma screen inside a feature module. Expo Router files stay thin and only render feature screens. Feature modules own their screen containers, presentational components, mock data, hooks, service contracts, schemas, store slices, and public exports.

This approach is slightly slower than copying Figma screen-by-screen, but it gives the project a real foundation for backend integration, future features, and UI consistency.

## Architecture

Target structure:

```txt
app/
  _layout.tsx
  index.tsx
  (auth)/
    login.tsx
    register.tsx
  (main)/
    _layout.tsx
    home.tsx
    timeline.tsx
    memories.tsx
    mood.tsx
    missions.tsx
    dates.tsx
    ai.tsx
    profile.tsx

components/
  layout/
    AppScreen.tsx
    ScreenHeader.tsx
  ui/
    AppText.tsx
    Button.tsx
    Card.tsx
    IconButton.tsx
    TextField.tsx
    PillTabs.tsx
    StatCard.tsx
    ListRow.tsx

constants/
  flameeTheme.ts

features/
  auth/
    index.ts
    types.ts
    components/
    screens/
    hooks/
    services/
    schemas/
    store/
  home/
  memories/
  mood/
  missions/
  dates/
  ai/
  profile/

lib/
  api/
    apiClient.ts
    queryClient.ts
  navigation/
    routes.ts

store/
  appStore.ts
```

Route files in `app/` should contain no business logic. They import and render screen containers from `features/*/screens`.

## Feature Boundaries

`auth`

- Owns login/register screens, auth forms, validation schemas, and auth store contract.
- Uses local mock submit handlers in the first milestone.
- Defines service functions now so backend wiring can replace internals later.

`home`

- Owns the long `Trang chủ` dashboard.
- Composes sections for anniversary summary, memories, mood, missions, date ideas, AI prompt, and bottom navigation.

`memories`

- Owns `Dòng thời gian` and `Sổ kỉ niệm`.
- Defines memory item types, category filters, timeline cards, and memory gallery cards.

`mood`

- Owns `Mood checkin`.
- Defines mood cards, partner mood state, notification prompt, and mood history chart placeholder.

`missions`

- Owns `Tiny mission`.
- Defines mission tabs, featured mission card, mission rows, and completion interaction state.

`dates`

- Owns `Lịch hẹn hò`.
- Defines weekly calendar strip, upcoming date card, and date idea rows.

`ai`

- Owns `Chat AI`.
- Defines AI suggestion cards and the message input shell.
- Uses local UI state only in the first milestone.

`profile`

- Owns `Profile`.
- Defines profile summary, stats, streak card, and profile menu rows.

## Shared Component System

Shared components should be presentational and receive all data through props.

Core primitives:

- `AppScreen`: safe-area-aware screen wrapper with background, scroll mode, and optional bottom inset.
- `AppText`: typed text variants mapped to Flamee typography tokens.
- `Button`: primary, secondary, ghost variants; loading and disabled props.
- `TextField`: label, secure text entry, keyboard type, value, error, and `onChangeText`.
- `Card`: reusable rounded surface with optional press behavior.
- `IconButton`: consistent circular/touchable icon surface.
- `PillTabs`: horizontal category selector for memories and missions.
- `ScreenHeader`: title, optional back action, optional trailing action.
- `ListRow`: profile/date/mission row base.
- `StatCard`: compact numeric summary card for profile.

Feature-specific components remain inside their feature unless at least two features need them.

## Theme Tokens

Create `constants/flameeTheme.ts` as the single source of truth for visual tokens.

Initial Figma-derived tokens:

- Brand: `#FF7158`
- Accent red: `#FF0000`
- Background: `#FFFFFF`
- Cream background: `#FFF1E4`
- Soft cream: `#FFE6CE`
- Text primary: `#000000`
- Text secondary: `#555555`
- Success: `#0FBB5D`

Typography should model Figma's usage of SF Pro and SF Pro Rounded, while using React Native font fallbacks unless custom fonts are added later:

- Display: 32, bold
- Heading: 28, bold
- Title: 24, bold
- Section title: 20, semibold/bold
- Body: 16, medium/regular
- Body small: 14, regular
- Caption: 12, regular
- Micro: 10, light/semibold

Spacing should use a predictable scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.

Radii should cover: 8, 12, 16, 20, 24, full.

## Assets

The Figma Demo includes image fills for backgrounds, illustrations, mood icons, chart image, mission image, food/date imagery, and small category thumbnails.

Implementation should create a clean asset path under `assets/flamee/`. If direct Figma asset export is available during implementation, use those exported images. If export is blocked or unsuitable, use local placeholder modules that preserve dimensions and layout while keeping asset references centralized.

Do not inline large bitmap data in components. Components should import named assets or receive asset references through data objects.

## Data And State

First milestone data is local and mock-based. Each feature should define typed fixture data near the feature, for example:

- `features/memories/services/memoryService.ts`
- `features/missions/services/missionService.ts`
- `features/dates/services/dateService.ts`

Service functions should return typed promises even when backed by local data. This keeps screen hooks compatible with future React Query integration.

State rules:

- `useState` for form fields, active tabs, selected filters, and local toggles.
- Zustand for app-level concerns such as theme preference and auth session placeholder.
- React Query is configured but only used when a screen consumes service data that behaves like server data.
- No direct API calls from components or screens.
- No state mutation; update arrays/objects through spreads or `.map()`.

## Routing

Initial route mapping:

- `/` redirects to onboarding/start screen `Chính`.
- `/(auth)/login` renders `Đăng nhập`.
- `/(auth)/register` renders `Đăng ký`.
- `/(main)/home` renders `Trang chủ`.
- `/(main)/timeline` renders `Dòng thời gian`.
- `/(main)/memories` renders `Sổ kỉ niệm`.
- `/(main)/mood` renders `Mood checkin`.
- `/(main)/missions` renders `Tiny mission`.
- `/(main)/dates` renders `Lịch hẹn hò`.
- `/(main)/ai` renders `Chat AI`.
- `/(main)/profile` renders `Profile`.

Navigation from buttons should be real Expo Router navigation, not dead UI. Bottom navigation can be a custom Figma-matched component if default tabs cannot match the design cleanly.

## Error, Loading, And Empty States

Even with mock data, reusable patterns should exist:

- `LoadingState` for async service loads.
- `EmptyState` for features with no list data.
- `ErrorState` with retry action.
- App-level `ErrorBoundary` around route content where practical.

Screens should use the 4-state pattern when they load data through hooks: loading, error, empty, success.

## Testing And Verification

Implementation verification should include:

- `npx tsc --noEmit`
- `npm run lint`
- Start Expo web or native-compatible preview if feasible.
- Visual smoke check of primary routes after implementation.

Because this is a UI-heavy feature, passing typecheck/lint is not enough. The implemented screens should be inspected for clipping, overflow, and broken navigation on at least a 402px-wide mobile viewport.

## Non-Goals

- No backend integration in this milestone.
- No real authentication persistence beyond placeholder session state.
- No push notification implementation.
- No camera/gallery permission flow.
- No AI API integration.
- No animation polish beyond simple press states.
- No screens outside Figma `Demo`.

## Open Implementation Notes

- Before writing Expo-specific code, read the versioned Expo SDK 54 documentation as requested by `skills/AGENTS.md`.
- The deleted local file `flamee-mobile/skills/feature-based-architecture/SKILL.md` is outside this design change and should not be restored or modified without user instruction.
- The implementation plan should split work into theme/setup, shared components, feature skeletons, screen assembly, navigation wiring, asset handling, and verification.
