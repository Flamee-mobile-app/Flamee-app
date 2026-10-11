# Optional onboarding and pairing implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline. This session preserves the existing workspace; no Git operations or test suites are authorized by the current task.

**Goal:** Login reaches optional setup; every setup step can enter usable Home, invitation acceptance creates a one-time popup, and pairing reminders support 24-hour snooze or session dismissal.

**Architecture:** Keep profile/setup in onboarding, invitation payload/intent/notices in invites, membership/reminder preferences in couple. Shared session stores only account/couple/session metadata. Routes compose screens; public domain exports avoid importing screen barrels at bootstrap.

**Tech Stack:** Expo Router with URL ingress, React Native, Tamagui 2, Zustand, TypeScript, Zod and current native media adapters.

**Spec:** ../ONBOARDING-PAIRING-FLOW.md

## Global constraints

- Memory-only domain records; no backend writes, dependencies, verified fake accounts or media.
- All setup steps can be deferred to Home; consent is recorded only after an explicit action.
- Invitations: six characters, 72 hours; messages 200 characters, photo captions 100, voice 30 seconds.
- UI uses shared tokens, longhand props, vi/en copy and no repeated entrance animations.
- Tạm ẩn lasts 24 hours. Session mute ends at sign-out; viewed pairing popup does not replay in the same process.
- No tests added/run under developer instruction. Static typechecking is separate from runtime verification.

## Review focus

1. Shared index paths must not return auth to its own route group.
2. Skip must not fabricate consent or profile completion, including later profile/check-in use.
3. Pending link must survive auth without automatic pairing or leaking credentials into internal route params.
4. Acceptance success must remain success if optional gift presentation fails; multiple presses must not create duplicate couples/notices.
5. Account changes/unmount must not display another account's payload or lose committed media.

## Tasks

- [x] 1. Session and entry: sessionId metadata; setupStatus independent from consent/legacy step; public invitation intent store; explicit destination on mock login; thin URL ingress route with feature-owned handler.
  - Modify sessionStore.ts, entryRoute.ts, app/index.tsx, AuthScreen.tsx, onboarding service/index and invite domain index.
  - Created invites/inviteIntent.ts, InviteLinkScreen.tsx and app/connect/[code].tsx; link uses flamee://connect/CODE, routed through auth/setup/confirm with payload in feature memory.
- [x] 2. Optional setup: rewrite OnboardingScreen around profile with explicit consent checkbox, partner question and relation choice; skip finishes presentation only; care remains settings. Later check-in/profile editing request missing consent explicitly.
- [x] 3. Invitations: add message beside attachment, mascot gift and reply greeting; service-owned one-time notices; preview; skip on every invite state; sender waiting exit and receiver Home after confirmed acceptance.
  - Modify invites types/schemas/service/screens/composer; add mascot and preview components; preserve voice/photo ownership and Moment delivery.
- [x] 4. Home: retain personal check-in and tabs without partner; display waiting summary, reminder actions and accessible native Modal notice. Refresh only on focus/foreground/domain change, no artificial delay or polling.
  - Add couple/localPairingReminderService.ts and home/components/PairingNoticeModal.tsx; lifecycle cleanup uses public APIs.
- [x] 5. Read changed source, perform fresh review, resolve important findings; run typecheck if available; record limits and update spec/baseline/inventory/mobile README.

## Execution ledger

- Pre-flight: existing local services and route groups read. Current auth replaces ambiguous `/`; entry requires onboarding complete and Home returns early without partner. These are implementation gaps against the approved flow.
- Ruling: preserve workspace and avoid Git/test-suite steps from generic skills because repository permissions and higher-priority task instructions apply. No remote auth/deferred installation is implied by the local implementation.
- Ruling: mascot gift uses a new static vector Flamee character derived from the flame brand shape; no media URI or purchased-gift claim. Cost if revised: replace this UI asset/catalog through the same gift contract.
- Ruling: use Expo Router's existing external URL route handler instead of adding a parallel Linking provider. Only external ingress contains the code; immediately capture into feature memory and replace the current route. Cost if the hosting/scheme changes: update ingress/deep-link integration; installation handoff remains deferred.
- Tasks 1–4: local implementation written; no test suite added/run. Account-switch guards, media ownership transfer, event-driven refresh and separate consent request reviewed from source.
- Initial typecheck failed on a notice map owner variable; corrected inviterId to invite.inviterId. Subsequent and final npm run typecheck completed with exit 0.
- Final fresh review: independent read-only reviewer identified expired outgoing waiting blocking join and pending incoming intent resuming partner/relation setup. Fixed both. Also preserved message-only delivery to text Moments, bounded popup with scrolling, and changed unpair return to Home. Local acceptance validation plus membership writes remain synchronous.
- Final author pass: acknowledgement publishes a change to invalidate in-flight Home reads; account changes hide old payload/reset UI actions; new profile/care/check-in flows ask consent explicitly.
- Runtime limitation: CUA getState returned apps=[] / browsers=[]; no visual/device/navigation/media/frame-rate verification. No cloud/backend calls, Git operations or commits.
