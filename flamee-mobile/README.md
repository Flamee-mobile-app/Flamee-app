# Flamee Mobile

Expo SDK 57 / React Native local app for iOS and Android, with web enabled as a
browser test target. Run `npx expo start` (or `npm start`), then press `w` in
the terminal to open the web app. Use `npx expo start --web` or `npm run web`
to start directly in the browser. Use the QR code to open the native app in Expo
Go.

The web target helps review screen layout and local flows. Device-specific
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
- Each feature owns its local service and in-memory records; there is no global demo runtime.
- Feature domain/service exports live in `index.ts`. Route-only screen composition may use a feature's `screens.ts` barrel when exporting screens from the service barrel would create a cross-feature import cycle.

## Screens and local domain flow

1. Run `npx expo start`; press `w` for the browser or open the QR code in Expo Go.
2. Splash opens the login screen automatically. The screen uses `login-bg.png`
   behind a compact rounded form with email/password, sign-up, Remember me, password
   recovery and Google. Email/password login and registration call the configured
   backend. Mock login and the phone local-session service have been removed.
   Recovery and Google are still unavailable.
3. First login opens quick profile directly, then asks about a partner and
   long-distance/nearby. There is no Terms/Privacy consent page in the current flow.
   Every setup step can be deferred to Home.
   Care preferences remain available in settings. Later sessions go Home even unpaired.
4. Create or enter a six-character invite. Optional messages can accompany mascot,
   photo or voice gifts. Invites expire after 72 hours and work only between accounts
   in the same running app process. The sender can enter Home while waiting. Incoming
   invitation intent survives Login/Register navigation; acceptance remains explicit.
   `flamee://connect/CODE` is native URL ingress; manual codes remain the fallback.
5. Name the current emotion, write a short note and optionally attach one Flamee
   mascot. When the local couple is connected, the partner sees the note preview
   and Flamee can offer a tone-based Smart Nudge without analyzing the note text.
6. Open Moment details to react/reply; use Profile for settings and account actions.

Home remains available without a partner. Pairing reminders can be hidden for 24 hours
or until sign-out. Successful local pairing shows each account a one-time popup with
the other person's message (the recipient can optionally reply with a wish).
Registration/login use server identities. Cross-device pairing, media upload and
deferred installation links still require their own backend integration.
No partner or couple membership is seeded from auth responses.

Domain records live in feature-owned memory and disappear on a cold restart.
Signing out ends the session while retaining records in the running process,
so another local account can accept an existing invite. There is no scenario
switcher or cross-device synchronization.

## Native data boundaries

Remembered native login stores its access token through Expo SecureStore and
validates it through `/auth/me` on restart. The backend has no refresh endpoint.
Unremembered login/registration and web keep sessions in memory. Local services keep emotion notes, stable mascot IDs, messages, media references and pending work in
process memory. There is no durable offline queue or server synchronization. The legacy SQLCipher-oriented
adapter is not imported because Expo Go provides regular SQLite, not SQLCipher.

Photo selection and camera capture use the native Expo picker when available. Voice
notes use Expo Audio recording and playback, with a 30-second limit. If native
media is unavailable, the UI offers text or signals; it does not create fake media
URIs. Notifications currently provide an on-device daily check-in reminder. Media
is not uploaded, export is a sanitized JSON preview, and support requests are not sent.

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
motion. Reaction buttons reuse `AppIconButton`; Bottom Navigation, FAB and Radial
Menu keep their specialized motion contract. Auth and all other forms use `AppField`;
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

Auth owns API requests, session validation and secure credential storage; the root
provider hydrates local onboarding with the actual server user name/avatar.
Feature records and setup progress remain process-local, independently of the
remembered server session. Sign-out removes the native credential. Local data
deletion does not delete the backend account.

Set `EXPO_PUBLIC_API_URL` for a configured backend. Phone login policy, deferred
deep-link provider, realtime transport, AI/privacy policy details, push
credentials, and native app identifiers require product/backend decisions.

## Coding rules

Read [AGENTS.md](../AGENTS.md), the [documentation index](../.doc/README.md),
[coding standards](../.doc/CODING-STANDARDS.md) and
[current baseline](../.doc/CODEBASE-BASELINE.md) before changing the app.
The local main-flow spec defines the current feature-owned service architecture.

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

Home uses one stateful signature hero for the full emotion-to-care loop. The new
composer uses a configurable emotion catalog or a custom label, a required trimmed
note of 1–100 characters, and one optional mascot selected by stable ID. There is no
fixed 1–5 mood picker or sharing-scope step in the new flow. Unpaired notes remain
personal and are never retroactively shared after pairing. Legacy records retain
their existing `full`/`mood_only`/`private_only` read filtering.

An actionable Smart Nudge replaces the hero content in place instead of creating a
second card. Its local template receives only structured emotion tone, never the
free-text note. Paired Home shows a note-only partner preview; pressing it resolves
the full record by check-in ID and displays the optional mascot locally. Home keeps
at most one recent Moment. The FAB radial menu opens Emotions, Suggestions,
Moments and Connection; text/photo/voice/signal are selected inside the Moment composer.
None/waiting Home keeps a compact connection reminder without fabricating couple content.

None/waiting/paired states, pairing reminder preferences and partner privacy
remain feature-owned. No partner, avatar, Moment, streak or Nudge is seeded.
Loading uses a layout skeleton; errors retain retry. A persistent session-only
status line expands to explain that data has not synced. Profile and settings
remain reachable. The content width is capped at 560 px and follows device text size.

Validation evidence for this revision is reported with the implementation result;
native paired/none/waiting interaction must not be inferred from typecheck or export.

## Main bottom navigation

The main route group uses a responsive floating pill navigation with four tabs:
Home, Activity, Tasks and Profile. Its SVG background uses the Flamee brand
gradient, a light glass overlay and a center notch sized from the current
viewport. A normal center-FAB press selects the dedicated Timeline & memories tab
without opening a composer. This tab is not repeated among the four outer tabs.
Holding for 350 ms opens Emotions (Home composer), Suggestions (Tasks), Moments
(Activity composer with all four formats), and Connection (none/waiting/paired status).
Unpaired Moment/Timeline views provide a clear Connection action. The layout uses a
compact 14–18 px bottom gap derived from the device safe area, a 60 px baseline
FAB and a 64 px baseline bar, and caps its width on tablets. Selected tabs stay fixed in
place and use icon stroke weight and opacity for emphasis. The FAB uses a thin
soft outline and the original semicircular center notch, with large rounded
pill ends. Touching the FAB lifts it by at most 3 scaled pixels over 80 ms and
settles it over 180 ms, with a subtle white highlight and no action delay.
Reduced Motion uses only the highlight. The radial menu uses a 190 ms ease-out position/fade transition
and a 160 ms closing transition, with opacity-only press feedback. Its 104 px
baseline radius keeps the actions anchored to the FAB; the four-action fan uses
a wider arc so full labels retain separation without increasing that distance. Its badges
use cream-peach backgrounds, dark coral text and light peach borders. The
component supports Reduced Motion and exposes selected/expanded states to
accessibility services. The Tasks tab lists only actionable local Smart Nudges;
it does not create placeholder tasks or fake data.

The custom bar is absolutely overlaid on tab scenes. Its transparent upper area
does not reserve layout space or intercept touches, so tab content is no longer
clipped behind a full-width blank band above the visible pill.

## Feature content surface

New feature screens use the shared `FeatureScreen` and `ContentSurface` components.
Only the page title sits outside a warm-white, rounded, elevated content surface;
there is no page subtitle or eyebrow. Controls, forms, loading/error/empty states
and content live within the surface. `featureTokens` owns its width, navigation
clearance and warm shadow. The revised emotion/Moment composers, Tasks, Connection
and Timeline use this convention.

The Profile tab is a grouped Menu with a title-only header. Each group has its
title outside a separate shared `SectionCard`, with no page-wide content card.
Menu cards use balanced 16 px horizontal/8 px vertical padding and centered
52 px rows with 16 px labels, with inset dividers between items.
Account, Connection, and Support & data retain all six settings destinations
through `AppMenuRow`; account lifecycle actions remain under Connection & account.
Inline Premium sample plans switch between illustrative monthly/yearly prices;
there is no checkout or premium entitlement. Also in Flamee offers four compact
quick actions as the same divided menu rows through the existing navigation hook.
Account includes a Dark mode placeholder row with no action or state; the app
continues to use the approved light theme. The menu does not wait
for profile or membership data to render its static navigation.

Timeline groups original Moments by the viewer's local date, newest first.
Memories shows the real connection date and successfully saved photo/voice Moments.
Replies remain in Moment detail. Data comes from the existing feature-owned local
services and disappears after a cold restart. Custom anniversary events, favorites,
relationship day counts and anniversary reminders are not implemented by this revision.

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
