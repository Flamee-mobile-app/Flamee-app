# Issue 2 — Fake Authentication, Protected Routes, and Floating Bottom Navigation Design

**Date:** 2026-07-22  
**Status:** Approved design; awaiting review of this written specification.

## Goal

Make Flamee behave as one protected mobile application: a locally persisted fake session decides whether the user enters auth or the main app, main routes cannot expose auth history through back navigation, and the existing Flamee bottom navigation becomes a functional floating app-shell control with route-driven active state.

## Scope

This design covers the user-approved Issue 2 requirements only:

- Fake login/register accepts any form values that pass the current Zod validation.
- Session data persists across app re-entry but contains no password.
- Auth and main route groups redirect according to hydrated session state.
- Profile exposes logout, which clears the session and returns to authentication.
- The existing four-item Flamee bottom nav remains visually recognisable and functions from actual route state.

It does not redesign the Home content (Issue 3), replace fake auth with a backend, add social authentication, or rework individual primary screens.

## Architecture

### Session persistence boundary

Add `@react-native-async-storage/async-storage` and isolate it behind an auth persistence module. The module stores a serialised `AuthSession` at one namespaced key and exports three async operations:

```ts
export function readPersistedSession(): Promise<AuthSession | null>;
export function persistSession(session: AuthSession): Promise<void>;
export function removePersistedSession(): Promise<void>;
```

`AuthSession` remains the existing public session shape (`userId`, `displayName`, `email`). Passwords are never persisted. Missing storage, invalid JSON, or an object without the required string fields resolves to `null`; invalid data is removed so a future app entry starts cleanly.

### Auth state and hydration

Extend the existing Zustand auth store with an explicit hydration state:

```ts
type AuthStatus = 'hydrating' | 'authenticated' | 'unauthenticated';

type AuthState = {
  session: AuthSession | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  clearSession: () => Promise<void>;
};
```

The root layout calls `hydrate()` exactly once after fonts are available and keeps the existing native splash visible while `status === 'hydrating'`. Once hydration resolves, it mounts the root stack and an auth gate performs any required replacement. This prevents a transient Login or Home screen from appearing before the stored session is known without creating a navigation-mount race.

`setSession` writes storage first and then exposes the authenticated state. If the write fails, it rejects and leaves the store unauthenticated, so the form remains on the auth route and can show its existing submission-error state. `clearSession` removes storage first and then exposes the unauthenticated state. If removal fails, it rejects, leaves the current authenticated state intact and does not redirect, preventing a stale persisted session from silently returning on the next app entry. Hydration failures resolve to unauthenticated; there is no backend-error UI in this phase.

### Route protection and history isolation

Create a focused root-level auth navigation gate using Expo Router’s segments/pathname and `router.replace`:

| Hydrated status | Current group | Destination |
| --- | --- | --- |
| `authenticated` | `(auth)` or `/` | `ROUTES.home` via `replace` |
| `unauthenticated` | `(main)` | `ROUTES.login` via `replace` |
| `unauthenticated` | `/` | Preserve the existing Start screen as the first auth entry |
| `authenticated` | `(main)` | Leave the current main route in place |

The root gate is the source of truth. The `(auth)` and `(main)` layouts additionally render a lightweight guard so deep links and layout-level route changes cannot briefly expose an inappropriate group. Redirection never uses `push`.

This complements Issue 1’s Android `BackHandler` guard on persistent main screens. Once login succeeds or a session restores, `replace` removes prior auth routes from history; persistent main screens also consume Android system back, while detail pages retain normal back behavior.

### Login, register, and logout flows

- Existing login and register forms retain their schemas and visual UI.
- Any valid form submission calls the existing fake auth service, then awaits `setSession(session)` before navigating to Home with `replace`.
- Login’s “remember” checkbox does not change persistence in this phase: a successful fake session is always persisted, as required by the approved simple-login choice. The checkbox’s existing visual state remains unchanged.
- Register behaves exactly like login after validation; it does not create stored credentials because all valid credentials are accepted in this fake-auth phase.
- Add an accessible `Đăng xuất` row/button at the end of Profile’s existing menu. It awaits `clearSession()` and replaces the route with `ROUTES.login`. It must use the same Flamee visual language as existing Profile rows and must not redesign the screen.

## Floating bottom navigation

### Visual constraints

The existing custom bottom navigation is preserved rather than replaced by a generic tab bar:

- Warm orange gradient floating bar, curved center cut-out, central Flamee flame badge, generated icons, four labels, height, spacing and responsive visual geometry remain intact.
- It stays absolutely attached to the bottom of the `(main)` shell and preserves the existing visibility behavior on Home, Activities/Timeline, Mood, Missions, Profile, Dates and Memory Book. This retains the approved Dating Schedule composition, which includes the floating nav.
- AI remains the existing exception where the nav is not shown. Dates, Mood and Memory Book do not become extra tabs; they simply retain the shell-level nav already present in the current visual flow.
- Bottom content continues to use the existing BottomNav layout frame so mascot positioning remains correct.

### Interaction and state

Each tab is a real accessible `tab` press target. Its active state is derived from the current `pathname`, never a hard-coded Home state:

| Tab | Route | Active condition |
| --- | --- | --- |
| `Trang chủ` | `/home` | pathname is `/home` |
| `Hoạt động` | `/timeline` | pathname is `/timeline` |
| `Nhiệm vụ` | `/missions` | pathname is `/missions` |
| `Hồ sơ` | `/profile` | pathname is `/profile` |

Tab presses use `router.replace(item.href)` so tab hopping does not build a stack of static Figma-like frames. The selected tab uses full white opacity and the existing semibold/bold label treatment; every unselected tab uses the same white icons/labels at 0.62 opacity with the current regular label weight. This preserves legibility and the Flamee palette while making the active state unambiguous. `accessibilityState.selected` matches the same route-derived value.

The center Flamee badge remains decorative in this scope; it is not an extra fifth route.

## Component boundaries

| Unit | Responsibility |
| --- | --- |
| `features/auth/services/authSessionStorage.ts` | AsyncStorage read/write/remove and session validation only |
| `features/auth/store/authStore.ts` | Hydrated in-memory session state and persistence orchestration |
| `features/auth/components/AuthGate.tsx` | Route-group decision after hydration; `replace` navigation only |
| `app/_layout.tsx` | Starts hydration, retains splash until ready, then mounts the root gate around the stack |
| `app/(auth)/_layout.tsx`, `app/(main)/_layout.tsx` | Group-level guards for deep links and direct route changes |
| `features/auth/hooks/useAuthForm.ts` | Awaits persisted session before calling existing success navigation |
| `features/profile/screens/ProfileScreen.tsx` | Renders the scoped logout action |
| `shared/components/ui/BottomNav.tsx` | Route-derived active/inactive rendering and tab navigation while retaining its custom visual structure |

## Error handling and edge cases

- Reopening the app with a valid persisted session enters Home without exposing auth UI.
- Reopening with no session enters auth; direct attempts to open a main route redirect to Login.
- Persisted malformed or stale JSON is deleted and treated as no session.
- Repeated hydration calls are deduplicated while the first call is in flight.
- Tapping the already-active tab is safe and does not create history.
- Logout clears the in-memory and persisted session before auth redirection; Android back cannot restore the former authenticated route.

## Test strategy

1. Unit-test storage serialisation, malformed-value cleanup and no-password persistence.
2. Unit-test Zustand hydration, persistence and clear-state transitions using mocked AsyncStorage.
3. Render-test root/group auth gates for hydrating, authenticated and unauthenticated route decisions; assert `replace`, never `push`.
4. Test login/register wait for `setSession` before success navigation, and Profile logout calls `clearSession` before replacing to Login.
5. Extend BottomNav tests for exact route-driven selected/unselected state and tab `replace` behavior while retaining the four existing visible controls and measured geometry.
6. Run the complete Jest suite, Expo lint, configured TypeScript check, and manual Android acceptance flow with a connected emulator/device.

## Acceptance criteria

- Any schema-valid login or registration produces a persisted fake session without persisting a password.
- Session hydration sends authenticated users to the protected main app and unauthenticated users to auth.
- Auth and main route groups cannot expose each other by deep link, back history, or tab interaction.
- Logout removes the session and returns to Login.
- The floating custom Flamee nav is present on primary screens, uses actual current route state for active/inactive appearance, and never uses a hard-coded active Home icon.
- Issue 1 main-screen Android back guard remains in place; detail-page back navigation remains normal.
- Existing Flamee bottom-nav identity, four labels and central decorative badge remain visually intact.
