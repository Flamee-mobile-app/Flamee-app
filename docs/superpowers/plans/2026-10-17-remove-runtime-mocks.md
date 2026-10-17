# Remove runtime mocks Implementation Plan

> Execute inline in the existing checkout; no delegation, Git, live database writes, migrations, AI calls, or browser automation.

**Goal:** Remove simulated production success and recommend backend work before enabling missing features.

**Architecture:** Auth and invite APIs remain authoritative. Profile reads/writes use the existing authenticated API. Unsupported domain operations render unavailable states without local persistence or generated records. Native media utilities and test doubles are separate from fake domain services.

**Tech Stack:** Expo, TypeScript, Tamagui, FastAPI, Supabase.

**Spec:** Direct user request on 2026-10-17; AGENTS.md; .doc/QUY_CHUAN_GIAO_DIEN.md.

## Constraints and review focus

- Preserve existing UI controls, grouped Menu, real auth/invites and native adapters.
- Never convert network failures into local success, empty server lists, or forged couple state.
- Profile responses must belong to the active account; stale requests after logout must not repopulate state.
- Remove runtime in-memory business services and their obsolete simulator tests; retain pure validation/presentation tests and HTTP test doubles.
- Disable password recovery until real delivery exists; never return an OTP in an HTTP response.
- Do not claim native/device verification from static checks.

## Tasks

- [x] Add failing checks for legacy runtime simulation imports, authenticated profile updates, and disabled OTP recovery.
- [x] Remove local business simulators, mock premium, and their production callers. Keep missing capabilities explicitly unavailable, including old deep links.
- [x] Wire profile editing to authenticated API; preserve real logout and server-derived membership.
- [x] Remove backend mock OTP issuance/reset and test fail-closed behavior.
- [x] Update architecture/status docs and backend-first proposal with acceptance criteria.
- [x] Run domain tests, typecheck, backend tests; report limitations.
