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
   recovery and Google. During development, the Sign in button opens a temporary
   mock session without requiring credentials (see below). Real email/password,
   registration, recovery and Google authentication are pending integration.
   The existing phone local-session service remains unchanged and is no longer
   called by this screen.
3. First login opens quick profile with explicit consent before saving, then asks
   about a partner and long-distance/nearby. Every setup step can be deferred to Home.
   Care preferences remain available in settings. Later sessions go Home even unpaired.
4. Create or enter a six-character invite. Optional messages can accompany mascot,
   photo or voice gifts. Invites expire after 72 hours and work only between accounts
   in the same running app process. The sender can enter Home while waiting. Incoming
   invitation intent survives Login/Register navigation; acceptance remains explicit.
   `flamee://connect/CODE` is native URL ingress; manual codes remain the fallback.
5. Complete a check-in, choose its sharing scope, then explore partner status,
   template Smart Nudges and Tiny Moments when the local couple is connected.
6. Open Moment details to react/reply; use Profile for settings and account actions.

Home remains available without a partner. Pairing reminders can be hidden for 24 hours
or until sign-out. Successful local pairing shows each account a one-time popup with
the other person's message (the recipient can optionally reply with a wish).
The current mock button reuses one account in a process; it cannot accept its own invite.
Real registration, cross-device pairing, media upload and deferred installation links
still require backend/auth integration. No verified account or partner is seeded.

Domain records live in feature-owned memory and disappear on a cold restart.
Signing out ends the session while retaining records in the running process,
so another local account can accept an existing invite. There is no scenario
switcher or cross-device synchronization.

## Native data boundaries

Refresh credentials are stored through Expo SecureStore when real authentication is
wired. Local services keep mood, messages, media references and pending work in
process memory. There is no durable offline queue or server synchronization. The legacy SQLCipher-oriented
adapter is not imported because Expo Go provides regular SQLite, not SQLCipher.

Photo selection and camera capture use the native Expo picker when available. Voice
notes use Expo Audio recording and playback, with a 30-second limit. If native
media is unavailable, the UI offers text or signals; it does not create fake media
URIs. Notifications currently provide an on-device daily check-in reminder. Media
is not uploaded, export is a sanitized JSON preview, and support requests are not sent.

## Design assets

Typography follows `.doc/QUY_CHUAN_GIAO_DIEN.md`. The current app background is
`#FFF4EC`; the guide still lists `#FAF9F7`, a documented design discrepancy.
The body and heading font scales include `$true` and `$control` aliases to the
button typography (16/24), because Tamagui Button looks up font size from its
control size even when `fontSize` is supplied.
The referenced SF Pro Rounded and SF Pro font binaries are not present in the
repository, so this foundation uses the platform system font fallback. No local
font import is configured. Add the approved font assets before claiming the
brand fonts are packaged.

## Configuration still owned by product/backend

### Temporary mock login for development

Mock login is enabled by default only when `__DEV__` is true. On the login screen,
press Sign in with the fields empty. This creates an in-memory local account and
opens the existing entry resolver: a new account proceeds to onboarding.
No email/password is used, no network request is made and no identity is verified.
Sign-out retains that mock account's local progress during the process; signing in
again reuses it. Deleting the account clears that identity. A cold restart starts clean.

Set `EXPO_PUBLIC_MOCK_LOGIN=false` and reload to disable it. Release builds always
disable mock login, regardless of that environment variable. This is temporary
development access requested by the user, implemented in the auth feature; it
does not seed consent, profile, pairing, check-ins or media.

Set `EXPO_PUBLIC_API_URL` for a configured backend. Phone login policy, deferred
deep-link provider, realtime transport, AI/privacy policy details, push
credentials, and native app identifiers require product/backend decisions.

## Coding rules

Read [AGENTS.md](../AGENTS.md), the [documentation index](../.doc/README.md),
[coding standards](../.doc/CODING-STANDARDS.md) and
[current baseline](../.doc/CODEBASE-BASELINE.md) before changing the app.
The local main-flow spec defines the current feature-owned service architecture.

## Splash and login motion

The brand timeline plays over 1600 ms while the destination route loads behind
the overlay. Splash fades out over 640 ms. Login components use opacity-only
fades on the first reveal in a process, with adjustable timing and a maximum
640 ms reveal window. Register and subsequent visits display immediately. Reduced Motion shows content immediately after readiness.
There is no exploration button or connecting-two-hearts subtitle on splash.
Splash has a flat pale paper background (#FFF4EC) to emphasize the logo. The native splash color in
app.json matches it; rebuild the native app to apply that config change.
See [login and transition details](../.doc/LOGIN-SPLASH-TRANSITION.md).

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
confirmation. It validates entries and offers a return to login; account creation
still requires backend integration. Auth uses a bottom-aligned panel with safe-area padding inside it. The hero
shows login-bg.png with an explicit left-biased crop to retain the house and moon,
and the transparent Flamee logo 16 px from the left and 8 px below the top safe area.
