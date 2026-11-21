# Memory conversations and notifications implementation plan

**Goal:** Complete the approved comments sheet, one-level replies, hearts and a couple-scoped notification inbox with a top-right bell.

**Architecture:** Mobile features call authenticated API services; FastAPI routes delegate to a conversation service/repository. PostgreSQL RPC performs authorization and comment/heart/notification mutations atomically. Reads and counts are server-authoritative; app foreground polling refreshes open conversations and unread badges.

**Tech Stack:** Existing Expo Router, Tamagui shared controls, React Query, FastAPI, Supabase PostgreSQL. No new dependency.

**Spec:** User-approved proposal and `.doc/MEMORY-CONVERSATIONS.md`, including hearts, replies and notifications. In-app inbox is in scope; lock-screen push is not implicitly configured.

## Constraints and decisions

- Current active couple and both current members are verified server-side. No client-supplied actor or recipient IDs.
- Text 1–1000 Unicode code points; one reply level; only author edits/deletes; deleted parent becomes a tombstone so replies remain coherent.
- Idempotency keys prevent duplicate sends. Heart uses desired state PUT/DELETE, not a retry-sensitive toggle. Notifications are emitted only for a new committed event to the other member, never to self.
- Inbox supports pagination, unread count, read-one/read-all and opening the matching post/comments. No private comment content in route params, logs or persistent draft storage.
- Migration is prepared locally, never automatically applied to a live database. No Git or deployment operations.

## Tasks

- [x] Add SQL tables, restrictive grants/RLS and atomic RPC, plus backend schemas/repository/service/routes and tests for access, idempotency, replies, likes and notification ownership.
- [x] Add validated mobile API/session scope and tests for cancellation, server errors and stable send keys.
- [x] Integrate comments sheet with feed, detail/day views and notification deep links; pending/error UX must retain draft until server acknowledgement.
- [x] Add the inbox screen, bell/unread badge and lifecycle-safe polling. Preserve existing navigation and shared design controls.
- [x] Run local tests/typecheck, inspect Android UI where available, update docs and review security/race cases. Report migration/deployment and device verification limits explicitly.

## Execution/review ledger

- RPC integration executed in isolated PGlite PostgreSQL as service_role, not a live Supabase database; authenticated direct reads/RPC calls reject42501. SQL deployment includes BEGIN/COMMIT to publish tables/functions/grants atomically.
- Fresh-context review found bell clearance, stale heart UI, permission-denied cached content, thread grouping, target scroll and version-conflict recovery issues. Addressed all; final reviewer reported no remaining blockers.
- API401 remains unauthorized so the existing refresh coordinator can renew credentials;403 is scope denial. Write acknowledgements check entity IDs and expected write state.
- Expanded nonlive backend suite:233 passed, one startup smoke initially failed because the isolated embedded Python subprocess could not see its local test packages. Fixed only the test runtime path configuration; startup test rerun passed. A subsequent targeted run (including a new migration/bootstrap test) passed25. Live and remote SQL tests were explicitly excluded.
- Mobile suite retains the existing Check-in `bubbleToLargeTailGap` baseline mismatch; no changes made to that feature to hide the failure.
- No migration, deployment, Git operation, live account creation or live domain write performed. Two real paired devices, keyboard with server data, iOS/web and push remain verification/deployment steps, not claims of completion.

## Review focus

- Old account responses must never populate the new account's cache or drafts.
- Removed/dissolved couples and foreign post/comment IDs must fail closed.
- Retries, concurrent likes and edit/delete races must not duplicate data or notifications.
- Deleted targets in an inbox must produce an unavailable state, not an unrelated post.
- Missing migration or offline API must show a retryable error, never a fake empty inbox or successful send.
