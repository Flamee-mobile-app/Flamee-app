---
name: frontend-development-standards
description: "Use when designing or implementing the Flamee React Native mobile client. Sets feature boundaries, navigation, state, native capability, privacy, and user-interface rules for Expo and Tamagui."
---

# Flamee Mobile Frontend Architecture

The product source of truth is `.doc/Tài liệu yêu cầu sản phẩm_ App kết nối cho cặp đôi.md` (requirements below) and `.doc/Các luồng chính của app (bản đầu).md` (flows below). Use `.doc/FLAMEE-MOBILE-ARCHITECTURE.md` for the concrete rebuild plan. Do not infer product behavior from the old web frontend or an existing implementation.

## 1. Runtime and library choices

- **React Native + Expo, TypeScript:** one iOS/Android client and Expo's native module/config-plugin path. Keep native-specific code behind adapters. Use Expo development builds for native modules that are not available in Expo Go; do not constrain product architecture to Expo Go.
- **Expo Router:** file-based routes, typed route parameters, native deep-link integration, nested stacks and tabs. It sits on React Navigation and supports app navigation without browser routes, HTML forms, DOM, or URL redirects. Use it for internal invite links, but defer post-install invite recovery to a selected deferred-deep-link provider.
- **Tamagui v2:** typed React Native UI components backed by one shared configuration. `tamagui.config.ts` defines semantic colors, spacing, radii, type scale, themes, and animations. Import the config only through the root provider; feature code consumes typed `$tokens`, Tamagui components, `useTheme`, or `getTokenValue` when a native API needs a raw value.
- **Lucide icons for Tamagui v2:** import icons from `@tamagui/lucide-icons-2`. Keep icon size and color on theme tokens, and pair state icons with accessible text when meaning matters.
- **TanStack Query:** remote API cache, request lifecycle, invalidation, and mutation status. Keep private server data in memory by default; the offline check-in outbox is a distinct durable queue with explicit encryption and acknowledgement.
- **Zustand:** small app-wide coordination state only (session bootstrap flags, active account/couple identifiers, transient navigation intent). It is simpler than adding a global Redux layer for the product's limited cross-screen state. Do not persist sensitive profile, check-in, or message contents in it.
- **React Hook Form + Zod:** typed form lifecycle and shared runtime validation. RHF limits rerenders in onboarding/profile forms; Zod validates user input and decoded API payloads at boundaries. Keep validation out of Effects.
- **Expo SecureStore:** refresh/access credentials and small secrets in Keychain/Android Keystore-backed storage. Never store auth tokens in AsyncStorage or logs.
- **Expo SQLite with SQLCipher enabled in native builds:** durable check-in outbox and upload metadata, supporting offline capture, deduplication, and retry. Sensitive note payloads must be encrypted at rest; do not ship plaintext durable queue storage. Delete acknowledged rows and temporary media promptly. Confirm SQLCipher/config-plugin availability for the chosen Expo SDK during project setup.
- **Expo Notifications + TaskManager (optional, best-effort):** native permission and notification presentation/response. Local scheduling is suitable for the user's daily check-in reminder; server-owned events and timing remain authoritative. Background task execution is opportunistic and must never be required for queue delivery or correctness.
- **Expo ImagePicker / ImageManipulator / Audio (SDK-compatible modules):** native photo selection/capture, image reduction, and bounded voice recording. Isolate them behind `media` adapters because permissions, codecs, and native APIs differ by platform. Select the SDK-compatible audio module at bootstrap.
- **React Native `fetch`, `WebSocket`, and `Share`:** built-in mobile APIs for REST, real-time updates, and the OS share sheet. Use a small typed `apiClient` rather than Axios/browser assumptions; add a dedicated upload transport for signed media URLs. Do not introduce a browser-only library.

Pin mutually compatible package versions when implementation starts. Native module configuration, app identifiers, push credentials, and entitlements belong in Expo config and build profiles, not in feature screens.

## 2. Architecture and dependency rules

Organize by business feature. Route files compose feature screens; they do not own business logic or API calls. A feature owns its screen, UI pieces, hooks, schema, service, types, and feature-specific mapping. Shared modules contain only genuinely cross-feature code.

Use `src/features/<feature>/` as the boundary for all feature-owned code. Put screen-level views in `pages/`, reusable feature UI in `components/`, and feature hooks in `hooks/`; create these subfolders only when they contain real modules. Keep the feature's `index.ts` as its public API. Keep focused domain modules such as `local*Service.ts`, `schemas.ts`, `types.ts`, or a state module at the feature root, using descriptive names and adding a store only when that feature genuinely owns one. Do not create empty category folders or placeholder store files.

- Direction: `app -> features -> shared`; shared code never imports a feature.
- Features communicate through typed public exports, route parameters, or explicit application events; do not reach into another feature's private files.
- Components render props and user state. Hooks coordinate UI and services. Services own network operations and DTO/domain mapping. Native adapters own OS APIs.
- Avoid generic container/presentational duplication. Split a screen when it clarifies composition or reuse; do not add a wrapper for every component.
- Keep effects for external synchronization (network subscriptions, app state, OS APIs). Derive values during render and handle user actions in event handlers.
- Add a root React error boundary with a recoverable native fallback. Log only scrubbed error metadata; never log sensitive content or tokens.

## 3. Navigation and access

Use typed Expo Router route groups for `(auth)`, `(onboarding)`, `(invite)`, `(waiting)`, and `(main)`, plus stack screens for composers, settings, and detail views. The `(main)` area has Home, Moments, and Profile/Settings entry points. Navigation represents product flow:

1. Bootstrap secure session and load account/couple status.
2. Route to introduction/authentication, consent, profile/preferences, invite creation/acceptance, waiting, or paired home according to server state.
3. An authenticated account may belong to at most one active couple. Enforce this on the server and present a clear in-app explanation on failure; client guards only improve navigation and are not authorization.
4. Invite URLs parse a token into a typed invite intent, preserve it through sign-in, fetch its status, then show confirmation before accept. Support manual six-character code entry. A failed/expired/revoked invite has a product message and recovery path.
5. Notification taps map allowlisted payloads to typed internal destinations (Nudge detail or a specific Moment); never navigate from arbitrary URL paths or trust sensitive payload text.
6. On unpair/account deletion, immediately clear couple-scoped query data, subscriptions, queued work that is no longer authorized, and navigation history; then route to the resulting account state.

Use native stack/tab patterns, safe areas, Android back behavior, and iOS swipe-back. There is no web route guard, browser history redirect, or DOM-based link handling.

## 4. Design tokens and native UI

### Configuration contract

- `src/shared/constants/tokens.ts` owns the approved raw brand values so Tamagui and native-only APIs read the same palette and typography scale.
- `tamagui.config.ts` maps those values into typed Tamagui tokens, the `light` theme, `body` and `heading` fonts, control sizing, radii, and the `fast`, `medium`, and `slow` animation presets.
- `app/providers/TamaguiProvider.tsx` is the only app-level integration point. Keep it in the root provider tree and also wrap any root error fallback that renders Tamagui components.
- The current configuration sets `onlyAllowShorthands: false`. Use clear longhand style props consistently; do not copy shorthand-only assumptions from another Tamagui starter.
- The approved SF Pro and SF Pro Rounded binaries are not in the repository. Keep the configured system-font fallback until licensed assets are supplied and loaded through Expo Font.

### Component rules

Use Tamagui primitives such as `YStack`, `XStack`, `Text`, `Button`, `Input`, `Card`, `Sheet`, and `Dialog` for ordinary UI. Use React Native primitives when Tamagui has no suitable component or a native API requires them. Use `FlatList` or `SectionList` for long or virtualized collections and render Tamagui components inside each row.

Use semantic tokens instead of raw visual values in screens:

- Colors: `$primary`, `$secondary`, `$background`, `$textPrimary`, `$textSecondary`, support colors, and semantic state colors.
- Spacing: `$xs`, `$sm`, `$md`, `$lg`, `$xl`, `$xxl`.
- Radius and sizing: `$sm`, `$md`, `$lg`, `$xl`, and `$control` for the minimum control height.
- Typography: `$body` or `$heading` with `$caption`, `$bodyS`, `$bodyM`, `$bodyL`, `$button`, and `$h1` through `$h5`.
- Motion: `fast`, `medium`, or `slow`; respect reduced-motion preferences when motion is decorative.

Import icons from `@tamagui/lucide-icons-2`, which matches the installed Tamagui v2 packages. Let Tamagui components pass theme size/color to icons when possible. Do not use the older `@tamagui/lucide-icons` package because it brings a separate Tamagui v1 core into the dependency tree.

This project targets native mobile only. Do not inherit Takeout-specific `src/interface` components, SSR settings, semantic HTML components, browser routing, or web-only layout assumptions. Add media queries only when the app has an actual phone/tablet layout requirement and define them centrally in `tamagui.config.ts`.

Use native press and accessibility behavior supported by the selected Tamagui component, and verify it on Android and iOS. Respect safe areas, keyboard avoidance, system text scaling, reduced motion, screen-reader labels, hit targets, and contrast. Put all user-facing copy in localization resources (Vietnamese first, ready for English). Format dates in each viewer's locale and render timestamps in the current viewer's local zone; compute a person's “today” in their own configured time zone.

Keep token changes centralized. Screens must not introduce one-off hex values, spacing scales, font sizes, radii, animation timings, or raw platform-specific colors. When a native API cannot consume a Tamagui token directly, resolve the shared value through `useTheme`, `getTokenValue`, or `src/shared/constants/tokens.ts` rather than duplicating it.

## 5. State ownership

| State | Owner | Rule |
| --- | --- | --- |
| Check-ins, partner status, nudges, moments, invite/couple data, profile/settings | TanStack Query | Server is authoritative; query keys include account/couple scope. Clear scoped caches on account/couple changes. |
| Form drafts, selected mood/tags, composer state, modal visibility | Screen/feature React state or RHF | Keep local and ephemeral; discard or explicitly save drafts on exit. |
| Session coordination and non-sensitive app-wide UI flags | Zustand | Small and transient; credentials stay in SecureStore, not Zustand persistence. |
| Offline check-in outbox and upload retry metadata | SQLCipher Expo SQLite repository | Explicit schema/version, encrypted sensitive fields, idempotency key, queued/sending/failed/acknowledged state, bounded retry, and deletion after server acknowledgement. |
| Tokens | Expo SecureStore | Refresh lifecycle through auth service; erase on logout, deletion, or invalid refresh. |
| Media bytes | Temporary app file storage until upload/acknowledgement | Avoid unnecessary copies; clean up on cancel, completion, expiry, or sign-out. |

Do not persist TanStack Query caches wholesale. Re-fetch partner/private content after foregrounding. Use optimistic updates only for reversible, low-risk actions and preserve rollback; check-ins, relationship changes, and deletion use server acknowledgement rather than a false success.

## 6. API, sync, and native boundaries

Define typed REST service modules matching the documented API groups: auth, me/profile/settings, couple/invites, check-ins, nudges, moments/media, and content/config. Services accept typed inputs and return validated domain values. Components never call `fetch` directly. Use cursor pagination for the shared Moments feed. Pass an `Idempotency-Key` for create operations that the product API specifies. Normalize server error codes at the API boundary and keep raw DTOs out of UI.

Use short-lived authenticated requests, TLS, refresh-on-expiry with a single-flight refresh, cancellation on screen/account changes, and bounded retry only for transient reads or idempotent requests. Do not blindly replay a non-idempotent mutation. A 401 clears session state through one auth coordinator; couple membership and privacy checks remain server responsibilities on every API.

WebSocket/SSE (server choice is unresolved) may update open-app state for `partner.checkin`, `moment.new`, `nudge.new`, and `couple.status`. Reconnect on foreground/network regain, then refetch authoritative data. Do not promise background sockets or sub-five-second delivery when the app is suspended.

Native permission is requested just in time and after value is demonstrated: notification permission only after first check-in; camera/microphone/photo access only when that action is invoked. Denial must leave text/check-in flows usable and show a route to OS settings only when useful. Use OS share sheet for invitations. Background work is best-effort; server jobs own AI generation, notification policy, scheduled invite/nudge reminders, quiet hours, caps, and retention/deletion.

## 7. Offline check-in and media

Check-in capture remains available offline. Validate mood, up to three configured reason IDs, 140-character note, and share scope before enqueueing. Persist the immutable submission plus client UUID/idempotency key and local-created time in the encrypted outbox. Private-only check-ins must never trigger partner notification or Nudge generation; the client still sends the chosen share scope explicitly. Show “saved on this device / waiting to send” until acknowledgement, then reconcile to the server response and latest-state ordering. Retry on foreground and connectivity regain with backoff; server idempotency prevents duplicates. If auth/couple state changes, stop and require revalidation rather than sending stale queued data.

For Tiny Moments, enforce limits before upload: image longest edge 1600 px and <=2 MB after compression; voice <=30 seconds with playback review; text <=200 characters; caption <=100 characters. Request an upload URL, upload bytes separately, then create the Moment with idempotency. Keep a recoverable local draft on upload failure, retry only against a valid signed URL (request a new one when expired), and expose pending/failed states. Signed media read/upload links must expire within 15 minutes. Never collect precise location; an optional user-entered place caption is text only. A delete clears feed/cache immediately after server confirmation and relies on the service to revoke access and delete source bytes.

## 8. Validation, async states, and errors

Use Zod schemas for user forms, API DTO decoding, and queued payload versioning. RHF displays field-level errors beside accessible controls. Match product limits and server-configured tags; never hard-code the reason catalog as authoritative.

Every network-backed screen and action handles: initial loading, refreshing/stale data, empty, success, offline/pending, and recoverable error. An error includes a plain Vietnamese explanation and a relevant retry or recovery action. Distinguish expired invite, already-paired, validation, auth expiry, permission denial, rate limit, unavailable service, and upload failure. Never surface stack traces, provider errors, AI errors, or raw backend messages. Smart Nudge provider failure is handled server-side with a template; users see the Nudge, not an AI failure. Do not fabricate success before critical server acknowledgement.

## 9. Privacy and observability boundaries

- Check-in notes, emotional state, message bodies, relationship preferences, invite tokens, signed URLs, media, and auth credentials are sensitive. Exclude them from analytics, crash reports, debug logs, notification payload previews, and URL query strings.
- Respect check-in scope: full, mood-only, or private-only. Enforce each scope on display and API behavior; partner status is not a client-filtered copy of private data.
- AI inputs are prepared server-side and exclude real name, phone, email, and precise location. The mobile app never calls an AI vendor directly. Show that AI is used in consent/privacy UI as specified.
- Lock-screen notification content follows privacy mode; use generic text when enabled. Push payloads carry identifiers/type only, then fetch authorized content after unlock/open.
- Secure media with short-lived signed links; do not cache indefinitely. Clear couple data and subscriptions after unpair; account export/deletion and the 30-day shared-data window are server workflows.
- Analytics events are allowlisted product events with minimal non-sensitive properties. Device push tokens are registered/deleted through the device service at login/logout and invalid-token response.

## 10. MVP boundary

Build the required product scope in requirements sections 4.1–4.6: onboarding/auth/consent/invite/waiting; daily check-in and partner status; Smart Nudge action and feedback; Tiny Moments; notification settings/behavior; profile, privacy, export, unpair, and deletion. Include the cross-cutting quality/security/accessibility requirements in section 6 from the start.

Items marked “Nên có” and widgets in 4.7 are optional MVP extensions, not prerequisites to the required flow. The product's own roadmap places widget, streak, performance, and security validation late in section 10. Phase 2 section 5 includes date planning, anniversary timeline, advanced missions, shared budget, and weekly AI summary; keep only clean extension points, and do not ship those screens or data flows in the MVP.

Before implementation, surface unresolved decisions from section 13: required phone login; AI vendor/no-training terms; cross-time-zone streak day rule; crisis support content/contact; age rating/children's-data legal handling (no login age gate is already specified); brand identity; Tiny Moment retention; deferred deep-link provider. Also confirm server push/realtime transport and whether SQLCipher is supported in the selected Expo build. Do not silently choose product policy in the client.

## 11. Code conventions

- Components/screens: PascalCase; hooks and services: camelCase; route files follow Expo Router conventions.
- Type every public function, component prop, route parameter, DTO, and domain model. Avoid `any`; use discriminated unions for status and API result variants.
- Co-locate tests with features when requested by the project task; do not introduce a cross-feature test harness for an isolated UI unit.
- No browser globals (`window`, `document`, `localStorage`, `navigator`, DOM events), HTML elements/forms, web router guards, or CSS assumptions. Use platform adapters and React Native APIs.
