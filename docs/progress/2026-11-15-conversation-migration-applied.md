# Conversation migration applied — 2026-11-15

User explicitly requested applying the migration before their own push/CI deployment, then opened and authenticated the Supabase project.

- Project: `crxkzjnvwlnjuxmbtnqm`, CallmeTruong's Project, branch `main` (Dashboard label PRODUCTION).
- Migration: `backend/migrations/20261115_memory_conversation.sql`.
- SHA256 of the local file and the exact SQL Editor model before execution: `2e13b71ec2b187c784316f28245b5b7d19db0ba0878b4bdfa64c19c678c6b178`.
- Executed through Supabase SQL Editor as `postgres`, with the script's BEGIN/COMMIT transaction intact. Dashboard returned `Success. No rows returned`.
- Prior read-only inspection confirmed users/couples/memories and required text columns existed; the three new tables, comment_count column and conversation RPC were absent.
- Dashboard's generic destructive/RLS warning was reviewed: DELETE statements are function bodies, not executed domain mutations, and the DO block enables RLS/revokes client privileges within the same transaction. The script was executed unchanged, without Dashboard-injected SQL.
- Issued `NOTIFY pgrst, 'reload schema'` after commit.

## Postflight verification

All six checks returned true:

1. `memory_comments`, `memory_comment_hearts`, `couple_notifications` exist with RLS enabled.
2. `anon` and `authenticated` lack direct SELECT/INSERT/UPDATE/DELETE on these tables.
3. `service_role` has required CRUD grants.
4. `memory_conversation_operation(text,text,text,text,text,jsonb)` exists, service_role can execute, anon/authenticated cannot.
5. `memory_comment_view(text,text)` has the same client/backend execute restriction.
6. `memories.comment_count` is integer, NOT NULL, default0.

SQL Editor verification tab: https://supabase.com/dashboard/project/crxkzjnvwlnjuxmbtnqm/sql/51c56c92-67c5-4177-887f-ca00a966eb4c

No seeded accounts, comments, hearts, notifications or domain-data deletions were executed. No Git push, backend deploy or service restart was performed; the user will push code to trigger their CI/CD. Runtime API and two-device write verification remain after that deployment.
