# Midora — Data & storage backup plan

This document covers **non-code** data. Application source is protected separately by git commits, file checkpoints (`midora-checkpoints/`), and Cursor auto-checkpoints.

## What is already protected

| Layer | Protects | Location |
|-------|----------|----------|
| Git commits | Source code history | Local repo (push to remote recommended) |
| File checkpoints | Source snapshots | `../midora-checkpoints/` |
| Supabase migrations | Database **schema** | `supabase/migrations/` (in git) |

## What is NOT automatically protected

### 1. Database rows (Supabase Postgres)

- Listing records, user profiles, inquiries, pricing, availability, etc.
- **Schema** is in git via migrations; **data** lives only in Supabase unless you export it.

**Recommended actions:**

- Enable Supabase project backups (paid plans include PITR; free tier: manual exports).
- Periodic `pg_dump` or Supabase dashboard export for critical tables.
- Never run destructive SQL without explicit approval and a pre-change export.

**Do not** add destructive reset scripts to this repo without a documented recovery path.

### 2. Storage / uploaded files

- Listing photos, videos, avatars in Supabase Storage (or other buckets).
- Deleting a storage object or bucket is **not** recovered by git or file checkpoints.

**Recommended actions:**

- Enable bucket versioning or lifecycle backups if available.
- Periodic sync of `storage/` buckets to cold backup (S3, second Supabase project, local archive).
- Treat production uploads as irreplaceable unless duplicated.

### 3. Environment secrets

- `.env.local`, API keys, service-role keys.
- **Never** copied into checkpoints (see `scripts/checkpoint.ps1` exclusions).
- Store secrets in a password manager; keep `.env.local` backed up separately (encrypted).

### 4. Auth / third-party services

- Supabase Auth users, Twilio config, payment keys — outside this repo.
- Document provider dashboards and recovery contacts.

## Recovery priority if disaster strikes

1. **Restore code** — `git checkout <safe-tag>` or checkpoint restore (pre-restore snapshot created automatically).
2. **Re-apply migrations** — `npm run db:apply-pending-migrations` / Supabase CLI.
3. **Restore database dump** — from Supabase backup or manual export.
4. **Restore storage** — from bucket backup.
5. **Re-create `.env.local`** — from secure backup (not from checkpoints).

## Current safe code point

- Commit: `a57ba3c`
- Tag: `safe-owner-workspace-a57ba3c`

Update this section when a new safe tag is created.

## Review checklist (monthly)

- [ ] Remote git push verified (`npm run git:push`)
- [ ] Supabase backup/export tested
- [ ] Storage backup or sync verified
- [ ] `.env.local` backed up securely
- [ ] `midora-checkpoints/` copied to secondary drive or cloud
