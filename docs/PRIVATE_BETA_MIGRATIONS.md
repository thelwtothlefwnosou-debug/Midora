# Private beta — migrations

## Pending / release-critical

| File | Purpose |
|------|---------|
| `supabase/migrations/20250713010000_profile_public_read_rls.sql` | Public SELECT on `profiles` for owners with approved listings, public slugs, admins, and **accepted** co-hosts only |

Also ensure earlier migrations in `scripts/apply-pending-migrations.ts` are applied (co-hosts, public slug, external links, property lead reply statuses, etc.).

| File | Purpose |
|------|---------|
| `supabase/migrations/20250717120000_property_leads_reply_status.sql` | Align `property_leads.status` with app (`new` / `read` / `replied` / `archived`) so owner inquiry replies succeed |
| `supabase/migrations/20250717130000_property_leads_interest_columns.sql` | Add interest/timing columns on `property_leads` required for live inquiry submit |

## Apply locally (dev / linked Supabase)

```powershell
npm run db:apply-pending-migrations
```

Requires `SUPABASE_DB_PASSWORD` (and project URL) in `.env.local`.

Or run the SQL file in Supabase Dashboard → SQL Editor.

## Apply to production Supabase

1. Open Supabase Dashboard → your **production** project → SQL Editor.
2. Paste and run, in order if not already applied:
   - Prefer running `npm run db:apply-pending-migrations` against production **only** when `SUPABASE_DB_PASSWORD` points at production and you have confirmed the target.
   - Safer for one-off: open `supabase/migrations/20250713010000_profile_public_read_rls.sql` and execute it after confirming prior migrations exist.
3. Verify:

```sql
SELECT polname, polcmd
FROM pg_policy
WHERE polrelid = 'public.profiles'::regclass
  AND polname = 'Public can view listing owner profiles';
```

4. Smoke-test a public listing owner profile URL and an accepted co-host profile; pending co-hosts must not appear publicly.

## Rollback note

This migration replaces the public profiles SELECT policy. Revert only with a known previous policy definition from git history — do not drop public SELECT without a replacement or public profiles break.

## Admin schema note (`profiles.email`)

Admin queries no longer select `profiles.email` (column may be missing if `20250620120000_admin_control_room.sql` was not applied). Auth email remains on `auth.users`. Do **not** add a public email column for private beta without a privacy review.
