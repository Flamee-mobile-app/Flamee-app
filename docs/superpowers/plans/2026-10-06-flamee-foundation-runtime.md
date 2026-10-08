# Flamee Foundation and Demo Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the typed, deterministic local runtime and reusable Tamagui UI foundation consumed by every Flamee demo feature.

**Architecture:** Keep pure state transitions in `src/demo` so they are testable with Node's built-in runner. Expose async mock behavior through a service and mount it from a provider under `app/providers`; screens consume a stable context API rather than touching seed data.

**Tech Stack:** TypeScript, React 19, Expo Router, Tamagui 2.7.7, Zod, Node 24 test runner.

**Spec:** `docs/superpowers/specs/2026-10-06-flamee-local-demo-design.md`

## Global Constraints

- No new dependency and no package-lock change.
- No import or call to `src/shared/native/encryptedDatabase.ts`.
- Demo state is memory-only and resettable.
- Shared components contain no feature business logic.
- Tamagui longhand props and existing tokens only.
- User-visible copy comes from `src/shared/localization/messages.ts`.

## Review Focus

- Unknown scenario IDs fall back to the default seed instead of crashing.
- Queued state cannot transition directly to acknowledged without a sending transition.
- Reset returns a fresh object and does not retain mutated nested arrays.
- Provider access outside the provider throws a developer-facing invariant without exposing user data.
- Large text and compact phone widths do not hide the primary recovery action.

---

### Task 1: Domain test harness and runtime contracts

**Files:**
- Modify: `flamee-mobile/package.json`
- Modify: `flamee-mobile/tsconfig.json`
- Create: `flamee-mobile/src/demo/types.ts`
- Create: `flamee-mobile/src/demo/seed.ts`
- Create: `flamee-mobile/src/demo/reducer.ts`
- Test: `flamee-mobile/src/demo/reducer.test.ts`

**Interfaces:**
- Produces: `DemoScenarioId`, `DemoState`, `DemoAction`, `createDemoSeed(scenario?: DemoScenarioId): DemoState`, `demoReducer(state: DemoState, action: DemoAction): DemoState`.

- [ ] **Step 1: Add the domain test command**

Add `test:domain` as `node --test --experimental-strip-types` and enable `allowImportingTsExtensions` under the existing no-emit TypeScript configuration. Node 24 discovers `**/*.test.ts` automatically while type stripping is enabled.

- [ ] **Step 2: Write failing reducer tests**

Cover fresh default/reset objects, unknown scenario fallback, role switch, connectivity change, ordered outbox transitions, and account/couple scoped reset.

- [ ] **Step 3: Run the test and confirm failure**

Run: `npm run test:domain -- src/demo/reducer.test.ts`  
Expected: FAIL because runtime contracts are not implemented.

- [ ] **Step 4: Implement runtime types, deterministic seeds and reducer**

Use discriminated unions for account state, invite status, check-in sync state, Nudge status, Moment status, permission state and export state. Seed every array/object from factory functions so reset never reuses mutable references.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm run test:domain` and `npm run typecheck`  
Expected: all tests PASS and TypeScript exits 0.

### Task 2: Async mock service and provider

**Files:**
- Create: `flamee-mobile/src/demo/service.ts`
- Create: `flamee-mobile/src/demo/scenarios.ts`
- Create: `flamee-mobile/app/providers/DemoRuntimeProvider.tsx`
- Modify: `flamee-mobile/app/_layout.tsx`
- Test: `flamee-mobile/src/demo/service.test.ts`

**Interfaces:**
- Consumes: `DemoState`, `DemoAction`, `createDemoSeed`, `demoReducer` from Task 1.
- Produces: `DemoService`, `createDemoService(options): DemoService`, `useDemoRuntime(): DemoRuntimeValue`, `DEMO_SCENARIOS`.
- `DemoRuntimeValue` exposes `{ state, dispatch, service, setScenario(id), reset() }`.

- [ ] **Step 1: Write failing service tests**

Assert deterministic latency completion, mapped error codes, offline mutation rejection/queue result, exactly-once check-in reconciliation, scenario lookup and reset.

- [ ] **Step 2: Run the service test and confirm failure**

Run: `npm run test:domain -- src/demo/service.test.ts`  
Expected: FAIL because service/provider APIs do not exist.

- [ ] **Step 3: Implement the service and scenario catalog**

The service accepts injected `getState`/`dispatch` and returns Promises. Do not use `fetch`, timers longer than 400 ms, storage, logs, or native APIs.

- [ ] **Step 4: Implement and mount `DemoRuntimeProvider`**

Mount it inside `QueryProvider` and before route content. Keep all provider code under `app/providers`.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm run test:domain` and `npm run typecheck`  
Expected: PASS.

### Task 3: Shared Tamagui application primitives

**Files:**
- Create: `flamee-mobile/src/shared/components/AppScreen.tsx`
- Create: `flamee-mobile/src/shared/components/AppHeader.tsx`
- Create: `flamee-mobile/src/shared/components/AppButton.tsx`
- Create: `flamee-mobile/src/shared/components/AppField.tsx`
- Create: `flamee-mobile/src/shared/components/ChoiceChip.tsx`
- Create: `flamee-mobile/src/shared/components/SectionCard.tsx`
- Create: `flamee-mobile/src/shared/components/AsyncStateView.tsx`
- Create: `flamee-mobile/src/shared/components/StatusBanner.tsx`
- Create: `flamee-mobile/src/shared/components/index.ts`
- Modify: `flamee-mobile/src/shared/localization/messages.ts`
- Modify: `flamee-mobile/src/shared/constants/tokens.ts`
- Modify: `flamee-mobile/tamagui.config.ts`

**Interfaces:**
- Produces: typed button variants, field error/help props, selectable chips, state variants `loading | empty | error | offline | permission | expired | success`, and safe-area/scrolling screen composition.

- [ ] **Step 1: Add missing semantic tokens**

Add surface, border, muted, overlay and five accessible mood tokens centrally; do not add raw colors inside screens.

- [ ] **Step 2: Build focused shared primitives**

Each component owns only visual/accessibility behavior. `AsyncStateView` requires a localized title, description and optional recovery action.

- [ ] **Step 3: Add shared localization keys**

Add navigation, retry, cancel, continue, save, loading, offline, permission, expired and success copy in both `vi` and `en`; Vietnamese remains the active locale.

- [ ] **Step 4: Verify the foundation**

Run: `npm run typecheck`, `npm run test:domain`, `npx expo config --type public`  
Expected: all exit 0 and Expo reads SDK 57/iOS 16.4.

## Git Checkpoint

Do not execute Git automatically. If requested, ask permission for exact add/commit commands covering only this workstream.
