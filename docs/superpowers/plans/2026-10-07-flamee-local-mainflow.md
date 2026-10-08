# Flamee Local Main-Flow Implementation Plan

> **For agentic workers:** Execute this plan inline, task by task. Steps use checkbox (`- [ ]`) syntax for tracking. Follow TDD for every behavior change. Do not run Git commands unless anh yêu explicitly authorizes the exact command.

**Goal:** Replace Flamee's scenario-driven runtime with the documented local-only product flow, with each feature owning its in-memory data, services, fallback outcomes, UI state, and tests.

**Architecture:** Keep Expo Router and the existing root infrastructure, but remove the app-wide product reducer/context. Auth, onboarding, invites/couple, check-ins/status, Nudges, Moments/media, notifications, profile/settings, and account lifecycle each expose typed public interfaces and local in-memory implementations. App routes compose those interfaces and keep only bootstrap/session identifiers in Zustand; TanStack Query is memory-only. A fresh JS process starts signed out, and no local result claims remote delivery, identity verification, synchronization, or deletion.

**Tech Stack:** React Native, Expo SDK 57 / Expo Go, TypeScript, Expo Router, Tamagui v2, TanStack Query, Zustand, React Hook Form, Zod, Expo SecureStore for actual secrets only, Expo SQLite left unused for sensitive records, Expo Notifications, ImagePicker, ImageManipulator, and Audio.

**Spec:** `.doc/FLAMEE-LOCAL-MAINFLOW-SPEC.md`; product traceability: `.doc/Tài liệu yêu cầu sản phẩm_ App kết nối cho cặp đôi.md` §§4.1–4.6 and 6, `.doc/Các luồng chính của app (bản đầu).md` flows 1–11, `.doc/FLAMEE-MOBILE-ARCHITECTURE.md`, `.doc/fe_skills/ARCHITECTURE-FE-SKILL.md`.

## Global Constraints

- Start from a clean signed-out process with no seeded account, pair, invite, check-in, Nudge, Moment, permission result, or artificial error.
- Keep sensitive local business data in memory only; a cold restart resets it. Do not persist it in SecureStore, AsyncStorage, plaintext SQLite, or a persisted Query cache.
- Keep domain state, types, validation, local services, hooks, and tests in their owning `src/features/<feature>`; no `src/demo`, `src/local-runtime`, global domain reducer/provider, `DemoRuntimeProvider`, or `RouterProvider`.
- App-level state is limited to bootstrap/session identifiers and transient navigation intent. Shared modules remain feature-neutral; feature consumers use public `index.ts` exports rather than private deep imports.
- Keep UI mobile-only, Tamagui v2/token-based, localized, safe-area aware, accessible, and honest about local-only effects. Never fabricate media URIs or claim remote effects.
- Keep Expo Go as the runtime. Do not activate SQLCipher code, add backend/API contracts, or add dependencies as part of this plan.
- Local auth advances the flow without verifying Apple, Google, or SMS identity. No hard-coded OTP, account, invite code, seeded role, or scenario switch is allowed.
- Invitation codes are six alphanumeric characters, single-use, and expire after 72 hours; recreating one invalidates the previous open invite.
- Check-in mood is 1–5, at most three configured reason IDs, note up to 140 characters, with explicit `full`, `mood_only`, or `private_only` scope. `private_only` never projects to the partner or creates a Nudge.
- Nudges enforce one snooze, 24-hour expiry, a maximum of three per recipient-local day, and suppression while an unresolved Nudge is under four hours old. Template/safety content is not represented as AI output.
- Tiny Moment limits are text ≤200 characters, caption ≤100 characters, voice ≤30 seconds, photo longest edge ≤1600 px and ≤2 MB after compression; never collect precise location.
- Request notification permission only after the first check-in. Remote push policy/delivery, backend, identity providers, cross-device pairing, AI provider, deferred-link recovery, and durable encrypted offline queue remain deferred.
- Optional “Nên có” and Phase 2 features remain out of this implementation scope.
- Repository permission rules prohibit Git commands and require explicit, exact authorization before deleting, moving, renaming, or overwriting whole files. Anh yêu explicitly approved the enumerated retirement paths and separately approved deleting `flamee-mobile/app/entryRoute.test.ts`; no commits are included in this plan.

## Review Focus

1. Two accounts accepting one invite concurrently or an already-paired account accepting it must not create an extra couple. Test in Task 2 with concurrent acceptance and distinct typed recovery results.
2. `private_only` must be invisible to the partner and create no Nudge; `mood_only` must structurally omit tags and note. Test both projection and Nudge creation in Tasks 3–4.
3. New process and sign-out behavior must not leak a previous local session or clear unrelated feature records prematurely. Test fresh service bootstrap and sign-out/cold-start boundaries in Task 1 and lifecycle cleanup in Task 7.
4. Native permission denial/unavailability must preserve text flows and must never create a pretend photo/audio URI. Test injected adapter outcomes in Task 5 and notification permission ordering in Task 6.
5. Pending/offline/error/expired states must render recovery actions without a scenario picker or false success. Test typed outcomes and state presenters in the owning Tasks 2–8.

---

### Task 1: Local authentication and clean app bootstrap

**Files:**
- Create: `flamee-mobile/src/features/auth/localAuthService.ts`
- Create: `flamee-mobile/src/features/auth/localAuthService.test.ts`
- Create: `flamee-mobile/app/entryRoute.ts`
- Modify: `flamee-mobile/src/features/auth/AuthScreen.tsx`
- Modify: `flamee-mobile/src/features/auth/schemas.ts`
- Modify: `flamee-mobile/src/features/auth/index.ts`
- Modify: `flamee-mobile/app/providers/SessionInitializer.tsx`
- Modify: `flamee-mobile/app/providers/sessionStore.ts`
- Modify: `flamee-mobile/app/_layout.tsx`

**Interfaces:**
- Produces `LocalSession = { accountId: string; createdAt: string }` and `LocalAuthService` methods `getCurrentSession(): Promise<LocalSession | null>`, `continueOnThisDevice(phone: string): Promise<LocalSession>`, and `signOut(): Promise<void>`.
- The auth service keeps its account lookup/session in a module-owned in-memory closure, keyed by normalized phone input only to let the same local account return during this process. It accepts injected `createAccountId` and `now` dependencies for deterministic tests.
- `resolveEntryRoute(snapshot)` accepts only `{ bootstrapped, accountId, onboardingStep, inviteIntent, coupleStatus }` and returns a typed Expo Router href. It must not import feature-private modules.
- `sessionStore` holds only bootstrap status and the active account/couple identifiers; it does not hold profile or product records.

- [ ] **Step 1: Write failing tests** `continueOnThisDevice_createsAnUnverifiedSession`, `getCurrentSession_startsSignedOut`, `signOut_clearsOnlyTheActiveSession`, `resolveEntryRoute_sendsFreshLaunchToAuth`, and `resolveEntryRoute_routesOnboardingWaitingAndPairedStates`.
- [ ] **Step 2: Run the auth and route tests** with `npm run test:domain -- src/features/auth/localAuthService.test.ts tests/localMainFlow.test.ts`; verify failures are missing service/resolver behavior, not test-runner errors.
- [ ] **Step 3: Implement the in-memory auth service and typed entry resolver** in the exact files above. Add an explicit local-only, unverified continuation in `AuthScreen`; Apple/Google must show unavailable status rather than authenticate falsely. Remove the canned OTP path without inventing a verification code.
- [ ] **Step 4: Wire the in-memory session bootstrap** through `SessionInitializer` and Zustand. Do not restore a local session from SecureStore. Correct the existing case mismatch by importing `./providers/QueryProvider` in `app/_layout.tsx` (the current baseline typecheck fails because the file is `QueryProvider.tsx`). Keep the legacy provider/root route wired until Tasks 2–7 migrate all consumers; Task 8 switches app entry and unmounts the provider as one integration change.
- [ ] **Step 5: Run the focused tests and `npm run typecheck`**. Expected: focused tests pass; the current TS1261 QueryProvider casing failure is gone, with any remaining compile errors reported and fixed before continuing.

### Task 2: Onboarding, invitations, and couple lifecycle

**Files:**
- Create: `flamee-mobile/src/features/onboarding/localOnboardingService.ts`
- Create: `flamee-mobile/src/features/onboarding/localOnboardingService.test.ts`
- Create: `flamee-mobile/src/features/invites/types.ts`
- Create: `flamee-mobile/src/features/invites/localInviteService.ts`
- Create: `flamee-mobile/src/features/invites/localInviteService.test.ts`
- Create: `flamee-mobile/src/features/couple/localCoupleService.ts`
- Create: `flamee-mobile/src/features/couple/localCoupleService.test.ts`
- Modify: `flamee-mobile/src/features/onboarding/OnboardingScreen.tsx`
- Modify: `flamee-mobile/src/features/onboarding/index.ts`
- Modify: `flamee-mobile/src/features/invites/InviteScreen.tsx`
- Modify: `flamee-mobile/src/features/invites/components/InviteGiftComposer.tsx`
- Modify: `flamee-mobile/src/features/invites/index.ts`
- Modify: `flamee-mobile/src/features/couple/WaitingScreen.tsx`
- Modify: `flamee-mobile/src/features/couple/PairedSuccess.tsx`
- Modify: `flamee-mobile/src/features/couple/index.ts`
- Modify: `flamee-mobile/app/(onboarding)/index.tsx`
- Modify: `flamee-mobile/app/(invite)/index.tsx`
- Modify: `flamee-mobile/app/(waiting)/index.tsx`

**Interfaces:**
- `LocalOnboardingService` exposes `getAccountSnapshot(accountId)`, `acceptConsent(accountId)`, `saveProfile(accountId, profile)`, `saveCarePreferences(accountId, preferences, note)`, and `saveRelationType(accountId, relationType)`; its record remains in memory.
- `LocalInviteService` exposes `createInvite(inviterId)`, `attachGift(inviteId, gift)`, `validateInvite(inviteeId, code)`, `acceptInvite(inviteeId, code)`, and `revokeOpenInvite(inviterId)`. Validation returns a discriminated union for `valid`, `expired`, `revoked`, `used`, `not_found`, and `already_paired`.
- `LocalCoupleService` exposes `getMembership(accountId)`, `acceptInvite({ inviteId, inviterId, inviteeId })`, `unpair(accountId)`, and `clearCouple(coupleId)`. Invite acceptance invokes this public interface; the invite feature does not import couple-private files.
- `InviteGift` is owned by `invites/types.ts`. Acceptance returns `{ coupleId, inviter, invitee, gift }`; Task 5 consumes a gift through a typed public result and delivers it as a Moment.
- Local invite intent is transient and in memory. Link/code parsing must not log or place invite tokens in analytics/query strings. Deferred post-install links are not implemented.

- [ ] **Step 1: Write failing tests** for consent/profile progression, optional care-preference skip, `createInvite_setsSixCharacterCodeAnd72HourExpiry`, `createInvite_replacesPreviousOpenInvite`, `validateInvite_returnsDistinctExpiredRevokedUsedAndNotFoundResults`, and `acceptInvite_allowsExactlyOneConcurrentAcceptance`.
- [ ] **Step 2: Run the onboarding and invite service tests** with `npm run test:domain -- src/features/onboarding/localOnboardingService.test.ts src/features/invites/localInviteService.test.ts src/features/couple/localCoupleService.test.ts`; verify expected missing API/transition failures.
- [ ] **Step 3: Implement feature-owned in-memory onboarding and couple repositories** and the public services. Ensure only one active couple per account and ensure failed acceptance leaves the invite reusable only when product rules allow it.
- [ ] **Step 4: Implement invitation creation, manual six-character entry, expiry/revocation/replacement, confirmation, and typed recovery UI**. Remove the preset `FLAMEE` shortcut and self-accept scenario affordance; preserve the inviter's waiting/check-in path and show the local-only limits honestly.
- [ ] **Step 5: Run the focused tests, existing feature schema tests, and `npm run typecheck`**. Expected: all invite result types map to a recovery path; no invite flow relies on scenario IDs or canned codes.

### Task 3: Check-ins and partner-visible status

**Files:**
- Create: `flamee-mobile/src/features/checkins/localCheckInService.ts`
- Create: `flamee-mobile/src/features/checkins/localCheckInService.test.ts`
- Modify: `flamee-mobile/src/features/checkins/types.ts`
- Modify: `flamee-mobile/src/features/checkins/schemas.ts`
- Modify: `flamee-mobile/src/features/checkins/index.ts`
- Modify: `flamee-mobile/src/features/checkins/CheckInComposer.tsx`
- Modify: `flamee-mobile/src/features/checkins/components/ShareScopePicker.tsx`
- Modify: `flamee-mobile/src/features/checkins/components/MoodSelector.tsx`
- Modify: `flamee-mobile/src/features/partner-status/types.ts`
- Modify: `flamee-mobile/src/features/partner-status/selectPartnerStatus.ts`
- Modify: `flamee-mobile/src/features/partner-status/selectPartnerStatus.test.ts`
- Modify: `flamee-mobile/src/features/partner-status/PartnerStatusCard.tsx`
- Modify: `flamee-mobile/src/features/partner-status/index.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`

**Interfaces:**
- Move `Mood`, `ShareScope`, and check-in domain records out of `src/demo/types.ts` into the check-ins feature without a `Demo` prefix. Replace `demoCheckInReasons` with a feature-owned local reason catalog based on documented labels; keep the service contract ready for server-configured reasons.
- `LocalCheckInService` exposes `listForAccount(accountId)`, `submit(accountId, input)`, `getLatestPartnerCheckIn(accountId)`, `getReasons()`, and `clearAccount(accountId)`. Submission results are `saved_local`, `pending`, or typed recoverable `error`; `saved_local` explicitly means current-process memory only.
- Partner status consumes only a share-filtered projection from the check-ins public API. `private_only` maps to no partner update; `mood_only` returns no reason IDs/note; the viewer sees partner time and date in the partner's configured timezone.

- [ ] **Step 1: Write failing tests** `submitCheckIn_rejectsMoreThanThreeReasonsAndLongNotes`, `privateOnlyCheckIn_neverProjectsToPartner`, `moodOnlyProjection_omitsReasonsAndNote`, `latestPartnerStatus_usesPartnerLocalDay`, and `pendingOrErrorSubmission_exposesRetryableOutcome`.
- [ ] **Step 2: Run the check-in/status tests** with `npm run test:domain -- src/features/checkins/localCheckInService.test.ts src/features/checkins/schemas.test.ts src/features/partner-status/selectPartnerStatus.test.ts`; verify failures match missing feature-owned state/projection.
- [ ] **Step 3: Implement the in-memory check-in service and feature-owned types**. Do not create a durable SQLite queue or simulate an acknowledged network send.
- [ ] **Step 4: Connect the composer and status card** to local feature APIs; render saved-local, pending/offline, validation, empty, and retryable-error states with accurate copy. Keep reasons configurable at the service boundary.
- [ ] **Step 5: Run the focused tests and `npm run typecheck`**. Expected: privacy projections are structural, not merely hidden by UI styling, and current-run storage is never described as server sync.

### Task 4: Smart Nudge lifecycle and safe template fallback

**Files:**
- Create: `flamee-mobile/src/features/nudges/localNudgeService.ts`
- Create: `flamee-mobile/src/features/nudges/localNudgeService.test.ts`
- Modify: `flamee-mobile/src/features/nudges/types.ts`
- Modify: `flamee-mobile/src/features/nudges/schemas.ts`
- Modify: `flamee-mobile/src/features/nudges/index.ts`
- Modify: `flamee-mobile/src/features/nudges/NudgeScreen.tsx`
- Modify: `flamee-mobile/src/features/nudges/components/NudgeCard.tsx`
- Modify: `flamee-mobile/src/features/nudges/components/NudgeFeedbackSheet.tsx`
- Modify: `flamee-mobile/src/features/checkins/CheckInComposer.tsx`
- Modify: `flamee-mobile/src/features/home/HomeScreen.tsx`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`

**Interfaces:**
- `Nudge` domain types live in `nudges/types.ts` with explicit `source: "template" | "safety"`; no local result uses `source: "ai"`.
- `LocalNudgeService` exposes `createForSharedCheckIn(input)`, `getForAccount(accountId, nudgeId)`, `act(nudgeId, draft?)`, `snooze(nudgeId)`, `skip(nudgeId)`, `rate(nudgeId, value, reason?)`, and `clearCouple(coupleId)`.
- The service accepts injected clock, local-day resolver, and template/safety-content providers. If product-approved safety configuration is absent, do not fall through to a lighthearted template or invent crisis contacts; expose an explicit support-content-unavailable state while retaining the documented direct-contact guidance.

- [ ] **Step 1: Write failing tests** for `privateOnlySource_neverCreatesNudge`, `unresolvedNudgeUnderFourHours_suppressesAnother`, `dailyLimitIsThreeInRecipientLocalTime`, `snoozeCanHappenOnlyOnce`, `nudgeExpiresAfter24Hours`, and `missingSafetyConfiguration_neverUsesOrdinaryTemplate`.
- [ ] **Step 2: Run the Nudge tests** with `npm run test:domain -- src/features/nudges/localNudgeService.test.ts src/features/nudges/schemas.test.ts`; confirm the expected transition failures.
- [ ] **Step 3: Implement the feature-owned local Nudge lifecycle** with deterministic template selection from existing authored copy only. Do not call an AI provider, expose provider errors, or claim a template was AI-generated.
- [ ] **Step 4: Wire check-in-triggered creation, Home entry, Nudge actions, feedback reasons, expiry, and the typed safety fallback**. Remove scenario-driven retry/action affordances and keep editable user-authored drafts.
- [ ] **Step 5: Run the focused tests and `npm run typecheck`**. Expected: action/edit routes open the correct composer; acted status is applied only after the linked Moment succeeds.

### Task 5: Tiny Moments, invite gifts, and real native media boundaries

**Files:**
- Create: `flamee-mobile/src/features/moments/localMomentService.ts`
- Create: `flamee-mobile/src/features/moments/localMomentService.test.ts`
- Create: `flamee-mobile/src/features/media/localMediaAdapter.ts`
- Create: `flamee-mobile/src/features/media/localMediaAdapter.test.ts`
- Modify: `flamee-mobile/src/features/moments/types.ts`
- Modify: `flamee-mobile/src/features/moments/schemas.ts`
- Modify: `flamee-mobile/src/features/moments/index.ts`
- Modify: `flamee-mobile/src/features/moments/MomentsScreen.tsx`
- Modify: `flamee-mobile/src/features/moments/MomentDetailScreen.tsx`
- Modify: `flamee-mobile/src/features/moments/components/MomentCard.tsx`
- Modify: `flamee-mobile/src/features/moments/components/MomentComposerSheet.tsx`
- Modify: `flamee-mobile/src/features/moments/components/VoiceDraftControl.tsx`
- Modify: `flamee-mobile/src/features/invites/components/InviteGiftComposer.tsx`
- Modify: `flamee-mobile/src/features/nudges/NudgeScreen.tsx`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`

**Interfaces:**
- `Moment` and media result types are owned by their features and no longer import `DemoMoment`/`DemoMediaResult`. `LocalMediaAdapter` returns `selected`, `denied`, `cancelled`, or `unavailable`—never a `fallbackUri`.
- `LocalMomentService` exposes `listForCouple(coupleId)`, `create(authorId, coupleId, draft, linkage?)`, `retry(momentId)`, `reply(momentId, draft)`, `react(momentId, userId, emoji)`, `delete(momentId, authorId)`, and `clearCouple(coupleId)`.
- The local service keeps records in memory; the media adapter uses actual Expo picker/manipulator/audio capabilities and temporary local files. Permission denial leaves text/signal composition available. Accepted invite gifts are emitted once as the first local Moment through the invite feature's typed public result.

- [ ] **Step 1: Write failing tests** `photoLimitsAreEnforcedAfterCompression`, `voiceIsCappedAt30SecondsAndCanBeReviewed`, `permissionDeniedKeepsTextAndSignalUsable`, `unavailableMediaNeverReturnsPlaceholderUri`, `momentReplyAndReactionKeepTheirParent`, `senderCanDeleteButRecipientCannot`, and `acceptedGiftIsDeliveredOnceAsMoment`.
- [ ] **Step 2: Run the Moment/media tests** with `npm run test:domain -- src/features/moments/localMomentService.test.ts src/features/moments/schemas.test.ts src/features/media/localMediaAdapter.test.ts`; confirm that failures are missing contracts or transitions.
- [ ] **Step 3: Implement local Moment storage and injectable native adapters**. Clean temporary media on cancel, delete, or completed handoff; do not claim local deletion revokes remote signed links.
- [ ] **Step 4: Connect composers, feed, details, replies/reactions/deletion, Nudge-linked drafts, and invite gifts**. Show empty/loading/pending/failure/retry/permission states and never substitute fake media.
- [ ] **Step 5: Run the focused tests and `npm run typecheck`**. Expected: real selected media works where Expo Go supports it; unsupported capabilities show a recoverable native state.

### Task 6: Notification preferences, native permission, and Home composition

**Files:**
- Create: `flamee-mobile/src/features/notifications/types.ts`
- Create: `flamee-mobile/src/features/notifications/localNotificationAdapter.ts`
- Create: `flamee-mobile/src/features/notifications/localNotificationAdapter.test.ts`
- Create: `flamee-mobile/src/features/notifications/index.ts`
- Modify: `flamee-mobile/src/features/profile-settings/NotificationSettingsScreen.tsx`
- Modify: `flamee-mobile/src/features/home/HomeScreen.tsx`
- Modify: `flamee-mobile/src/features/couple/WaitingScreen.tsx`
- Modify: `flamee-mobile/src/shared/navigation/notificationIntent.ts`
- Modify: `flamee-mobile/src/shared/navigation/notificationIntent.test.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`

**Interfaces:**
- `NotificationSettings` and permission result types live in the notifications feature. The native adapter exposes `getPermission()`, `requestPermission()`, `scheduleDailyReminder(time)`, `cancelDailyReminder()`, and `parseTap(payload)`.
- Local settings stay in feature-owned memory. OS notifications may schedule only the local daily check-in reminder. No remote categories, push delivery, quiet-hour server policy, caps, or device registration are claimed.

- [ ] **Step 1: Write failing tests** `permissionIsNotRequestedBeforeFirstCheckIn`, `deniedPermissionKeepsAppUsable`, `dailyReminderReschedulesOrCancelsFromSettings`, and `tapIntentAllowsOnlyTypedNudgeOrMomentIds`.
- [ ] **Step 2: Run the notification tests** with `npm run test:domain -- src/features/notifications/localNotificationAdapter.test.ts src/shared/navigation/notificationIntent.test.ts`; verify expected permission/order/payload failures.
- [ ] **Step 3: Implement preferences and Expo Notifications adapter** with an injected OS adapter for tests; request permission only after the first check-in, then schedule/cancel the local reminder according to settings.
- [ ] **Step 4: Wire Home and settings** to feature-owned status/actions, native permission result, and all empty/loading/success/denied/unavailable states. Do not use notification taps to trust arbitrary routes or payload text.
- [ ] **Step 5: Run focused tests, `npm run typecheck`, and `npx expo config --type public`**. Expected: valid Expo Go config and no pre-check-in notification prompt.

### Task 7: Profile/privacy, export/support, sign-out, unpair, and deletion

**Files:**
- Create: `flamee-mobile/src/features/profile-settings/localSettingsService.ts`
- Create: `flamee-mobile/src/features/profile-settings/localSettingsService.test.ts`
- Create: `flamee-mobile/src/features/account-lifecycle/localAccountLifecycleService.ts`
- Create: `flamee-mobile/src/features/account-lifecycle/localAccountLifecycleService.test.ts`
- Modify: `flamee-mobile/src/features/profile-settings/ProfileScreen.tsx`
- Modify: `flamee-mobile/src/features/profile-settings/SettingsScreen.tsx`
- Modify: `flamee-mobile/src/features/profile-settings/PrivacyScreen.tsx`
- Modify: `flamee-mobile/src/features/profile-settings/schemas.ts`
- Modify: `flamee-mobile/src/features/profile-settings/index.ts`
- Modify: `flamee-mobile/src/features/account-lifecycle/AccountLifecycleScreen.tsx`
- Modify: `flamee-mobile/src/features/account-lifecycle/schemas.ts`
- Modify: `flamee-mobile/src/features/account-lifecycle/index.ts`
- Modify: `flamee-mobile/src/features/account-lifecycle/components/DoubleConfirmDialog.tsx`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Modify: `flamee-mobile/app/(main)/profile.tsx`
- Modify: `flamee-mobile/app/settings/index.tsx`

**Interfaces:**
- `LocalSettingsService` owns profile/care/notification settings snapshots and edits through feature APIs; consent records retain only the current-process version and timestamp.
- `AccountLifecycleService` exposes `prepareLocalExport(accountId)`, `submitLocalSupportRequest(kind, message)`, `signOut(accountId)`, `unpair(accountId)`, and `deleteLocalAccount(accountId)`. It coordinates cleanup through feature public exports; it does not claim remote export, support delivery, partner notification, 30-day retention, or server deletion.
- Export contains only data present in current-process memory and is clearly labeled local-only. Support submission copy must say it has not been sent. Unpair/delete require two explicit confirmations; cancellation has no side effect.

- [x] **Step 1: Write failing tests** for settings validation/update, `localExportContainsOnlyCurrentMemoryData`, `unpairClearsCoupleScopeButKeepsOtherAccountScope`, `deleteClearsActiveAccountAndSession`, `cancelSecondConfirmationLeavesDataUntouched`, and `supportRequestDoesNotClaimRemoteDelivery`.
- [x] **Step 2: Run the lifecycle/settings tests** with `npm run test:domain -- src/features/profile-settings/localSettingsService.test.ts src/features/profile-settings/schemas.test.ts src/features/account-lifecycle/localAccountLifecycleService.test.ts`; verify missing cleanup/validation behaviors.
- [x] **Step 3: Implement settings and lifecycle services** using public feature cleanup functions in a narrow account-lifecycle coordinator; do not introduce a cross-feature reducer/store.
- [x] **Step 4: Wire profile/privacy/settings and logout/unpair/delete UI**. Keep user-readable local effect copy, anonymize neither unsupported data nor claim remote completion, and preserve the two-step confirmation/cancel path.
- [x] **Step 5: Run focused tests and `npm run typecheck`**. Expected: no product record appears in Zustand/SecureStore, and all scope cleanup tests pass.

### Task 8: Main-flow integration, fallback-state sweep, and runtime retirement

**Files:**
- Create: `flamee-mobile/tests/localMainFlow.test.ts`
- Create: `flamee-mobile/src/shared/components/asyncStateCopy.ts`
- Create: `flamee-mobile/src/shared/components/asyncStateCopy.test.ts`
- Modify: `flamee-mobile/app/_layout.tsx`
- Modify: `flamee-mobile/app/index.tsx`
- Modify: `flamee-mobile/src/features/home/HomeScreen.tsx`
- Modify: `flamee-mobile/src/features/profile-settings/SettingsScreen.tsx`
- Modify: `flamee-mobile/src/shared/components/AsyncStateView.tsx`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Delete only after explicit file-by-file authorization: the 22 legacy paths enumerated under **Retirement authorization** below.

**Interfaces:**
- The app-entry composition calls only feature public exports and resolves from the minimal bootstrap snapshot. Home composes feature-owned queries; it does not maintain a second copy of check-ins, Nudges, Moments, or settings.
- `tests/localMainFlow.test.ts` uses isolated, injected service instances to exercise fresh launch → inviter consent/profile/relation → invite/waiting → sign-out → distinct invitee local session/code acceptance → paired Home → scoped check-in/Nudge/Moment action → unpair. It never sets a global role or replaces app state with a fixture.
- Fallback UI states are reachable from normal typed service/permission outcomes and are tested at feature presenter/service boundaries. Fixtures remain inside feature tests only.
- `asyncStateCopy.ts` exports `AsyncStateVariant` and `getAsyncStateCopy(variant)` as a pure mapping used by `AsyncStateView`; it covers shared loading/empty/error/offline/permission/expired/success/pending states without importing native UI into Node tests.

- [x] **Step 1: Write the failing local main-flow integration test** `localMainFlow_requiresUserActionsAndClearsOnUnpair`, and `getAsyncStateCopy_returnsRecoveryCopyForEveryVariant` covering loading, empty, pending/offline, permission-denied, expired, error, and success variants. Feature service tests above cover typed outcomes and their recovery actions.
- [x] **Step 2: Run the integration/state tests** with `npm run test:domain -- tests/localMainFlow.test.ts`; confirm failure occurs because the feature-owned journey is not yet wired, not because imports/test runtime are broken.
- [x] **Step 3: Implement only the app-level orchestration needed to connect public feature APIs**. Remove scenario shortcuts/settings controls, revise local copy, and ensure fallback actions call real retries/refetches rather than `setScenario`.
- [x] **Step 4: After anh yêu explicitly approves every path below for deletion, remove the retired scenario runtime and old adapters/tests**. Do not use wildcard deletion; delete only the enumerated paths after all replacement imports/tests are green.
- [x] **Step 5: Run full verification** from `flamee-mobile/`: `npm run test:domain`, `npm run typecheck`, `npx expo install --check`, and `npx expo config --type public`. Expected: all tests/type/config checks exit 0 and runtime source has no scenario browser, scenario registry, demo provider, demo media URI, canned credential, or local-demo copy.
- [ ] **Step 6: Run an Expo Go smoke flow**: fresh launch → local unverified continuation → onboarding → inviter waiting/share → sign out → second local account enters the real displayed code → accepts → check-in privacy choices → Nudge action/edit/feedback → Moment text/media/denial and reply/reaction/delete → notification permission granted/denied and settings → export preview → sign out/unpair/delete confirmation/cancel. Record device-only gaps without claiming backend behavior.

**Step 6 verification note:** The iOS Expo Router bundle now returns HTTP 200 and Metro reports `iOS Bundled ... (4430 modules)` on port 8083. The 18,958,212-byte bundle contains neither `app/entryRoute.test.ts` nor its `node:assert/strict` / `node:test` imports. That file was deleted after anh yêu explicitly approved deletion; route assertions remain in `tests/localMainFlow.test.ts`. `npx expo install --check` and `npx expo config --type public` pass (SDK 57, iOS 16.4). No iOS/Android device or emulator is attached (`adb devices -l` is empty), so the interactive Expo Go smoke flow remains unverified.

#### Retirement authorization (exact paths; no deletion before separate explicit approval)

- `flamee-mobile/app/providers/DemoRuntimeProvider.tsx`
- `flamee-mobile/src/shared/navigation/resolveDemoRoute.ts`
- `flamee-mobile/src/shared/navigation/resolveDemoRoute.test.ts`
- `flamee-mobile/src/features/media/demoMediaAdapter.ts`
- `flamee-mobile/src/features/notifications/demoNotificationAdapter.ts`
- `flamee-mobile/src/demo/DemoScenarioScreen.tsx`
- `flamee-mobile/src/demo/accountLifecycleTransitions.test.ts`
- `flamee-mobile/src/demo/authTransitions.test.ts`
- `flamee-mobile/src/demo/checkinTransitions.test.ts`
- `flamee-mobile/src/demo/fullFlow.test.ts`
- `flamee-mobile/src/demo/inviteTransitions.test.ts`
- `flamee-mobile/src/demo/momentTransitions.test.ts`
- `flamee-mobile/src/demo/nudgeTransitions.test.ts`
- `flamee-mobile/src/demo/reducer.test.ts`
- `flamee-mobile/src/demo/reducer.ts`
- `flamee-mobile/src/demo/scenarios.test.ts`
- `flamee-mobile/src/demo/scenarios.ts`
- `flamee-mobile/src/demo/seed.ts`
- `flamee-mobile/src/demo/service.test.ts`
- `flamee-mobile/src/demo/service.ts`
- `flamee-mobile/src/demo/settingsTransitions.test.ts`
- `flamee-mobile/src/demo/types.ts`

The transition tests above are replaced with feature-owned tests before retirement. `scenarios.ts`, `scenarios.test.ts`, `DemoScenarioScreen.tsx`, and scenario-only reducer/seed coverage are not migrated; their behavior is intentionally removed. `app/entryRoute.test.ts` was separately approved and deleted because Expo Router includes files under `app/` in its route context; the route behavior assertions are covered from `tests/localMainFlow.test.ts` instead.

---

## Plan self-review

- **Spec coverage:** Auth/session and consent/profile are Task 1–2; invite/waiting/acceptance and typed recovery are Task 2; check-in privacy/timezone/local pending is Task 3; Nudge policy/fallback/safety is Task 4; Moment/media/reaction/reply/delete/gift is Task 5; permission/local reminder/tap routing is Task 6; profile/privacy/export/support/unpair/delete/logout is Task 7; root fallback/main flow/no scenario browser are Task 8. Backend, real providers, cross-device, AI, remote push, durable encrypted outbox, optional and Phase 2 features remain deferred per spec.
- **Step scan:** Every task has a test-first step, a focused test command, a specific service/adapter/UI implementation boundary, and a verification command. No task asks for a vague “handle edge cases” pass.
- **Type consistency:** IDs are account/couple/invite/nudge/moment strings; service methods are account/couple scoped; types are owned by feature folders and public exports. Invite acceptance returns an accepted gift payload for Task 5; check-in submission exposes an explicit result consumed by Task 3 UI; Nudge creation consumes the check-in public projection; account lifecycle clears scopes through public feature methods.
- **Review Focus:** All five rows map to named tests in Tasks 1–8. The no-crisis-content case is a typed unavailable state, not invented crisis information.
- **Proportion:** Eight tasks are necessary because each feature is independently owned and testable, while the final app flow depends on their interfaces. They share one spec because the goal is one local main-flow runtime refactor, not separate products.
- **Baseline evidence:** `npm run test:domain` currently passes 79/79 tests. `npm run typecheck` currently fails with TS1261 because `_layout.tsx` imports `queryProvider` while the file is `QueryProvider.tsx`; Task 1 corrects that exact import.
