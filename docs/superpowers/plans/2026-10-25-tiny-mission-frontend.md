# Tiny Mission frontend implementation plan

**Goal:** Apply the approved Tiny Mission UI, title-only feature headers, and illustrated avatar fallbacks.

**Architecture:** Preserve the existing root header metadata/provider; branch its visual presentation for Home versus other features. Implement Tiny Mission as an explicitly labelled visual preview with local navigation/modal state only. Reuse the shared design system and localization; no backend mutations or mock services.

**Tech Stack:** Expo Router, React Native, Tamagui 2, TypeScript; existing clipboard adapter.

**Spec:** `.doc/TINY-MISSION.md` and `design/tiny-mission/v1/` (approved in conversation).

## Global constraints

- Preserve existing changes; no Git commands, destructive operations, backend writes, or dependency changes.
- Root remains sole header host; Home retains glass header and its behavior.
- All new controls come from shared; visual values belong in shared tokens, copy in vi/en resources.
- Preview content must not masquerade as real account data, real points, or a valid redemption code.
- Uploaded profile photos win over illustrated local fallbacks.

## Review focus

- Switching tabs must never leave the previous feature's header visible.
- Back navigation and safe-area spacing must remain usable on nested screens.
- Failed photo loading must fall back without changing the real profile.
- Preview actions must not award points or issue real rewards.
- Small screens must scroll, preserve bottom navigation clearance and modal close actions.

## Tasks

- [ ] Header: render plain black title/back row for non-Home routes in the existing provider. Verify provider/header tests and typecheck.
- [ ] Avatar: generate standalone local portrait assets; use shared avatar in profile, mood, feed, and navigation. Verify deterministic fallback and user-photo priority.
- [ ] Tiny Mission: add a feature with Today, Achievements (week/month), Rewards, detail/swap/redeem preview dialogs; rewire tasks route through its public export. Keep all domain writes unavailable and localization complete.
- [ ] Verify: run relevant and full domain tests, typecheck and web export; inspect a browser rendering if available. Document remaining native-device and backend work.

## Execution notes

User explicitly approved mockups and requested implementation; execute inline in the existing workspace. Do not create a worktree or commit without the repository's separate Git authorization. Frontend-first overrides the older roadmap's phase-2 deferral, but does not authorize fabricated backend success.
