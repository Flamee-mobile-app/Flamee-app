# Flamee Settings, Scenarios and Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete profile/settings/privacy/account lifecycle, expose the full scenario matrix, and verify the entire local demo end to end.

**Architecture:** Settings screens update the same typed demo runtime used by product flows. Scenario tooling is isolated under `src/demo` and visibly labeled; integration tests drive pure service/reducer APIs through the complete value loop.

**Tech Stack:** Expo Router, Tamagui, React Hook Form, Zod, Expo Notifications permission adapter, Node 24 test runner.

**Spec:** `docs/superpowers/specs/2026-10-06-flamee-local-demo-design.md`

## Global Constraints

- Settings include profile, care preferences, notification A–H, quiet hours, privacy mode, pause 1/8/24 hours, privacy explainer, consent record, export, support, unpair and delete account.
- Unpair/delete always use two confirmations.
- Export demo shows JSON preview and never claims a ZIP was created.
- Scenario tooling is accessible from Profile and marked local demo only.
- All couple-scoped mock data is cleared on unpair/delete/account switch.

## Review Focus

- Quiet hours crossing midnight remain valid and render correctly.
- Notification denial keeps settings understandable and exposes OS-settings guidance without blocking core features.
- Unpair clears couple data while keeping the user's own eligible export state.
- Account deletion resets credentials/session/demo data and returns to Welcome.
- Scenario reset after nested edits reproduces the exact default seed.

---

### Task 1: Profile and notification settings

**Files:**
- Create: `flamee-mobile/src/features/profile-settings/schemas.ts`
- Create: `flamee-mobile/src/features/profile-settings/ProfileScreen.tsx`
- Create: `flamee-mobile/src/features/profile-settings/SettingsScreen.tsx`
- Create: `flamee-mobile/src/features/profile-settings/NotificationSettingsScreen.tsx`
- Create: `flamee-mobile/src/features/profile-settings/PrivacyScreen.tsx`
- Create: `flamee-mobile/src/features/profile-settings/index.ts`
- Create: `flamee-mobile/src/features/notifications/demoNotificationAdapter.ts`
- Modify: `flamee-mobile/app/(main)/profile.tsx`
- Modify: `flamee-mobile/app/settings/index.tsx`
- Modify: `flamee-mobile/src/demo/reducer.ts`
- Modify: `flamee-mobile/src/demo/service.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/features/profile-settings/schemas.test.ts`
- Test: `flamee-mobile/src/demo/settingsTransitions.test.ts`

**Interfaces:**
- Produces: profile/care/notification schemas; `ProfileScreen`, `SettingsScreen`; service methods `updateProfile`, `updateCarePreferences`, `updateNotificationSettings`, `pauseNotifications`.

- [ ] **Step 1: Write failing settings tests**

Assert valid profile fields, reminder/quiet hours, all A–H toggles, privacy mode, 1/8/24-hour pause, permission not-requested/granted/denied and cross-midnight quiet hours.

- [ ] **Step 2: Implement schemas, settings transitions and notification adapter**

Adapter exposes `getPermission` and `requestPermission` with normalized states. Request is called only by explicit post-value/settings action.

- [ ] **Step 3: Build Profile and Settings UI**

Profile groups Hồ sơ, Quan tâm, Thông báo, Quyền riêng tư, Dữ liệu, Hỗ trợ and Kịch bản demo. Settings use localized forms, banners and recovery actions.

- [ ] **Step 4: Build “Ai thấy gì” and consent record UI**

Explain full/mood-only/private-only, AI data boundaries and mock consent version/time without adding policy not in the spec.

- [ ] **Step 5: Verify**

Run settings tests and typecheck; inspect all permission states.

### Task 2: Export, support, unpair and delete account

**Files:**
- Create: `flamee-mobile/src/features/account-lifecycle/schemas.ts`
- Create: `flamee-mobile/src/features/account-lifecycle/AccountLifecycleScreen.tsx`
- Create: `flamee-mobile/src/features/account-lifecycle/components/DoubleConfirmDialog.tsx`
- Create: `flamee-mobile/src/features/account-lifecycle/index.ts`
- Modify: `flamee-mobile/src/features/profile-settings/SettingsScreen.tsx`
- Modify: `flamee-mobile/src/demo/reducer.ts`
- Modify: `flamee-mobile/src/demo/service.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/demo/accountLifecycleTransitions.test.ts`

**Interfaces:**
- Produces: service methods `requestExport`, `advanceExport`, `submitSupportRequest`, `unpair`, `deleteAccount`; reusable `DoubleConfirmDialog`.

- [ ] **Step 1: Write failing lifecycle tests**

Assert export requested → preparing → ready/expired/error, support success/error, unpair scoped cleanup, delete full reset and two-confirmation action guard.

- [ ] **Step 2: Implement service transitions**

Ready export returns a sanitized in-memory JSON preview. Unpair/delete clear relevant QueryClient caches through the calling screen after service acknowledgement.

- [ ] **Step 3: Build lifecycle UI**

Include export preview/error/retry, support forms, neutral unpair explanation and destructive double confirmation for unpair/delete.

- [ ] **Step 4: Verify**

Run tests/typecheck and confirm destructive actions alter only mock runtime.

### Task 3: Scenario control and notification deep-link simulation

**Files:**
- Create: `flamee-mobile/src/demo/DemoScenarioScreen.tsx`
- Create: `flamee-mobile/src/shared/navigation/notificationIntent.ts`
- Modify: `flamee-mobile/src/features/profile-settings/ProfileScreen.tsx`
- Modify: `flamee-mobile/src/demo/scenarios.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/demo/scenarios.test.ts`
- Test: `flamee-mobile/src/shared/navigation/notificationIntent.test.ts`

**Interfaces:**
- Produces: `DemoScenarioScreen`, `parseNotificationIntent(payload): NotificationIntent | null`.

- [ ] **Step 1: Write failing scenario and notification tests**

Assert every spec preset resolves to a valid fresh state; unknown preset falls back safely; allowlisted `nudge`/`moment` payloads map to typed destinations; arbitrary paths and missing IDs are rejected.

- [ ] **Step 2: Complete the scenario catalog**

Cover signed-out/onboarding/invite/waiting/paired/check-in/Nudge/Moment/permission/export/network/session/unexpected-error states from spec §8.

- [ ] **Step 3: Build scenario screen**

Group presets by feature, show current scenario, apply/reset actions and a permanent “Local demo” label. Switching a preset replaces the full runtime state.

- [ ] **Step 4: Add notification simulation**

From scenario tooling, simulate valid Nudge/Moment taps and navigate only from parsed allowlisted intent.

- [ ] **Step 5: Verify**

Run all tests/typecheck and open every scenario preset.

### Task 4: End-to-end domain verification and Expo Go walkthrough

**Files:**
- Create: `flamee-mobile/src/demo/fullFlow.test.ts`
- Modify: `flamee-mobile/README.md`

**Interfaces:**
- Consumes: all service/reducer APIs.
- Produces: repeatable inviter/invitee domain-flow tests and local demo instructions.

- [ ] **Step 1: Write the full-flow test**

Drive welcome → mock login → consent/profile/care/relation → invite → accept → first check-in → permission state → partner check-in → Nudge act → Moment send → reaction → unpair. Assert visibility/scoped cleanup at each boundary.

- [ ] **Step 2: Run all automated verification**

Run: `npm run test:domain`  
Expected: every test PASS.

Run: `npm run typecheck`  
Expected: exit 0.

Run: `npx expo install --check`  
Expected: dependencies are up to date.

Run: `npx expo config --type public`  
Expected: exit 0, SDK 57 and iOS deployment target 16.4.

- [ ] **Step 3: Document the demo walkthrough**

Document `npm start`, default credentials/OTP, scenario screen location, reset behavior, mock-only limitations and the exact core-loop walkthrough. Do not claim backend, encryption, realtime or push delivery is production-ready.

- [ ] **Step 4: Perform Expo Go walkthrough**

Open on a representative phone/emulator and verify inviter/invitee flows, all state presets, keyboard/back/safe area, dynamic text, permission fallbacks and notification mock routing. Record any environment-only limitation in the final handoff.

## Git Checkpoint

Do not execute Git automatically. If requested, ask permission for exact add/commit commands covering only this workstream.
