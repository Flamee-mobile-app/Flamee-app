# Flamee Local Demo Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Flamee required MVP as an interactive Expo Go demo backed by deterministic local mock state and complete UI states.

**Architecture:** Implement one shared typed demo runtime, then layer account/couple flows, the core daily loop, and settings/scenario tooling on top. Route files remain thin and every mock boundary uses a service interface that can later be replaced by backend implementations.

**Tech Stack:** React Native 0.86, Expo SDK 57, Expo Router, TypeScript 6, Tamagui 2.7.7, TanStack Query, Zustand, React Hook Form, Zod, Node 24 test runner.

**Spec:** `docs/superpowers/specs/2026-10-06-flamee-local-demo-design.md`

## Global Constraints

- Mobile only; no DOM, browser router, HTML form, localStorage, or web-only UI assumptions.
- Expo SDK 57, iOS deployment target 16.4, Android 8 or newer.
- Providers stay in `flamee-mobile/app/providers`.
- Feature code uses Tamagui longhand props and semantic tokens; icons come from `@tamagui/lucide-icons-2`.
- All user-facing text is Vietnamese-first and read from localization resources.
- The demo makes no backend request, never imports `encryptedDatabase.ts`, and persists no sensitive mock content.
- Reload resets to deterministic seed data; scenario switching is explicitly labeled local demo behavior.
- Do not add widget, streak, or Phase 2 product screens.
- Do not run Git commands, delete/move/rename files, or overwrite whole files without the user's specific permission.

## Review Focus

- Private-only and mood-only check-ins must never expose hidden note/reason fields to partner-facing state.
- Switching account/couple scenarios must clear or replace every scoped object, not leak the prior couple's data.
- Expired/revoked/used invites and already-paired accounts must remain recoverable without trapping navigation.
- Permission denial and native media unavailability must keep text/check-in flows functional.
- Offline queued mutations must never claim server acknowledgement and must reconcile exactly once when simulated connectivity returns.

---

## Workstream Order

1. `2026-10-06-flamee-foundation-runtime.md`
2. `2026-10-06-flamee-account-couple-flows.md`
3. `2026-10-06-flamee-core-loop.md`
4. `2026-10-06-flamee-settings-integration.md`

Each workstream ends in a separately testable application state. Execute them in order because later screens consume interfaces defined by the demo runtime and shared UI foundation.

### Task 1: Foundation and typed demo runtime

**Files:** See `docs/superpowers/plans/2026-10-06-flamee-foundation-runtime.md`.

**Interfaces:**
- Produces: `DemoState`, `DemoAction`, `demoReducer`, `DemoService`, `useDemoRuntime`, shared UI primitives, test command.

- [ ] Implement and verify the foundation plan.
- [ ] Run `npm run test:domain` and expect all foundation domain tests to pass.
- [ ] Run `npm run typecheck` and expect exit code 0.

### Task 2: Account and couple lifecycle

**Files:** See `docs/superpowers/plans/2026-10-06-flamee-account-couple-flows.md`.

**Interfaces:**
- Consumes: foundation runtime, shared UI, localization.
- Produces: auth/onboarding/invite/waiting screens and route adapters.

- [ ] Implement and verify the account/couple plan.
- [ ] Walk through inviter and invitee branches in Expo Go.
- [ ] Run domain tests and typecheck.

### Task 3: Daily connection loop

**Files:** See `docs/superpowers/plans/2026-10-06-flamee-core-loop.md`.

**Interfaces:**
- Consumes: authenticated paired state and runtime services.
- Produces: Home, check-in, Nudge, Moments and detail/composer flows.

- [ ] Implement and verify the core-loop plan.
- [ ] Walk through check-in → Nudge → Moment → reaction for both demo roles.
- [ ] Run domain tests and typecheck.

### Task 4: Settings, scenario matrix and integration verification

**Files:** See `docs/superpowers/plans/2026-10-06-flamee-settings-integration.md`.

**Interfaces:**
- Consumes: all feature state/actions.
- Produces: profile/settings/account lifecycle, scenario control, integration tests and final verification evidence.

- [ ] Implement and verify the settings/integration plan.
- [ ] Run every scenario preset and confirm a recovery action is present.
- [ ] Run `npm run test:domain`, `npm run typecheck`, `npx expo install --check`, and `npx expo config --type public`.

## Git Checkpoints

No Git command is authorized by this plan. If checkpoints are wanted, request permission immediately before each exact `git add`/`git commit` command and list its files. Implementation and verification do not depend on Git.
