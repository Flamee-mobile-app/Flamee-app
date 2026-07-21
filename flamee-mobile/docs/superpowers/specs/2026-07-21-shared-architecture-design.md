# Shared Architecture Migration

## Goal

Consolidate application-wide frontend code under `shared/`, move global CSS to `styles/global.css`, and make the frontend standards skill define a clear feature template and test-artifact cleanup rule.

## Target structure

```text
shared/
  components/ui/
  constants/
  hooks/
  layouts/
  types/
  lib/api/
  lib/navigation/
  store/
styles/
  global.css
```

`features/` remains domain-owned and independent. Expo Router routes stay in `app/`.

## Migration

- Move the existing root `components/ui`, `components/layout`, `constants`, `lib`, and `store` into the corresponding `shared` locations.
- Update all affected TypeScript imports to `@/shared/...`.
- Update `app/_layout.tsx`, `metro.config.js`, and Tailwind content paths for `styles/global.css` and `shared/components`.
- Add `shared/hooks/index.ts` and `shared/types/index.ts` as public extension points.
- Preserve all existing source and test files, including unrelated uncommitted work; only their import paths may change.

## Feature convention

New features use their own directory under `features/<feature>/` with `components/`, `hooks/`, `screens/`, `services/`, `types.ts`, and `index.ts`. Add `schemas/` only for validation and `store/` only for feature-local global state.

## Test cleanup

Temporary test files generated solely to support a development/testing run must be removed when that run is complete. Existing maintained tests and user-authored uncommitted tests are not temporary artifacts and must remain intact.

## Verification

Run TypeScript validation and the existing test suite after imports and configuration have been updated. No temporary test files will be created for this migration.
