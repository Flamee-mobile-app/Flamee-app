# Flamee mobile rebuild architecture

**Status:** proposed Phase 1 architecture for React Native + Expo + Tamagui  
**Product source of truth:** [Tài liệu yêu cầu sản phẩm: App kết nối cho cặp đôi](Tài%20li%E1%BB%87u%20y%C3%AAu%20c%E1%BA%A7u%20s%E1%BA%A3n%20ph%E1%BA%A9m_%20App%20k%E1%BA%BFt%20n%E1%BB%91i%20cho%20c%E1%BA%B7p%20%C4%91%C3%B4i.md) and [Các luồng chính của app (bản đầu)](Các%20lu%E1%BB%93ng%20ch%C3%ADnh%20c%E1%BB%A7a%20app%20(b%E1%BA%A3n%20%C4%91%E1%BA%A7u).md). This document is a client architecture proposal; it does not define new product policy or backend contracts beyond those documents.

The product is a private, two-person connection loop: one partner checks in, the other sees only the shared information and may act on one Smart Nudge by sending a Tiny Moment. The phone client supports iOS and Android from one codebase. The server remains authoritative for couple membership, shared visibility, AI, notifications, retention, and deletion.

## 1. Platform and library decisions

| Concern | Proposed choice | Why it fits this product |
| --- | --- | --- |
| App shell and native build | React Native + Expo, TypeScript | One client for iOS/Android (requirements §6); Expo config plugins and development builds support OS media, secure storage, notifications, and native capabilities. |
| Navigation | Expo Router (built on React Navigation) | Typed native stacks/tabs and deep-link entry suit onboarding, invite acceptance, notification destinations, and a persistent waiting state. It avoids treating the app as a browser. |
| Styling | Tamagui + shared semantic token config | Typed React Native components with a central theme for mood colors, spacing, type, controls, and animations. |
| Server state | TanStack Query | The product is server-centered and needs caching, mutation lifecycle, pagination, refetch on foreground, and reconciliation of partner/Moment changes. Private data is not persisted wholesale. |
| Small cross-screen state | Zustand | Coordinates session/couple routing and transient app UI without turning server records into a second global store. Sensitive contents are not persisted there. |
| Forms and validation | React Hook Form + Zod | Typed onboarding/settings/check-in forms with field errors; the same schemas can validate decoded API responses and outbox versions. |
| Credentials | Expo SecureStore | Uses platform secure storage for refresh credentials and small secrets; avoids insecure general-purpose preference storage. |
| Offline queue | Expo SQLite with SQLCipher enabled | Durable outbox supports offline check-in and retry/deduplication. Encryption is required before sensitive notes are stored locally; verify native build/config-plugin support for the selected Expo SDK. |
| Native media | Expo ImagePicker, ImageManipulator, and the Expo SDK-compatible audio module | Uses native camera/library/microphone flows, image resizing, and bounded recording without a web file-input or recorder assumption. Isolate behind adapters. |
| API/realtime/share | React Native `fetch`, `WebSocket`, and `Share` | Built-in mobile primitives keep the API client small and use the OS share sheet. Realtime transport is a server decision; WebSocket/SSE only updates an open app. |
| Push/local reminders | Expo Notifications; TaskManager only for optional best-effort work | Bridges APNs/FCM and notification taps. Server owns cross-device reminders and policy; OS background execution is not reliable enough to own correctness. |

Pin compatible package versions when implementation starts. Native APIs and permissions are isolated under `shared/native`; native modules requiring config plugins use Expo development builds and production builds. No browser-only packages, DOM APIs, HTML forms, `localStorage`, or browser route guards are part of this design.

## 2. Proposed mobile folder/module map

```text
app/                                  # Expo Router route composition only
  _layout.tsx                         # providers, root error boundary, fonts/theme
  index.tsx                           # session + account-state bootstrap router
  (auth)/                             # intro, Apple/Google/phone authentication
  (onboarding)/                       # consent, profile, care preferences, relation
  (invite)/                            # create/share, accept/confirm, manual code
  (waiting)/                           # pending invite, pre-pair check-in, resend
  (main)/                              # paired Home / Moments / Profile tabs
  nudge/[nudgeId].tsx                  # deep-linkable nudge detail/action
  moment/[momentId].tsx                # deep-linkable Moment detail
  settings/                            # notification/privacy/account settings

 src/
  features/
    auth/                              # session bootstrap, login, refresh, logout
      screens/ components/ hooks/ services/ schemas/ types.ts index.ts
    onboarding/                        # consent version, profile, care prefs, relation
      screens/ components/ hooks/ schemas/ types.ts index.ts
    invites/                           # token/code, deferred invite intent, share, accept
      screens/ components/ hooks/ services/ schemas/ types.ts index.ts
    couple/                            # membership, waiting state, unpair lifecycle
      screens/ components/ hooks/ services/ types.ts index.ts
    checkins/                          # mood/tags/scope/note, history, offline outbox
      screens/ components/ hooks/ services/ schemas/ repositories/ types.ts index.ts
    partner-status/                    # permitted partner snapshot, local-time display
      components/ hooks/ services/ types.ts index.ts
    nudges/                             # detail, act/later/skip, feedback
      screens/ components/ hooks/ services/ schemas/ types.ts index.ts
    moments/                            # compose/feed/detail/reaction/delete
      screens/ components/ hooks/ services/ schemas/ types.ts index.ts
    media/                              # temporary media, compression, upload, playback
      components/ hooks/ services/ adapters/ types.ts index.ts
    notifications/                      # preferences, permission, tap routing, device token
      screens/ components/ hooks/ services/ adapters/ types.ts index.ts
    profile-settings/                   # profile, privacy explainer, export/delete entry
      screens/ components/ hooks/ services/ schemas/ types.ts index.ts
    account-lifecycle/                  # export, sign-out, delete, local data cleanup
      screens/ hooks/ services/ types.ts index.ts
  shared/
    api/                                # fetch client, auth refresh, error decode, DTO helpers
    components/                         # buttons, fields, banners, loading/empty/error views
    design/                             # Tamagui tokens, mood palette, typography
    hooks/                              # app foreground and connectivity subscriptions
    localization/                       # Vietnamese strings, English-ready resources
    native/                             # secure store, SQLite, notifications, media, share
    navigation/                         # typed href builders, route intent parser
    observability/                      # scrubbed error reporting, allowlisted analytics
    validation/                         # shared primitives only; feature rules stay local
    types/                              # IDs, time-zone and non-feature primitives
  providers/                            # QueryClient, session, theme, connectivity
  config/                               # Expo config, env parsing, build-profile flags
```

The `app/` files are thin route adapters. Feature screens and hooks own user flows. A feature accesses its own private modules and shared public modules; cross-feature access goes through a feature `index.ts` or a small shared contract, never a deep import. Avoid creating empty module folders until a feature is implemented.

## 3. App navigation and lifecycle

At launch, read only session credentials from SecureStore, restore/refresh the session, then ask the API for the account and couple state. Route from the result:

```text
signed out -> intro/auth -> terms & privacy consent -> profile/care preferences
  -> relation choice -> invite creation/share -> first check-in -> notification ask
  -> waiting for partner

invite URL/code -> sign in if needed -> validate invite -> quick profile if needed
  -> inviter confirmation -> accept -> paired Home

paired Home -> check-in / Smart Nudge / Tiny Moment / shared feed / settings
```

The exact onboarding steps should keep the documented “value in at most four main steps” goal and allow optional steps to be skipped (§4.1 requirement 1.13; flow 2). Consent must be recorded with version/time before collecting data that needs it. Ask for notification permission after the first check-in (§4.5 requirement 5.1; flow 2).

Invite tokens are treated as secrets. Parse invite URLs into a typed intent, do not place tokens in analytics or logs, and preserve the intent through auth. Expo Router can receive a link when the app is installed; a separate deferred-deep-link provider is needed for install-then-open recovery (§4.1 requirement 1.6). A manual six-character code remains available (§1.7). Accept is a server mutation; concurrent accept attempts must produce one couple only (flow 3).

Push taps route to a validated Nudge or Moment identifier and fetch current authorized data. When account/couple membership changes, clear cached couple data and active subscriptions, invalidate queued operations that are no longer authorized, and replace the navigation stack. Client guards prevent confusing screens but never grant access; every API checks current pair membership (§6 security row).

## 4. Design system

Use a single Tamagui token source for colors, semantic backgrounds/text, spacing, radii, type sizes, line heights, control dimensions, and animations. Mood colors map to named states and visible labels/icons, never color alone (requirements §4.2 requirement 2.1 and §6 accessibility row). Reflect tokens in native status-bar/navigation-bar settings and any OS surfaces that need colors.

Screens use React Native primitives and safe-area-aware layout. Support system text size, screen readers, sufficient contrast, keyboard handling, platform back behavior, and localized dates. Display a partner's local clock and configured timezone difference, but calculate “today” independently for each member (§4.2 requirements 2.6–2.8; flow 5). Keep visible copy in Vietnamese localization resources with English expansion in mind (§6 language row).

## 5. Data ownership and API design

### State ownership

| Data | Owner |
| --- | --- |
| Profile, couple, invites, server-configured reason tags, partner status, Nudges, Moments, settings | TanStack Query; API is authoritative. Scope query keys by account and couple. |
| Form entries, selected filters, modal/composer state | React state or React Hook Form in the feature; ephemeral unless a flow explicitly offers draft recovery. |
| Session/couple bootstrap flags and transient route intent | Minimal Zustand state. No sensitive-content persistence. |
| Auth refresh/access credentials | SecureStore only. |
| Offline check-in submissions and upload retry metadata | SQLCipher SQLite outbox with explicit schema and idempotency key. Remove after acknowledged sync. |
| Media awaiting upload | Temporary app files plus local metadata; expire and clean up on completion/cancel/sign-out. |

Keep TanStack Query cache in memory because check-ins and moments can contain sensitive emotional or personal information. On resume, reconnect, or realtime event, refetch as appropriate. Apply optimistic updates only when rollback is safe; do not show check-in, delete, unpair, or account deletion as completed before server acknowledgement.

### REST boundaries

Feature services map to documented REST groups (§8): `auth`, `me/profile/settings`, `invites/couple`, `checkins/partner-status`, `nudges`, `moments/media`, and `content/config`. Use typed request DTOs, decode and validate responses at the service boundary, return domain models, and keep raw JSON out of components. Lists use cursor pagination. Create operations use `Idempotency-Key` where specified. Translate error codes into stable app error types and Vietnamese copy.

Use short-lived access credentials and refresh through a single auth coordinator; cancel requests when their account scope ends. Retry transient reads with bounded backoff. Retry a mutation only when it is idempotent or carries the server-supported idempotency key. Do not duplicate the server's membership or privacy enforcement in client assumptions.

Subscribe to `partner.checkin`, `moment.new`, `nudge.new`, and `couple.status` while foregrounded if the backend provides realtime transport (§8). Reconnect/refetch after foregrounding. APNs/FCM plus server jobs own notifications while suspended; no persistent socket or guaranteed background JavaScript is assumed.

## 6. Offline check-in and Tiny Moment media

### Check-in outbox

The check-in form works without a network. Validate mood 1–5, up to three server-configured reason IDs, note up to 140 characters, and sharing scope. Save a versioned payload, generated client ID/idempotency key, and local timestamp in encrypted SQLite. Keep the row until the API acknowledges it; show a clear “saved on device / waiting to send” state meanwhile. On foreground or connectivity regain, send in order with bounded backoff, then replace local state with the canonical server response. Server idempotency prevents duplicate submissions (§4.2 requirements 2.5, 2.6, 2.9; §6 stability row; flow 5).

All three visibility choices travel explicitly with each submission. A private-only check-in must not notify the partner or create a Smart Nudge (requirements 2.4; 3.1; flow 5). Do not reuse partner-visible state as the user's private history. If sign-out, unpair, or account change happens before sync, stop the queue and require fresh authorization; never send an old payload under another account.

### Media upload

Request a short-lived upload URL from the API, upload the file bytes separately, then create the Tiny Moment. A failed upload retains a recoverable draft and requests a fresh URL if the old one expired. A confirmed Moment delete removes it from both partners' views and revokes/deletes the original file server-side. Media read/upload links expire within 15 minutes (§6 security row; §8 media API; flow 8).

Enforce documented limits: photo max edge 1600 px and <=2 MB after compression, voice recording <=30 seconds with playback before send, text <=200 characters, caption <=100 characters (requirements §4.4 items 4.1–4.3). Ask for photo/microphone permission only when invoked. Do not collect precise location; optional place text is entered by the user and not GPS (§4.4 item 4.2). Limit local media copies and clean up temporary files after success, cancellation, expiry, and sign-out.

## 7. Validation and user-visible states

Zod schemas cover form input, API response decoding, and SQLite payload versions. Server configuration remains authoritative for check-in tags and daily prompts. Every screen or operation with async work defines:

- initial loading and refresh;
- empty content with an appropriate next action;
- success, including pending/offline success where the server has not yet confirmed;
- recoverable error with retry or another clear route;
- permission-denied and expired-session/invite states where relevant.

Use specific, non-technical errors for expired/revoked invites, existing couple membership, validation, network loss, rate limits, expired upload URLs, and media failures. Never surface stack traces, raw provider errors, or AI failures. The server must return a template Smart Nudge when AI is slow/fails, so mobile screens handle one consistent Nudge response (§4.3 requirements 3.9–3.10; flow 6). A root React error boundary offers a recovery screen for unexpected render failures.

## 8. Notifications and background boundary

The server is the source of truth for push categories A–H, per-user daily cap, quiet hours, privacy-mode wording, reminder cancellation, delivery limits, and device-token lifecycle (§4.5 requirements 5.1–5.7; flow 9). The app registers device tokens, requests permission only after first check-in, handles taps, and exposes category/privacy/quiet-time settings. Push payloads contain a type and opaque identifier; fetch display content after opening. When privacy mode is on, lock-screen copy is generic.

Local OS notifications may provide the configurable daily check-in reminder when permission exists. Reconcile or cancel local reminders when settings change or a check-in arrives. Do not schedule server-owned invite or Nudge reminder policy solely on the device. Use background tasks only as an optional opportunity to drain already-authorized queue work; normal correctness comes from foreground/reconnect sync. AI creation, quiet-hour holding, grouped replies, caps, retention cleanup, and deletion run on backend jobs (§6 quality/security; §8 API and realtime).

## 9. Privacy and security boundaries

- Sensitive values include emotional state, notes, message text, care preferences, invite tokens, credentials, signed media URLs, and raw media. Never include them in analytics, crash payloads, logs, route query strings, or push preview text.
- Respect `full`, `mood_only`, and `private_only` scopes end-to-end. The API decides partner visibility; a client-side filter is not a security control (§4.2 requirement 2.4).
- The mobile app sends no direct AI-vendor request. The backend filters AI context and excludes legal name, phone, email, and exact location (§4.3 AI rules). The app presents the consent text explaining sensitive mood data and AI use (§4.6 requirement 6.3).
- Secure credentials with SecureStore; encrypt durable offline sensitive data before writing it. Do not claim encryption at rest without SQLCipher/build configuration verified.
- Only short-lived signed media links are used. Clear couple-scoped query data and subscriptions on unpair. Export, account deletion, and the 30-day shared-data window are server workflows (§4.1 requirement 1.12; §4.6 requirements 6.5–6.6; flow 10).
- Emit only allowlisted product analytics with the minimum non-sensitive properties. Device tokens are removed on logout or when rejected by push service (§4.5 requirement 5.7).

## 10. Phase boundaries

The source uses both **Bắt buộc** and **Nên có** feature labels, then proposes a rollout in §10. Keep the terms distinct:

| Phase | Scope |
| --- | --- |
| Foundation | Expo app shell, token/theme system, typed route groups, session/API core, secure storage, feature boundaries, consent and localization scaffolding. Validate target iOS 15+/Android 8+ support and build native modules. |
| MVP required path | Required §4.1–4.6 flows: auth/onboarding/consent/profile, create and accept invite with waiting state, check-in and partner status, Smart Nudge act/later/skip/feedback, Tiny Moment create/feed/reply/delete, push settings, privacy, export, unpair, and account deletion. Include §6 security, accessibility, performance, localization, and reliability requirements as cross-cutting acceptance. |
| MVP hardening | Validate AI fallback/safety, privacy/access controls, media link expiry, offline idempotency, notification policy, accessibility, launch speed, delivery and realtime goals; closed beta. The product roadmap places performance/security and optional widget/streak late (§10). |
| Optional MVP extensions | Items explicitly marked “Nên có”: 30-day mood history, recent Nudge history, 14-day Nudge review, “seen”, streak, and iOS/Android widgets (§4.2 item 2.12; §4.3 items 3.11–3.12; §4.4 items 4.9–4.11; §4.7). Product must prioritize them against required work; architecture leaves feature boundaries but does not treat them as release blockers. |
| Phase 2 | Date planning, anniversary timeline, advanced missions, shared budget, weekly AI summary (§5). Reserve extension points only; no MVP client flow or speculative data collection. |

This is a scope boundary, not a delivery calendar. The product roadmap suggests an order but explicitly does not commit to timing (§10).

## 11. Unresolved product and technical decisions

Keep these visible until the owners named in the source decide; do not invent client behavior:

1. **Phone login required or optional** (§13 question 1).
2. **AI provider and contract/no-training commitment** (§13 question 2). Backend provider remains abstract behind its AI layer (§4.3).
3. **Streak day calculation across large timezone differences** (§13 question 3; flow 8 and flow appendix). Do not build a streak as required MVP behavior.
4. **Vietnam crisis-support content and contact number** (§13 question 4). Admin-configurable, but client has no fallback content to invent (§4.3 requirement 3.10).
5. **App-store age rating and children's-data legal handling** (§13 question 5). No login age gate is specified; no new gate is proposed.
6. **Brand name and visual identity** (§13 question 6). Tokens and components can be themed after approval.
7. **Tiny Moment retention duration** (§13 question 7), alongside the stated deletion/30-day workflows.
8. **Deferred deep-link provider** (§13 question 8; §4.1 requirement 1.6 names Branch or AppsFlyer OneLink as examples). Keep provider behind an invite-link adapter.
9. **Backend realtime transport (WebSocket or SSE)** (§8 lists both).
10. **Expo SDK/audio module and SQLCipher build integration** are implementation compatibility checks, not product policy. Confirm at project bootstrap before selecting package versions.

## 12. Product traceability

| Architecture area | Product references covered |
| --- | --- |
| Navigation/invite/waiting/account state | Requirements §4.1 (1.1–1.13); flows 2–4, 10 |
| Check-in, sharing, partner status, timezone, offline queue | Requirements §4.2 (2.1–2.11); flows 5 and 11 |
| Smart Nudge states, fallback, safe content, feedback | Requirements §4.3 (3.1–3.10); flows 6–7 |
| Tiny Moment media, feed, replies, deletion | Requirements §4.4 (4.1–4.8); flow 8 |
| Push permission, quiet time, cap, privacy, deep routes | Requirements §4.5 (5.1–5.7); flow 9 |
| Consent, privacy, export, unpair/delete | Requirements §4.6 (6.1–6.10); flow 10 |
| Cross-cutting security, reliability, accessibility, localization, performance | Requirements §6; API boundaries §8 |
| Optional and later work | Requirements §§4.2–4.7, §5, §10 |
