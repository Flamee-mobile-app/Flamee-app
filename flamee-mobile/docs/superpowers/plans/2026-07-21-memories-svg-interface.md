# Memories SVG Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Memories Book screens so the Expo mobile interface faithfully matches the four supplied 402×874 SVG reference frames while retaining the feature's local-memory behavior.

**Architecture:** Keep route-local state in `useMemories` and leave data operations in `memoryService`. Screens own complete compositions, reusable visual elements remain presentational components, and all imports continue through `features/memories/index.ts` or the shared public modules.

**Tech Stack:** Expo Router, React Native, Expo Image, TypeScript, Jest, React Native Testing Library.

## Global Constraints

- Preserve the user's existing uncommitted changes and modify only the Memories feature files needed for the supplied interface.
- The 402×874 SVG is a visual reference, not a fixed runtime viewport; layouts must use `useWindowDimensions`, safe-area insets, scrolling, and bounded content widths.
- Use `@/shared/...` only for cross-feature primitives and `@/features/memories/...` for feature-owned code.
- Keep screens free of direct API calls; retain deterministic local data and reducer actions.
- Retain meaningful existing tests; remove only any throwaway test artifact created solely for this run.

---

### Task 1: Define the SVG-driven visual contract

**Files:**
- Modify: `features/memories/memoryLayout.ts`
- Modify: `features/memories/constants.ts`
- Test: `features/memories/components/MemoryControls.test.tsx`

**Consumes:** The four supplied SVG reference frames and the existing Flamee theme.

**Produces:** Centralized dimensions, chip labels, artwork mappings, and reusable style constants for overview, details, create, and edit views.

- [ ] **Step 1: Write a failing layout/controls test.**

  Assert that visible type, chip, and action labels are the Vietnamese labels from the SVG contract, and that the layout helper bounds phone content to the reference width rather than hardcoding a viewport.

- [ ] **Step 2: Run the focused test and verify it fails for the new reference behavior.**

  Run: `npm test -- features/memories/components/MemoryControls.test.tsx --runInBand`

  Expected: FAIL because the existing visual contract still uses the previous timeline vocabulary or dimensions.

- [ ] **Step 3: Add the smallest central layout and label changes.**

  Keep values in `MEMORY_LAYOUT`; expose helpers that use a maximum content width and avoid module-level screen dimensions. Add no component-specific duplicate dimensions.

- [ ] **Step 4: Re-run the focused test.**

  Run: `npm test -- features/memories/components/MemoryControls.test.tsx --runInBand`

  Expected: PASS.

### Task 2: Rebuild the memories-book overview and card grid

**Files:**
- Modify: `features/memories/components/MemoriesOverview.tsx`
- Modify: `features/memories/components/MemoryListCard.tsx`
- Modify: `features/memories/components/MemoryEmptyState.tsx`
- Test: `features/memories/components/MemoriesOverview.test.tsx`

**Consumes:** Task 1 layout constants, existing local memory data, and shared Flamee primitives.

**Produces:** The first SVG frame: Sổ kỉ niệm heading, status chips, two-column rounded photo cards, a centered floating action, and safe bottom-navigation clearance.

- [ ] **Step 1: Write failing overview assertions.**

  Assert the rendered title is `Sổ kỉ niệm`, the status chips are exposed with selected state, memory cards have accessible labels, and the add control remains available.

- [ ] **Step 2: Run the overview test and verify it fails.**

  Run: `npm test -- features/memories/components/MemoriesOverview.test.tsx --runInBand`

  Expected: FAIL because the existing heading/section composition is the previous timeline view.

- [ ] **Step 3: Implement the responsive overview composition.**

  Render the grid using container-derived widths, `Image` fills with overlay labels, semantic `Pressable` controls, and an absolute decorative floating action only. Keep filter/add/edit callbacks as props.

- [ ] **Step 4: Re-run the overview test.**

  Run: `npm test -- features/memories/components/MemoriesOverview.test.tsx --runInBand`

  Expected: PASS.

### Task 3: Match the detail and edit forms from the SVG

**Files:**
- Modify: `features/memories/screens/EditMemoryScreen.tsx`
- Modify: `features/memories/components/MemoryDetailsForm.tsx`
- Modify: `features/memories/components/MemoryChip.tsx`
- Test: `features/memories/screens/EditMemoryScreen.test.tsx`

**Consumes:** The selected local `MemoryDraft`, validation errors, shared TextField, and edit callbacks.

**Produces:** Detail-first edit UI matching the second and fourth SVG frames, with photo strip, title/date/place/description fields, tags, and Save/Delete actions.

- [ ] **Step 1: Write a failing edit-screen test.**

  Assert a selected memory renders its populated detail controls, exposes `Sửa` as the primary action, preserves text after a field change, and requests deletion without immediately mutating data.

- [ ] **Step 2: Run the edit test and verify it fails.**

  Run: `npm test -- features/memories/screens/EditMemoryScreen.test.tsx --runInBand`

  Expected: FAIL because the current form structure and labels do not yet match the SVG contract.

- [ ] **Step 3: Implement the form as a scrollable, keyboard-safe screen.**

  Use safe-area insets and `KeyboardAvoidingView`; make every field container-width responsive; show selected tags by state rather than color alone; keep delete confirmation explicit.

- [ ] **Step 4: Re-run the edit test.**

  Run: `npm test -- features/memories/screens/EditMemoryScreen.test.tsx --runInBand`

  Expected: PASS.

### Task 4: Rebuild the add-memory form and preserve reducer behavior

**Files:**
- Modify: `features/memories/screens/CreateMemoryScreen.tsx`
- Modify: `features/memories/screens/MemoriesScreen.tsx`
- Modify: `features/memories/hooks/useMemories.ts`
- Test: `features/memories/screens/CreateMemoryScreen.test.tsx`
- Test: `features/memories/hooks/useMemories.test.tsx`

**Consumes:** Existing schemas, reducer state, task 1 tokens, and the create modal wiring.

**Produces:** The third SVG frame's photo upload affordance, details fields, note counter, tag controls, and bottom Sửa/complete action, while retaining validation and local-state transitions.

- [ ] **Step 1: Write failing create-flow assertions.**

  Assert the reference labels `Thêm kỉ niệm mới`, `Thêm ảnh/ Video`, and `Mô tả kỉ niệm` render, and that submitting missing required values remains blocked with Vietnamese validation feedback.

- [ ] **Step 2: Run focused create and hook tests and verify the intended failure.**

  Run: `npm test -- features/memories/screens/CreateMemoryScreen.test.tsx features/memories/hooks/useMemories.test.tsx --runInBand`

  Expected: FAIL for the newly asserted SVG vocabulary or controls while existing reducer behavior remains intact.

- [ ] **Step 3: Implement the least invasive state-preserving UI adaptation.**

  Reuse the current drafts/schema and derive the visual form from them. Do not introduce network, device-permission, or cross-feature state; preserve cancellation, edit, and delete reducer transitions.

- [ ] **Step 4: Re-run focused create and hook tests.**

  Run: `npm test -- features/memories/screens/CreateMemoryScreen.test.tsx features/memories/hooks/useMemories.test.tsx --runInBand`

  Expected: PASS.

### Task 5: Validate feature integration and responsive safety

**Files:**
- Verify: `features/memories/**/*.test.tsx`
- Verify: `features/memories/**/*.test.ts`
- Verify: `app/(main)/memories.tsx`

**Consumes:** Tasks 1–4.

**Produces:** A tested route that renders the SVG-matched flow without overflow, clipped actions, or accidental changes outside the feature.

- [ ] **Step 1: Run all Memories tests.**

  Run: `npm test -- features/memories --runInBand`

  Expected: PASS.

- [ ] **Step 2: Run type and lint validation.**

  Run: `npx tsc --noEmit; npm run lint`

  Expected: no errors introduced by the feature changes.

- [ ] **Step 3: Review changed files and temporary artifacts.**

  Run: `git status --short; git diff --check`

  Expected: only intentional feature changes plus the user's pre-existing migration work; no whitespace errors or disposable test files.
