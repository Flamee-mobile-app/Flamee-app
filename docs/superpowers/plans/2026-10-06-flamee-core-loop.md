# Flamee Core Daily Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete local-demo loop of partner status, check-in, Smart Nudge, Tiny Moment and reaction.

**Architecture:** Check-in, Nudge and Moment own independent schemas and components, but interact through typed demo service methods. Home composes read models from these features without reaching into their private implementation.

**Tech Stack:** Expo Router, Tamagui, TanStack Query semantics, React Hook Form, Zod, Expo media modules with safe demo fallbacks.

**Spec:** `docs/superpowers/specs/2026-10-06-flamee-local-demo-design.md`

## Global Constraints

- Check-in: five moods, maximum three configured reasons, note maximum 140 characters, explicit full/mood-only/private-only scope.
- Private-only check-ins never update partner status or create a Nudge.
- Nudge actions are act/edit/later/skip; feedback supports 👍/👎 and the documented reasons.
- Text Moment maximum 200 characters; caption maximum 100; voice maximum 30 seconds.
- No precise location collection; place is plain user-entered text.
- UI never surfaces AI/provider errors.

## Review Focus

- Four selected check-in reasons must be rejected while preserving the first three selections.
- Mood-only partner status must omit reasons and note even when source check-in contains them.
- Replaying offline sync must not create duplicate check-ins or Nudges.
- A 30-second voice draft auto-stops and remains reviewable when native recording is unavailable.
- Deleting a Moment removes it from feed/detail and prevents later reactions/replies.

---

### Task 1: Check-in domain and composer

**Files:**
- Create: `flamee-mobile/src/features/checkins/types.ts`
- Create: `flamee-mobile/src/features/checkins/schemas.ts`
- Create: `flamee-mobile/src/features/checkins/CheckInComposer.tsx`
- Create: `flamee-mobile/src/features/checkins/components/MoodSelector.tsx`
- Create: `flamee-mobile/src/features/checkins/components/ShareScopePicker.tsx`
- Create: `flamee-mobile/src/features/checkins/index.ts`
- Modify: `flamee-mobile/src/demo/reducer.ts`
- Modify: `flamee-mobile/src/demo/service.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/features/checkins/schemas.test.ts`
- Test: `flamee-mobile/src/demo/checkinTransitions.test.ts`

**Interfaces:**
- Produces: `checkInSchema`, `CheckInInput`, `CheckInComposer`; service methods `submitCheckIn`, `retryQueuedCheckIns`, `setConnectivity`.

- [ ] **Step 1: Write failing schema and transition tests**

Assert mood 1–5, at most three configured reason IDs, note ≤140, valid scope; verify full/mood-only/private-only visibility, repeated daily check-ins, queue/send/fail/ack sequence and idempotency by client ID.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm run test:domain -- src/features/checkins/schemas.test.ts src/demo/checkinTransitions.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement check-in contracts and service transitions**

The service returns `{ kind: 'acknowledged', checkIn } | { kind: 'queued', clientId }`; never claim remote success for queued work.

- [ ] **Step 4: Build the three-step composer**

Mood → reasons/note → share scope/submit. Use server-like tags from demo config, explain partner visibility and expose sent/private/queued/failed/retry UI.

- [ ] **Step 5: Run tests and typecheck**

Expected: all PASS.

### Task 2: Partner status and Home

**Files:**
- Create: `flamee-mobile/src/features/partner-status/types.ts`
- Create: `flamee-mobile/src/features/partner-status/selectPartnerStatus.ts`
- Create: `flamee-mobile/src/features/partner-status/PartnerStatusCard.tsx`
- Create: `flamee-mobile/src/features/partner-status/index.ts`
- Create: `flamee-mobile/src/features/home/HomeScreen.tsx`
- Create: `flamee-mobile/src/features/home/index.ts`
- Modify: `flamee-mobile/app/(main)/index.tsx`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/features/partner-status/selectPartnerStatus.test.ts`

**Interfaces:**
- Consumes: latest partner check-in and viewer timezone.
- Produces: `selectPartnerStatus(checkIns, viewer): PartnerStatusView`, `PartnerStatusCard`, `HomeScreen`.

- [ ] **Step 1: Write failing visibility/time tests**

Assert no-update state, full fields, mood-only redaction, private-only exclusion, latest check-in wins, local time label and timezone difference label.

- [ ] **Step 2: Implement the selector**

Return a discriminated view model so UI cannot access hidden fields in mood-only/no-update variants.

- [ ] **Step 3: Build Home and partner card**

Compose date/greeting, partner card, primary next action, pending offline banner and one-tap “Nhớ bạn”. Keep wording neutral when partner has not updated.

- [ ] **Step 4: Verify**

Run test/typecheck and inspect no-update/full/mood-only scenarios.

### Task 3: Smart Nudge states and actions

**Files:**
- Create: `flamee-mobile/src/features/nudges/types.ts`
- Create: `flamee-mobile/src/features/nudges/schemas.ts`
- Create: `flamee-mobile/src/features/nudges/NudgeScreen.tsx`
- Create: `flamee-mobile/src/features/nudges/components/NudgeCard.tsx`
- Create: `flamee-mobile/src/features/nudges/components/NudgeFeedbackSheet.tsx`
- Create: `flamee-mobile/src/features/nudges/index.ts`
- Modify: `flamee-mobile/app/nudge/[nudgeId].tsx`
- Modify: `flamee-mobile/src/demo/reducer.ts`
- Modify: `flamee-mobile/src/demo/service.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/features/nudges/schemas.test.ts`
- Test: `flamee-mobile/src/demo/nudgeTransitions.test.ts`

**Interfaces:**
- Produces: `Nudge`, `nudgeSchema`, `NudgeScreen`; service methods `actOnNudge`, `snoozeNudge`, `skipNudge`, `rateNudge`.

- [ ] **Step 1: Write failing Nudge tests**

Assert field limits, valid action/tone/source, private check-in exclusion, maximum three per demo day, unresolved-under-four-hours suppression, 24-hour expiry, one snooze and feedback reasons.

- [ ] **Step 2: Implement Nudge domain/service transitions**

Seed generating, template fallback, crisis-safe, new, snoozed, acted, skipped and expired variants. AI failure is represented only as a valid template-source Nudge.

- [ ] **Step 3: Build Nudge UI**

Render observation/action/draft/reason, edit before send, action composer handoff, later/skip and feedback. Expired/error states include recovery.

- [ ] **Step 4: Replace route placeholder and verify**

Run all domain tests/typecheck and inspect each Nudge preset.

### Task 4: Tiny Moments feed, composer and detail

**Files:**
- Create: `flamee-mobile/src/features/moments/types.ts`
- Create: `flamee-mobile/src/features/moments/schemas.ts`
- Create: `flamee-mobile/src/features/moments/MomentsScreen.tsx`
- Create: `flamee-mobile/src/features/moments/MomentDetailScreen.tsx`
- Create: `flamee-mobile/src/features/moments/components/MomentComposerSheet.tsx`
- Create: `flamee-mobile/src/features/moments/components/MomentCard.tsx`
- Create: `flamee-mobile/src/features/moments/components/VoiceDraftControl.tsx`
- Create: `flamee-mobile/src/features/moments/index.ts`
- Create: `flamee-mobile/src/features/media/demoMediaAdapter.ts`
- Modify: `flamee-mobile/app/(main)/moments.tsx`
- Modify: `flamee-mobile/app/moment/[momentId].tsx`
- Modify: `flamee-mobile/src/demo/reducer.ts`
- Modify: `flamee-mobile/src/demo/service.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Test: `flamee-mobile/src/features/moments/schemas.test.ts`
- Test: `flamee-mobile/src/demo/momentTransitions.test.ts`

**Interfaces:**
- Produces: `Moment`, `MomentDraft`, schemas for text/caption/place/reply; `MomentsScreen`, `MomentDetailScreen`; service methods `createMoment`, `retryMoment`, `reactToMoment`, `replyToMoment`, `deleteMoment`.
- Media adapter produces typed `selected | denied | unavailable | cancelled` results and never collects coordinates.

- [ ] **Step 1: Write failing Moment tests**

Assert text ≤200, caption ≤100, voice ≤30 seconds, valid reactions, newest-first ordering, retry state, reply linkage, gift delivery and deletion preventing later mutation.

- [ ] **Step 2: Implement Moment schemas and transitions**

Use opaque local IDs and local URI only. Failed upload keeps a recoverable draft; deletion marks/removes consistently from list/detail selectors.

- [ ] **Step 3: Implement safe demo media adapter**

Wrap Expo picker/audio capability and normalize denied/unavailable/cancelled states. Provide an explicit mock placeholder result when the native capability is unavailable.

- [ ] **Step 4: Build feed/composer/detail UI**

Include Daily Prompt, empty/loading/refresh/error/end states; photo/voice/text/signal composer; six reactions; text/voice/photo reply; save affordance; sender-only two-step delete.

- [ ] **Step 5: Replace route placeholders and verify**

Run all tests/typecheck and walk Nudge “Làm ngay” → Moment sent → partner reaction.

## Git Checkpoint

Do not execute Git automatically. If requested, ask permission for exact add/commit commands covering only this workstream.
