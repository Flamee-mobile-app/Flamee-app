# Shared Architecture Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all application-wide frontend modules into `shared/`, relocate global CSS to `styles/`, and clarify the frontend development standards skill.

**Architecture:** Expo Router routes remain in `app/`, while feature-owned code remains in `features/`. Cross-feature UI, configuration, infrastructure, and global state move under `shared/` and are accessed through the `@/shared/...` alias. NativeWind continues to consume one CSS entry point, now `styles/global.css`.

**Tech Stack:** Expo Router, React Native, TypeScript, NativeWind, Tailwind CSS, Jest.

## Global Constraints

- Preserve all existing source files, maintained tests, and user-authored uncommitted changes; update only their import paths as required by the move.
- Do not create a temporary test file for this import/configuration-only migration.
- If a temporary test artifact is created during later feature work, delete it after the test run; retained test suites require explicit product value.
- New feature folders use `components/`, `hooks/`, `screens/`, `services/`, `types.ts`, and `index.ts`; use `schemas/` only for validation and `store/` only for feature-local global state.

---

### Task 1: Move the global style entry point

**Files:**
- Move: `global.css` → `styles/global.css`
- Modify: `app/_layout.tsx`
- Modify: `metro.config.js`
- Modify: `tailwind.config.js`

**Consumes:** NativeWind's existing CSS input and Expo root layout.

**Produces:** A single CSS source at `styles/global.css`, imported by the root layout and configured as the NativeWind input.

- [ ] **Step 1: Move the CSS file without changing its contents.**

  Apply a rename from `global.css` to `styles/global.css`.

- [ ] **Step 2: Point application startup to the new path.**

  In `app/_layout.tsx`, replace:

  ```ts
  import '../global.css';
  ```

  with:

  ```ts
  import '../styles/global.css';
  ```

- [ ] **Step 3: Update the NativeWind and Tailwind paths.**

  In `metro.config.js`, replace `input: './global.css'` with `input: './styles/global.css'`.

  In `tailwind.config.js`, replace the root component content glob with `./shared/components/**/*.{js,jsx,ts,tsx}`. Keep existing `app` and `features` globs unchanged.

- [ ] **Step 4: Run TypeScript validation.**

  Run: `npx tsc --noEmit`

  Expected: TypeScript completes without errors caused by the CSS relocation.

### Task 2: Consolidate shared modules and update consumers

**Files:**
- Move: `components/ui/` → `shared/components/ui/`
- Move: `components/layout/` → `shared/layouts/`
- Move: `constants/` → `shared/constants/`
- Move: `lib/` → `shared/lib/`
- Move: `store/` → `shared/store/`
- Modify: all TypeScript and TSX consumers of these moved modules, including existing test files.

**Consumes:** The `@/*` path alias defined in `tsconfig.json`.

**Produces:** Application-wide modules only under `shared/`, with no production import from the retired root module paths.

- [ ] **Step 1: Move each root shared module to its target directory.**

  Preserve file contents and names while applying these exact mappings:

  | Old import prefix | New import prefix |
  | --- | --- |
  | `@/components/ui` | `@/shared/components/ui` |
  | `@/components/layout` | `@/shared/layouts` |
  | `@/constants` | `@/shared/constants` |
  | `@/lib` | `@/shared/lib` |
  | `@/store` | `@/shared/store` |

- [ ] **Step 2: Update every affected import.**

  Rewrite imports in `app/`, `features/`, `shared/`, and all existing `*.test.ts`/`*.test.tsx` files to use the new prefixes. Relative imports internal to a moved directory remain unchanged.

- [ ] **Step 3: Verify no retired imports remain.**

  Run:

  ```powershell
  rg -n "@/(components|constants|lib|store)/" -g '!node_modules/**' -g '!dist/**' -g '*.{ts,tsx,js}' .
  ```

  Expected: no matches.

- [ ] **Step 4: Run TypeScript validation.**

  Run: `npx tsc --noEmit`

  Expected: TypeScript completes without unresolved-module errors.

### Task 3: Add shared extension points and rewrite frontend standards

**Files:**
- Create: `shared/hooks/index.ts`
- Create: `shared/types/index.ts`
- Modify: `skills/frontend-development-standards/SKILL.md`

**Consumes:** The target shared architecture and the existing `features/<feature>` convention.

**Produces:** Trackable shared extension directories and a concise, discoverable standard for all future frontend work.

- [ ] **Step 1: Add empty public extension points.**

  Create `shared/hooks/index.ts` and `shared/types/index.ts`, each containing:

  ```ts
  export {};
  ```

- [ ] **Step 2: Replace the frontend standards skill with concise structural rules.**

  The skill must contain valid YAML frontmatter named `frontend-development-standards` and a description that begins with `Use when...`. Its body must define:

  - the `shared/` directory responsibilities and allowed child folders;
  - the required new-feature template (`components`, `hooks`, `screens`, `services`, `types.ts`, `index.ts`);
  - conditional `schemas/` and `store/` folders;
  - no direct API calls in screens/components and no cross-feature deep imports;
  - the temporary generated-test cleanup rule, while retaining intentionally maintained tests.

- [ ] **Step 3: Inspect the skill for clarity and contradictions.**

  Run: `Get-Content -Raw skills/frontend-development-standards/SKILL.md`

  Expected: the structure, conditional folders, and test-artifact rule are explicit and do not conflict.

### Task 4: Verify the completed migration

**Files:**
- Verify: moved source files, changed import consumers, and `skills/frontend-development-standards/SKILL.md`

**Consumes:** Tasks 1–3.

**Produces:** A validated migration with no generated test artifacts.

- [ ] **Step 1: Run the project test suite.**

  Run: `npm test -- --runInBand`

  Expected: existing tests pass; any pre-existing failures are identified separately from this migration.

- [ ] **Step 2: Inspect the working tree.**

  Run: `git status --short`

  Expected: only the agreed shared/style/skill/import changes, plus the user’s pre-existing uncommitted work, are present.

- [ ] **Step 3: Confirm temporary-test cleanup.**

  Run:

  ```powershell
  git status --short | Select-String -Pattern '(^|\\s)\?\? .*\.test\.(ts|tsx)$'
  ```

  Expected: no newly generated temporary test files from this migration. Preserve any pre-existing user-authored test files.
