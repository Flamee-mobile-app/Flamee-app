# Flamee Mobile — Local Main-Flow and Feature-Owned Runtime

**Version:** 1.0  
**Date:** 2026-10-07  
**Status:** Final design draft for product-owner review  
**Purpose:** Replace scenario-driven app startup with the documented user workflow, while keeping local behavior owned by the feature that implements it. This is a specification, not an implementation plan.

## 1. Decision summary

The app will run through product actions, not through a screen that replaces global state with named scenarios. A fresh process begins signed out; account, invite, check-in, Nudge, Moment, and settings data appears only through normal user actions or feature service results.

Each feature owns its domain types, validation, service/repository interface, local implementation, hooks, and transition tests. The app will not replace the current central runtime with another global business-state folder/provider. In particular, there will be no **src/local-runtime**, **DemoRuntimeProvider**, or **RouterProvider**.

The local implementations exist to exercise the product flow before backend integration. They are not production authentication, cross-device pairing, AI, push delivery, or server persistence. The product documents remain the source of behavior, and local limitations must not be presented as completed remote effects.

### Decisions for review

1. Remove the scenario browser, scenario IDs/seeds, role switching used for fixture navigation, and scenario-specific app copy.
2. Do not preload an account, partner, pair, invite, check-in, Nudge, Moment, permission outcome, or error.
3. Keep and relocate useful business logic/tests; remove only scenario-specific runtime controls and fixtures.
4. Keep sensitive local business data in memory for this phase. A cold restart returns to signed out; do not persist sensitive data in unencrypted SQLite, AsyncStorage, or persisted Query cache.
5. Reach fallback states through normal actions, real OS permission outcomes, typed feature-service results, and feature tests—not a user-facing scenario selector.
6. Defer backend, real identity providers, cross-device synchronization, server AI, remote push, and a durable encrypted offline queue.

This session-only data boundary is deliberate. The current Expo Go setup does not provide the configured SQLCipher support required for durable sensitive data. This phase therefore does not claim to meet the production requirement for durable offline check-ins.

## 2. Product intent and sources of truth

The local workflow follows the documented two-person product:

- inviter: introduction/auth → consent/profile/preferences → relation type → invitation and optional gift → first check-in → notification permission prompt → waiting;
- invitee: invitation link or six-character code → auth/onboarding as needed → validate and confirm → accept → paired Home;
- paired use: Home/status → check-in → Smart Nudge → Tiny Moment/feed/reply → notification/profile/privacy/account settings.

Behavior and scope come from:

- **.doc/Tài liệu yêu cầu sản phẩm_ App kết nối cho cặp đôi.md**, required sections 4.1–4.6 and quality/security section 6;
- **.doc/Các luồng chính của app (bản đầu).md**, flows 1–11;
- **.doc/FLAMEE-MOBILE-ARCHITECTURE.md**;
- **.doc/fe_skills/ARCHITECTURE-FE-SKILL.md**.

This spec changes runtime ownership and app entry behavior. It does not introduce new product policy or Phase 2 functionality.

## 3. Current-state problem

The current **src/demo** folder is not just a fixture directory. It combines:

- one cross-feature state/action model for account, couple, invite, check-in, Nudge, Moment, settings, and export;
- a shared reducer and service implementing many unrelated domains;
- initial state, scenario registry/builders, scenario screen, and tests coupled to that shared runtime.

**DemoRuntimeProvider** injects that state/service into feature screens. **app/index.tsx** derives a route from it. Several features import the provider directly. Media fallback code can return **demo://** URIs, and the app contains demo labels and a canned code shortcut.

Renaming this design to **src/local-runtime** would preserve the ownership violation. The target is feature-owned local behavior, not a renamed monolith.

## 4. Goals and non-goals

### Goals

- Reach documented auth, onboarding, invitation, waiting, invite-acceptance, paired, and account-management journeys by user actions.
- Remove scenario selection and any in-app route for replacing the current business state.
- Put each domain's types, schemas, local service implementation, hooks, and tests in the owning feature.
- Preserve the required empty/loading/success/pending/offline/permission-denied/validation/recoverable-error states.
- Use real native photo/audio capability when available and show honest permission/unavailable recovery otherwise.
- Keep sensitive records out of global Zustand state, logs, and unencrypted persistence.
- Keep service boundaries ready for later backend integration without making screens depend on demo-wide state.

### Non-goals

- Production API/backend integration or inventing undocumented API contracts.
- Claiming Apple, Google, or SMS authentication succeeded through a local adapter.
- Real cross-device invite acceptance, realtime sync, APNs/FCM delivery, or server-owned reminders.
- Calling an AI vendor; local Nudge behavior uses an approved template boundary only.
- Persisting sensitive profile/check-in/Nudge/Moment data across process restarts in Expo Go.
- Phase 2 features or optional widgets/streak/history unless separately approved.

## 5. Considered approaches

| Approach | Assessment | Decision |
| --- | --- | --- |
| Rename the shared demo runtime | Removes terminology but keeps all feature data and business logic in one global state/service. | Reject. |
| Feature-owned local services with minimal app coordination | Follows the root architecture skill, makes feature transitions independently testable, and provides a clean later backend seam. | Recommend. |
| Connect backend services now | Requires backend contracts, credentials, and external services beyond the agreed local-flow phase. | Defer. |

## 6. Target architecture

### App and navigation

- Expo Router remains the navigation system. Files under **app/** compose route groups and feature screens.
- Root providers remain cross-cutting infrastructure: Tamagui, TanStack Query, safe-area/native roots, and session bootstrap.
- No provider exposes a global collection of product records and mutations. There is no DemoRuntimeProvider, LocalRuntimeProvider, or RouterProvider.
- The entry resolver consumes a minimal typed bootstrap snapshot: session/account status, onboarding completion, pending invite intent, and couple status. It does not implement feature business rules or import private feature modules.
- Cross-feature use goes through a feature's public **index.ts**, typed route parameters, or an explicit typed application event. Shared code never imports a feature.

### State and services

- A feature owns its screens/composition, hooks, schemas, domain types, service/repository boundary, local implementation, and transition tests.
- Feature hooks invoke that feature's service and expose feature-scoped query, mutation, pending, and error states. TanStack Query may hold private feature data in memory; the cache is not persisted.
- Feature-local repositories own their records. Cross-feature behavior uses explicit public operations/events instead of a global reducer and arbitrary dispatch action.
- Zustand remains limited to non-sensitive session bootstrap, active account/couple identifiers, and transient route intent. It does not contain profile text, emotional notes, Nudge bodies, Moments, or other server-shaped records.
- **src/lib/api** remains the future API client/error mapping boundary. Later backend services replace/adapt the feature services without moving business ownership out of features.
- **src/shared** contains only genuinely cross-app components, tokens, localization, date utilities, native adapters, and domain-neutral contracts.
- Do not create empty module folders or a new generic application framework.

### Feature ownership

| Feature | Local ownership |
| --- | --- |
| **auth** | Auth form/service contract, local-session result, auth errors, and sign-out initiation. Local success is not identity verification. |
| **onboarding** | Consent version/time for the current flow, profile/timezone, care preferences, relationship input and validation. |
| **invites** | Link/code parsing, create/share intent, optional gift draft, invite status validation, accept confirmation and recovery. |
| **couple** | Membership/waiting/paired/unpaired transitions, waiting actions, paired-success composition and unpair coordination. |
| **checkins** | Mood/reason/scope/note types and validation, latest/history behavior, and current-run pending/send outcomes. |
| **partner-status** | Projection of partner-visible check-in fields and local-time display. |
| **nudges** | Nudge state/actions, local template selection boundary, snooze/skip/expiry/feedback and safety presentation. |
| **moments** | Moment types, drafts/feed/detail/replies/reactions/deletion, and documented media limits. |
| **media** | Native picker/capture/compression/record/playback operations and temporary-file cleanup; never synthesize media URIs. |
| **notifications** | Preferences, OS permission state, typed tap intent and local daily reminder. Remote policy/delivery are deferred. |
| **profile-settings** | Profile editing, privacy explanation and settings UI contracts. |
| **account-lifecycle** | Export, sign-out cleanup, two-step unpair/delete confirmation and local-scope cleanup. |
| **home** | Composition of feature-owned status/actions; it is not a second data source. |

Ownership does not require one file per responsibility. Add a module only when behavior is implemented. Feature-to-feature references use public exports, not deep imports.

## 7. Local behavior contract

### State creation and lifetime

- A new process starts signed out with no seeded profile, couple, partner, invite, check-in, Nudge, Moment, permission result, or artificial service error.
- Data is created by the user flow or a feature service result.
- Local domain data exists in feature-owned memory for the running process and resets after a cold restart. Sign-out clears the active session and account-scoped query state, but does not erase the in-process invite/account records needed for a normal subsequent sign-in and invite-acceptance flow. Unpair/delete clear the relevant local business scope.
- No sensitive business data is added to SecureStore, AsyncStorage, or plaintext SQLite. SecureStore remains for actual small secrets only.
- The existing SQLCipher-only helper is not activated. Durable encrypted offline queue work requires SQLCipher verification in the target native build and a separate implementation decision.

### Local-only operation

- Local authentication advances the workflow but makes no claim that Apple, Google, or SMS verified an identity or created a production credential.
- Invite create/accept can run against invite data held by the current in-process local feature services. This does not provide cross-device sharing or authorization.
- Check-in, profile/settings, Nudge, and Moment actions update local feature-owned state; no remote sync or delivery is implied.
- Local Nudge behavior selects approved template content only. No client-side AI request is made. Safety content/contact must come from product-approved configuration and must not be invented.
- Local reminders may use actual OS permission/scheduling. Remote categories, server caps, shared quiet-hour policy and push delivery are not presented as real.
- Media uses native device capabilities. Denial/unavailability displays the documented recovery path, not fabricated content.
- Local export includes only data available in local memory. Local unpair/delete clears local scope but does not claim server deletion or the 30-day retention workflow.
- UI copy describes only the local effect that occurred; it must not claim remote sent/synced/deleted-for-both/account-deleted effects.

### No scenario browsing

- Routes/settings contain no scenario list, scenario/role toggle, preset-state selector, reset-demo action, canned invite code, or hidden state-injection gesture.
- States arise through user actions, native permission results, typed feature service results, or actual expiry/business rules.
- Isolated tests may use fixtures and injected service outcomes. Runtime code cannot import those fixtures.
- Product domain types/services and user-facing copy do not use demo terminology.

## 8. Main-flow journeys

### A. Fresh install and inviter

1. Bootstrap resolves to introduction/auth because there is no active local session.
2. Local auth creates only a local workflow session.
3. The user records consent, enters profile/timezone, optionally sets care preferences, and chooses relationship type.
4. The user creates a one-use six-character invitation with 72-hour expiry and may attach text/photo/voice gift.
5. The app offers the native share sheet for the invitation.
6. The user completes the first check-in.
7. Notification permission is requested only after that value step.
8. The account enters waiting, where permitted check-in, gift editing, invite status, expiry, and resend remain reachable.

### B. Invitee

1. A typed invitation URL or manually entered six-character code starts validation.
2. Pending invite intent survives the local auth/onboarding steps.
3. Valid, expired, revoked/used, not-found, and already-paired outcomes have distinct localized recovery.
4. The invitee enters quick profile details, confirms the inviter, and explicitly accepts.
5. Valid local acceptance changes local couple state to paired and exposes an attached gift. It does not imply that another device received a notification.
6. Paired Home is reached only through this transition; it is never seeded or selectable.

### C. Paired value loop

1. Home composes partner-visible status and current actions from feature services.
2. Check-in validates mood 1–5, at most three configured reasons, note up to 140 characters, and one of full/mood-only/private-only scopes.
3. Private-only content is not projected to the partner and creates no Nudge. Mood-only hides reasons and note from partner-facing views.
4. A shareable check-in may produce a local template Nudge. The user may act/edit/send, snooze once, skip, and submit feedback.
5. Tiny Moments support text, signal, photo, and voice within documented limits; drafts/failures have retry/recovery states. Reactions/replies use the same feature flow.
6. Profile, privacy, notification, support, export, unpair, sign-out, and deletion are reached through product navigation.

### D. Return and lifecycle

- With no persisted local session, a cold start begins clean at auth.
- During one app process, route from the active account/couple bootstrap snapshot.
- Sign-out clears the active session and account-scoped query cache, while feature-owned in-process records remain available for a later local sign-in or invite acceptance.
- Unpair/delete clear local couple scope and navigation intent immediately. Other-device revocation, server retention, and global deletion require backend integration.

## 9. Required UI states

| Area | Required states |
| --- | --- |
| App/session | Bootstrap/loading, signed out, active local session, invalid/expired session result, retryable bootstrap error. |
| Onboarding | Initial, field validation, optional skip, saved in current flow. |
| Invite/couple | No invite, creating, share-ready, waiting, expired/resend, invalid/not-found, revoked, used, already paired, accepted, recoverable error. |
| Check-in/status | Empty day, validation, saving, saved for current run, private confirmation, shared/mood-only projection, pending/offline, failure/retry. |
| Smart Nudge | None, available, template fallback, safety-priority, snoozed once, acted, skipped, feedback, expired, recoverable error. Never expose AI/provider errors. |
| Moments/media | Empty feed, composing, permission denied/unavailable, validation/size/duration error, pending/failed draft, retry, detail/reply/reaction, delete confirmation/result. |
| Notifications | Not requested, granted, denied, unavailable, setting changed, local reminder scheduled/cancelled. |
| Settings/lifecycle | Current profile, privacy explanation, export preparing/ready/error, two confirmation steps, unpaired, local cleanup result, cancellation. |
| Root | Recoverable render-error fallback with retry; no stack trace or sensitive payload. |

Rate limit, server 5xx, signed-upload expiry, token refresh failure, and remote sync conflicts remain represented by typed service outcomes and feature tests. They are not forced by a runtime scenario control.

## 10. Privacy, security, and unresolved policy

- Emotional state, notes, care preferences, invite tokens, media and message bodies are sensitive. Exclude them from logs, global session state, route query strings and analytics.
- Share-scope filtering is enforced at feature/service projection boundaries as well as the UI. Local filtering is not a production authorization control.
- Do not invent crisis contact content, legal copy, required-phone-login policy, retention policy, AI provider, deferred-link provider, or timezone streak policy; preserve unresolved decisions from product section 13.
- Do not activate the current SQLCipher helper unless SQLCipher is verified in the selected native build. Expo Go SQLite without encryption is not an acceptable durable store for sensitive records.
- Ask native permission just in time. Permission denial keeps text/check-in flows usable.
- User-visible copy remains localized and honest about local-only effects without labeling the app as a demo.

## 11. Testing and acceptance

### Test ownership

- Feature service/reducer/schema tests live with the feature and assert individual business transitions.
- One main-flow integration test exercises a clean start, inviter-to-waiting, invitee code acceptance, then paired flow via public feature interfaces.
- Fallback UI tests inject typed service outcomes or permission adapter results; they do not replace global app state.
- Preserve or rewrite useful auth, onboarding, invite, check-in, Nudge, Moment, settings, and lifecycle coverage at the owning feature boundary.
- Remove tests whose only assertion is scenario registry/seed generation, together with that scenario-only runtime.

### Acceptance criteria

1. Fresh launch reaches auth with no seeded account or pair.
2. Inviter reaches waiting only by completing documented user actions.
3. Invitee reaches paired Home only after entering a valid invite and explicitly accepting it.
4. Invalid/expired/revoked/used/already-paired invite outcomes have distinct recovery paths.
5. Private-only check-in creates no partner projection/Nudge; mood-only hides tags and note.
6. Nudge transitions and safe template fallback are covered without a scenario picker.
7. Moment limits, native permission denial, recoverable draft/retry, reply/reaction and deletion are covered.
8. Notification permission is not requested before first check-in; local setting/reminder outcomes are tested.
9. Account lifecycle confirmation/cancellation and local cleanup do not claim server-side deletion.
10. Empty/loading/pending/error/retry states remain tested with no scenario navigation in the app.
11. No single app-wide context/reducer owns all feature domain data and mutations.
12. Runtime source/copy contain no scenario registry/browser, DemoRuntimeProvider, demo media URI, canned demo credential, or local-demo text.
13. TypeScript typecheck, domain tests, and Expo configuration checks pass after implementation.

## 12. Deferred scope

- Real Apple/Google/SMS authentication and credential lifecycle.
- Backend REST/realtime and authoritative membership/privacy checks.
- Cross-device invitation acceptance and deferred deep-link provider.
- Server-created AI Nudge, template administration, crisis-resource configuration, remote push and notification policy.
- Server caps/quiet hours/reminders, signed media URLs, retention, export, unpair and account deletion.
- Durable encrypted offline check-in queue until SQLCipher is verified in the target native build.
- Optional “Nên có” and Phase 2 features.

## 13. Affected implementation surface

The later refactor must account for all current use sites, not only the central folder:

- **flamee-mobile/app/_layout.tsx**, **app/index.tsx**, and **app/providers/DemoRuntimeProvider.tsx**;
- feature screens currently importing **useDemoRuntime**;
- **flamee-mobile/src/demo/** types, reducer, service, seed, scenarios, scenario screen, and associated tests;
- **flamee-mobile/src/shared/navigation/resolveDemoRoute.ts**;
- profile/settings screens that expose or describe scenarios;
- demo-named media and notification adapters and their consumers;
- feature types/schemas currently importing Demo-prefixed domain types;
- demo-specific localization strings and local-only credentials.

This is a scope inventory, not an implementation sequence.

## 14. Review decisions

Please approve or revise these design choices before an implementation plan is written:

1. **Session-only local data:** cold restart resets business state; no unencrypted persistent sensitive data in Expo Go.
2. **Local authentication:** advances the workflow only; no claim of Apple, Google, or SMS identity verification.
3. **Local pairing:** invite acceptance works only against an invite held by the current in-process local services; it is not cross-device pairing.
4. **Feature ownership:** domain state/services/tests move to owning features; no src/demo, src/local-runtime, DemoRuntimeProvider, or RouterProvider replaces them.

No implementation plan, code changes, dependency changes, or backend integration are part of this spec.
