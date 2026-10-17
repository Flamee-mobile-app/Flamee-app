# Flamee Mobile

Expo SDK 57 / React Native app for iOS and Android, with web enabled as a
browser test target. Run `npx expo start` (or `npm start`), then press `w` in
the terminal to open the web app. Use `npx expo start --web` or `npm run web`
to start directly in the browser. Use the QR code to open the native app in Expo
Go.

The web target helps review screen layout. Device-specific
features such as media capture and notifications may be unavailable or behave
differently in a browser; verify those on iOS or Android. The startup splash
uses a browser-compatible artwork renderer while native keeps the SVG animation.

## Structure

- `app/` contains thin Expo Router route adapters and provider composition.
- `src/providers/` contains the root Tamagui, TanStack Query, session bootstrap and startup providers.
- `src/shared/state/sessionStore.ts` contains transient Zustand session metadata.
- `src/shared/navigation/entryRoute.ts` resolves the initial route; startup lifecycle logic belongs to `src/features/startup/`.
- Every module in `app/` is a route/layout with a default React component export. Keep providers, stores and helpers outside this directory.
- `src/lib/api/` contains the shared API client and error mapping; `src/shared/` contains app-wide components, constants, localization, and native adapters.
- `tamagui.config.ts` is the shared Tamagui theme, token, font, and animation configuration.
- `src/features/` contains auth/onboarding, invites, check-ins, partner status,
  Smart Nudge, Tiny Moments, profile/settings and account lifecycle UI.
- Features use server APIs where integrated. Runtime in-memory business simulators have been removed; unsupported capabilities are explicitly unavailable.
- Feature domain/service exports live in `index.ts`. Route-only screen composition may use a feature's `screens.ts` barrel when exporting screens from the service barrel would create a cross-feature import cycle.

## Implemented runtime (2026-10-17)

- Email/password login and registration call the configured backend. Remembered native credentials use SecureStore and are validated by `/auth/me` on restart. Web/unremembered sessions stay in memory. Google and password recovery are unavailable; backend recovery now returns 501 without issuing an OTP.
- After authentication, server `couple_id` decides Home versus the invite screen. Users can skip invites without manufacturing setup completion. Old onboarding links forward to the real invite flow.
- Invite create/current/preview/revoke/accept use the server. Codes can be copied or shared through the actual OS APIs; no local gift, local membership or simulated acceptance remains.
- Profile editing reads `/auth/me` and writes `PUT /auth/me` with `full_name` and the user's own `username`. Save feedback requires a validated response belonging to the same account. The pending username migration must be applied separately before using the new backend write contract; it has NOT been run by the agent.
- Home and Connection refresh server identity/couple status. A failed read shows an error; it never falls back to an unpaired local membership or an empty server feed.
- Timeline, Moment compose/detail/reply/reaction/delete, check-ins, Nudges/Tasks, care/notification settings, export, support submission, unpairing and account deletion are unavailable in the app until their API integrations are ready. No local success or generated domain records are supplied. Backend unpair exists but has not been connected here.
- Logout clears actual credentials, session metadata, invite intent and the query cache. It does not claim to delete a backend account.
- Native image/audio/notification adapters and pure presentation/validation components remain as real device utilities, outside active unsupported flows. `/design-system` remains an isolated component review catalog; its interactive examples are not account data.

See [cleanup and backend-first plan](../.doc/BACKEND-FIRST-CLEANUP.md) for removed modules, known backend blockers and acceptance criteria. Unit-test doubles are retained; they do not demonstrate a live Storage upload or cross-device behavior.

## Design assets

Typography and palette follow `.doc/QUY_CHUAN_GIAO_DIEN.md`. The app uses an ivory
`#F8F5F1` canvas, warm-white `#FFFCF8` surfaces, warm charcoal/taupe text and the
original brand coral `#FF7158` for primary actions. Brand coral/peach remain on the
navigation gradient. Apricot highlights check-in; sage highlights care suggestions.
All values live in shared tokens and are exposed by the Tamagui theme.
Ordinary actions use the shared semantic button system: `AppButton`,
`AppFilterChip`, `AppIconButton`, or `AppTextButton`. Their 48 px touch targets,
warm depth, focus/disabled/loading states and 80/140 ms press/release feedback are owned by
shared tokens; feature callers cannot override color, radius, border, shadow or
motion. Reaction buttons reuse `AppIconButton`; Bottom Navigation keeps its
specialized selection motion, and FAB uses ordinary press/release feedback.
Auth and all other forms use `AppField`;
cards, dialogs and sheets use `SectionCard`, `AppDialog` and `AppSheet`. Image choices
use `AppChoiceTile`, with the same borderless material and selection feedback as filters.
Tamagui keeps its platform-aware default animation driver so web uses CSS
transitions and native uses the React Native timing driver; button transitions
override the shared timing preset to 80 ms on contact and 140 ms on release.
The body and heading font scales include `$true` and `$control` aliases to the
button typography (16/24), because Tamagui Button looks up font size from its
control size even when `fontSize` is supplied.
The referenced SF Pro Rounded and SF Pro font binaries are not present in the
repository, so this foundation uses the platform system font fallback. No local
font import is configured. Add the approved font assets before claiming the
brand fonts are packaged.

## Configuration still owned by product/backend

### Backend login and registration

Follow [the local setup guide](../.doc/MOBILE-AUTH-LOCAL-SETUP.md) to run FastAPI,
prepare a development Supabase database, and set `EXPO_PUBLIC_API_URL` with the
`/api/v1` suffix. On a real phone, use the computer's LAN address and restart Metro
after editing `.env.local`. No mock-login switch or local credential bypass remains.

If login in Expo Go waits and then reports a connection timeout, compare the
host in `.env.local` with the computer's current Wi-Fi IPv4 address (`ipconfig`).
The LAN address can change when switching networks. Keep `/api/v1` in the API
URL, restart Metro after correcting it, and reload the project in Expo Go.
On the phone, `http://<current-computer-LAN-IP>:8000/health` should return
`{"status":"ok","version":"0.1.0"}` while both devices are on the same network.
This health check verifies backend reachability; it does not verify database
access or successful authentication.

Auth owns API requests, session validation, profile acknowledgement and secure credentials. Bootstrap no longer creates a local onboarding account or separate profile. There is no durable offline business queue or fallback persistence.

Set `EXPO_PUBLIC_API_URL` for a configured backend. Phone login policy, deferred
deep-link provider, realtime transport, AI/privacy policy details, push
credentials, and native app identifiers require product/backend decisions.

## Coding rules

Read [AGENTS.md](../AGENTS.md), the [documentation index](../.doc/README.md),
[coding standards](../.doc/CODING-STANDARDS.md) and
[current baseline](../.doc/CODEBASE-BASELINE.md) before changing the app.
The latest cleanup decision is recorded in `.doc/BACKEND-FIRST-CLEANUP.md`. The three mandatory index/standards/baseline files referenced above are currently absent; they have not been fabricated.

## Splash and login motion

The brand timeline plays over 2450 ms while the destination route loads behind
the overlay. Its non-overlapping phases run in a fixed order: two bright embers
meet, the outline heart finishes drawing and holds briefly, the Flamee symbol
appears, then the wordmark and tagline reveal on a layered warm-dark background. Brand
assets stay hidden at mount so preloading cannot reveal them before their phase.
The splash has no secondary filled-heart or expanding-ring phase: the completed
outline heart holds for 180 timeline ms, then the symbol reveal starts directly.
The completed brand holds for about 360 ms.
A 650 ms branded handoff then lifts and recedes
the splash artwork while the login hero crossfades
underneath. Login components begin their opacity-only reveal 350 ms into that handoff, with adjustable timing and a
maximum 640 ms reveal window. Register and subsequent visits display immediately.
Reduced Motion shows content immediately after readiness.
There is no exploration button or connecting-two-hearts subtitle on splash.
Splash has a warm dark background (#24110F) with a restrained coral glow. The
native splash is intentionally image-free and uses the same color so the brand
does not flash before the ember sequence. Startup keeps that native surface in
place until the custom splash has laid out and its brand/login assets are loaded,
then starts the ember sequence after `hideAsync` completes. Rebuild the native
app to apply the native splash config change.
See [login and transition details](../.doc/LOGIN-SPLASH-TRANSITION.md).

## Home screen

Home retains the approved warm header and emotion hero. Name/avatar and couple status come from authenticated server responses. The hero explains that check-in is unavailable; no local note, template Nudge, invented partner or recent Moment is inserted. FAB intents to unavailable features show the corresponding unavailable screen.

The pill navigation shows centered icons without visible text labels. Official
Ionicons outline/filled pairs scale from a 30 px baseline; inactive icons are white
outlines and selected icons use the original filled glyph in warm white. SVGs are
bundled locally in shared with their source revision and MIT license; no runtime
font loading or icon download is required. Localized labels remain available to
screen readers. Tabs and FAB use unstyled `Tamagui.Button` controls with targets
of at least 48 px.
Active SVG shapes receive explicit warm-white fills rather than relying on
inherited paint. Inactive strokes also receive explicit white values.
An inset, rounded peach-orange background marks the selected tab and
slides for 240 ms; icon emphasis fades for 160 ms.
The indicator follows the actual selected route and is clipped to the pill around
the center notch. Timeline selection fades the tab indicator out and retains the
FAB's static active ring. Reduced Motion switches selection immediately.
The FAB depresses 3 px on contact (80 ms) and returns on release (140 ms), with
a shallower shadow while pressed. Its radial menu and hold-progress ring are
temporarily removed; a hold has no separate action. Profile quick actions remain.
These changes require device/browser visual verification; layout unit tests and
typechecking alone do not verify animation rendering.

## Feature content surface

New feature screens use the shared `FeatureScreen` and `ContentSurface` components.
Only the page title sits outside a warm-white, rounded, elevated content surface;
there is no page subtitle or eyebrow. Controls, forms, loading/error/empty states
and content live within the surface. `featureTokens` owns its width, navigation
clearance and warm shadow. Connection and unavailable feature screens use this convention.

The Profile tab is a grouped Menu with a title-only header. Each group has its
title outside a separate shared `SectionCard`, with no page-wide content card.
Menu cards use balanced 16 px horizontal/8 px vertical padding and centered
52 px rows with 16 px labels, with inset dividers between items.
Account, Connection, and Support & data retain all six settings destinations
through `AppMenuRow`; account lifecycle actions remain under Connection & account.
Mock Premium plans and their prices/benefits have been removed. Also in Flamee offers four compact
quick actions as the same divided menu rows through the existing navigation hook.
Account includes a Dark mode placeholder row with no action or state; the app
continues to use the approved light theme. The menu does not wait
for profile or membership data to render its static navigation.

Timeline and Moment routes currently show an unavailable state instead of loading session-only records. They must not be enabled by mapping the legacy memory API to a different Moment contract without backend work.

## Startup diagnostics

Import icons through the public `@tamagui/lucide-icons-2/icons/<Name>` entrypoints
to keep unused icons out of the development graph. Use `role` and `aria-*` on
Tamagui components; the installed native renderer maps these to native
accessibility props. Auth service exports are separate from `auth/screens.ts`.

After changes to platform-specific source files, stop Metro and restart with
`npm run web`. Clear its cache only when stale resolution is observed; routine
cache clearing makes the next bundle cold. Bundle times in Metro logs do not
include the intentional splash animation or device rendering.

The Sign up link opens a registration form with full name, email, password and
confirmation. It validates entries and submits them to the backend; successful
registration opens the returned session. Auth uses a bottom-aligned panel with safe-area padding inside it. The hero
shows login-bg.png with an explicit left-biased crop to retain the house and moon,
and the transparent Flamee logo 16 px from the left and 8 px below the top safe area.
