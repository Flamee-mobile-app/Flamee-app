# Flamee Mobile

Expo SDK 57 / React Native local-demo app for iOS and Android. Start it in Expo
Go with `npm start`; the script intentionally uses `expo start --go`.

## Structure

- `app/` contains thin Expo Router route adapters and provider composition.
- `app/providers/` contains the in-memory TanStack Query provider and transient Zustand session state.
- `src/lib/api/` contains the shared API client and error mapping; `src/shared/` contains app-wide components, constants, localization, and native adapters.
- `tamagui.config.ts` is the shared Tamagui theme, token, font, and animation configuration.
- `src/features/` contains auth/onboarding, invites, check-ins, partner status,
  Smart Nudge, Tiny Moments, profile/settings and account lifecycle UI.
- `src/demo/` contains the in-memory mock service, reducer, seeds and scenario catalog.

## Local demo walkthrough

1. Run `npm start`, then open the QR code in Expo Go.
2. Choose Apple/Google mock login, or phone login with OTP `240624`.
3. Complete consent, profile, care preferences and relation type.
4. Create an invite, optionally attach a gift, then simulate partner acceptance.
5. Complete a check-in and enter Home. Use **Cá nhân → Kịch bản demo** to load a
   partner check-in and every Nudge/Moment/error/permission/export preset.
6. Walk the core loop: partner status → Smart Nudge → **Làm ngay** → send a
   Tiny Moment → open detail → react or reply.

Scenario switching replaces the complete in-memory runtime. **Đặt lại bản demo**
returns to signed-out Welcome. Reloading the app also discards demo data.

## Native data boundaries

Refresh credentials are stored through Expo SecureStore when real authentication is
wired. This demo does not persist mock mood, messages, media or queues. Offline work
is an in-memory simulation and disappears on reload. The legacy SQLCipher-oriented
adapter is not imported because Expo Go provides regular SQLite, not SQLCipher.

Photo selection and camera capture use the native Expo picker when available. Voice
notes use Expo Audio recording and playback in Expo Go, with a clearly labelled timed
`demo://` fallback only when native recording is unavailable; the app does not claim
that fallback is a durable recording. Notification delivery,
media upload, JSON export and support submission are simulated locally.

## Design assets

The global Tamagui theme mirrors `.doc/QUY_CHUAN_GIAO_DIEN.md`.
The referenced SF Pro Rounded and SF Pro font binaries are not present in the
repository, so this foundation uses the platform system font fallback. No local
font import is configured. Add the approved font assets before claiming the
brand fonts are packaged.

## Configuration still owned by product/backend

Set `EXPO_PUBLIC_API_URL` for a configured backend. Phone login policy, deferred
deep-link provider, realtime transport, AI/privacy policy details, push
credentials, and native app identifiers require product/backend decisions.
