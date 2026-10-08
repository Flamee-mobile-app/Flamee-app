# Flamee Account and Couple Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete local-demo journey from welcome through authentication, onboarding, invite creation/acceptance and waiting/paired success.

**Architecture:** Each feature owns its schema and screen composition while all persistent-looking behavior goes through `DemoService`. Route files import one public feature screen and contain no business rules.

**Tech Stack:** Expo Router, Tamagui, React Hook Form, Zod, local demo runtime.

**Spec:** `docs/superpowers/specs/2026-10-06-flamee-local-demo-design.md`

## Global Constraints

- Maximum four main onboarding steps before first value.
- Notification permission is requested only after first check-in, never at launch.
- No age gate.
- Invite codes are six characters and expiry copy is non-technical.
- Optional profile/care/gift fields remain skippable.
- All account/couple operations are mock service mutations.

## Review Focus

- Empty/whitespace-only names fail validation without losing other fields.
- OTP expiry and resend produce a fresh accepted code state.
- Invite acceptance by an already-paired account is blocked with a recovery route.
- Expired/revoked/used invites show distinct copy and never enter confirmation.
- Back navigation cannot bypass consent or create duplicate couple state.

---

### Task 1: Auth and onboarding schemas/screens

**Files:**
- Create: `flamee-mobile/src/features/auth/schemas.ts`
- Create: `flamee-mobile/src/features/auth/AuthScreen.tsx`
- Create: `flamee-mobile/src/features/auth/index.ts`
- Create: `flamee-mobile/src/features/onboarding/schemas.ts`
- Create: `flamee-mobile/src/features/onboarding/OnboardingScreen.tsx`
- Create: `flamee-mobile/src/features/onboarding/index.ts`
- Modify: `flamee-mobile/app/(auth)/index.tsx`
- Modify: `flamee-mobile/app/(onboarding)/index.tsx`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/features/auth/schemas.test.ts`
- Test: `flamee-mobile/src/features/onboarding/schemas.test.ts`

**Interfaces:**
- Consumes: `useDemoRuntime`, shared UI primitives.
- Produces: `phoneSchema`, `otpSchema`, `profileSchema`, `carePreferencesSchema`, `AuthScreen`, `OnboardingScreen`.

- [ ] **Step 1: Write failing schema tests**

Assert Vietnamese phone normalization/validation, six-digit OTP, trimmed required display name, optional nickname/avatar, valid IANA timezone, up to six care choices and a 140-character note.

- [ ] **Step 2: Run schema tests and confirm failure**

Run: `npm run test:domain -- src/features/auth/schemas.test.ts src/features/onboarding/schemas.test.ts`  
Expected: FAIL because schemas do not exist.

- [ ] **Step 3: Implement schemas and exports**

Return inferred TypeScript types from Zod and keep copy out of schema internals where localized error mapping is required.

- [ ] **Step 4: Build Auth and Onboarding screens**

Auth states: welcome, provider choices, phone, OTP, invalid, expired and resend. Onboarding states: consent, profile, care preferences and relation type. Submit each transition through the demo service.

- [ ] **Step 5: Replace placeholder route adapters and verify**

Run: `npm run test:domain` and `npm run typecheck`  
Expected: PASS; route files only render public feature screens.

### Task 2: Invite creation and acceptance

**Files:**
- Create: `flamee-mobile/src/features/invites/schemas.ts`
- Create: `flamee-mobile/src/features/invites/InviteScreen.tsx`
- Create: `flamee-mobile/src/features/invites/components/InviteCodeCard.tsx`
- Create: `flamee-mobile/src/features/invites/components/InviteGiftComposer.tsx`
- Create: `flamee-mobile/src/features/invites/index.ts`
- Modify: `flamee-mobile/app/(invite)/index.tsx`
- Modify: `flamee-mobile/src/demo/reducer.ts`
- Modify: `flamee-mobile/src/demo/service.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/features/invites/schemas.test.ts`
- Test: `flamee-mobile/src/demo/inviteTransitions.test.ts`

**Interfaces:**
- Produces: `inviteCodeSchema`, `InviteScreen`; service methods `createInvite`, `lookupInvite`, `acceptInvite`, `revokeInvite`, `attachInviteGift`.

- [ ] **Step 1: Write failing invite tests**

Assert uppercase six-character codes; create sets 72-hour expiry; recreate revokes old invite; accept succeeds once; expired/revoked/used/already-paired produce distinct typed errors.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm run test:domain -- src/features/invites/schemas.test.ts src/demo/inviteTransitions.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement invite service transitions**

Keep token/code out of analytics/logging. Gift supports `text | photo | voice` with demo URI/text only.

- [ ] **Step 4: Build invite UI states**

Support create/share, gift skip/compose, manual code, validating, valid confirmation, expired, revoked, used, already paired and paired success. Use native `Share` only when the user presses share; failure retains visible code.

- [ ] **Step 5: Verify invite flow**

Run domain tests and typecheck; manually switch all invite scenario presets and confirm a recovery action.

### Task 3: Waiting flow and root routing

**Files:**
- Create: `flamee-mobile/src/features/couple/WaitingScreen.tsx`
- Create: `flamee-mobile/src/features/couple/PairedSuccess.tsx`
- Create: `flamee-mobile/src/features/couple/index.ts`
- Create: `flamee-mobile/src/shared/navigation/resolveDemoRoute.ts`
- Modify: `flamee-mobile/app/(waiting)/index.tsx`
- Modify: `flamee-mobile/app/index.tsx`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/shared/navigation/resolveDemoRoute.test.ts`

**Interfaces:**
- Produces: `resolveDemoRoute(state): DemoHref`, `WaitingScreen`, `PairedSuccess`.

- [ ] **Step 1: Write failing route resolution tests**

Assert signed-out → auth, consent/profile incomplete → onboarding, invite-required → invite, waiting → waiting, paired → main, and preserved valid invite intent → invite confirmation.

- [ ] **Step 2: Implement route resolver and root adapter**

The root uses only bootstrap/account/couple status and never grants authorization.

- [ ] **Step 3: Build waiting states**

Show countdown/status, share/resend, edit gift, pre-pair check-in entry, expiring/expired states and simulated partner acceptance.

- [ ] **Step 4: Verify both roles**

Run tests/typecheck, then walk inviter and invitee flows in Expo Go through paired success.

## Git Checkpoint

Do not execute Git automatically. If requested, ask permission for exact add/commit commands covering only this workstream.
