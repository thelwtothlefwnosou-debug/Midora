# Private beta — production environment checklist

Use this before inviting private beta testers. Do **not** ship with seed listings or preview flags enabled.

## Critical rule

| Variable | Required value in private beta / production |
|----------|-----------------------------------------------|
| `NEXT_PUBLIC_USE_SEED_LISTINGS` | **`false`** (or unset) |

If this is `true`, visitors may see demo/seed data instead of real listings.

---

## Required

| Variable | Client-safe | Server-only | Production required | Notes |
|----------|-------------|-------------|---------------------|-------|
| `NEXT_PUBLIC_APP_URL` | yes | — | **yes** | Canonical site URL (OAuth redirects, emails, OG). e.g. `https://midora.gr` — no trailing slash issues preferred. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | — | **yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | — | **yes** | Public anon key only |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | **yes** | **yes** | Never expose to client / `NEXT_PUBLIC_*` |
| `NEXT_PUBLIC_USE_SEED_LISTINGS` | yes | — | **yes** | Must be `false` |

## Strongly recommended for private beta

| Variable | Client-safe | Server-only | Production required | Notes |
|----------|-------------|-------------|---------------------|-------|
| `SUPABASE_DB_PASSWORD` | no | yes | for migrations | Needed to apply SQL migrations from scripts (`db:apply-pending-migrations`) |
| `ADMIN_EMAILS` | no | yes | recommended | Comma-separated emails promoted to `role=admin` on login |
| `NEXT_PUBLIC_FREE_LISTINGS` | yes | — | recommended | `true` if Stripe paywall is not live for beta |
| `NEXT_PUBLIC_PREVIEW_V80` | yes | — | **set false** | Preview polish flag — must be off in beta |
| `NEXT_PUBLIC_CONTACT_EMAIL` | yes | — | recommended | Shown on Contact / Privacy / Footer |

## Email (inquiries / invites / auth)

| Variable | Client-safe | Server-only | Production required | Notes |
|----------|-------------|-------------|---------------------|-------|
| `RESEND_API_KEY` | no | yes | optional* | Used by `src/lib/email.ts` for transactional mail |
| `EMAIL_FROM` | no | yes | optional* | e.g. `Midora <noreply@yourdomain>` |
| `SUPPORT_EMAIL` | no | yes | optional | Logged when assistant support tickets are created |
| Supabase Auth SMTP | — | dashboard | recommended | Confirm email / password reset |

\*If unset: **in-app inquiry must still work**. Email notifications may be a known beta limitation — document for testers.

## Stripe (owner subscription / paid publish)

| Variable | Client-safe | Server-only | Production required | Notes |
|----------|-------------|-------------|---------------------|-------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | yes | — | only if paid flow live | |
| `STRIPE_SECRET_KEY` | no | yes | only if paid flow live | |
| `STRIPE_WEBHOOK_SECRET` | no | yes | only if webhooks live | |

If `NEXT_PUBLIC_FREE_LISTINGS=true`, Stripe can stay unset for private beta.

## Assistant / AI

| Variable | Client-safe | Server-only | Production required | Notes |
|----------|-------------|-------------|---------------------|-------|
| `OPENAI_API_KEY` | no | yes | optional | Assistant falls back / limited without it |
| `OPENAI_MODEL` | no | yes | optional | Default `gpt-4o-mini` |

## Phone verification (Twilio)

| Variable | Client-safe | Server-only | Production required | Notes |
|----------|-------------|-------------|---------------------|-------|
| `TWILIO_ACCOUNT_SID` | no | yes | optional | |
| `TWILIO_AUTH_TOKEN` | no | yes | optional | |
| `TWILIO_VERIFY_SERVICE_SID` | no | yes | optional | |
| `NEXT_PUBLIC_REQUIRE_PHONE_SMS` | yes | — | optional | Keep `false` until Twilio is live |

## Maps / location

| Variable | Client-safe | Server-only | Production required | Notes |
|----------|-------------|-------------|---------------------|-------|
| MapLibre / Leaflet | — | — | usually none | App uses open map stacks; no Mapbox key required by default |
| `NEXT_PUBLIC_EXTERNAL_LINKS_DISCLAIMER` | yes | — | optional | Override copy for external booking links |

## Monitoring (optional)

| Variable | Client-safe | Server-only | Notes |
|----------|-------------|-------------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | yes | — | Optional |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | no | yes | Optional |

## OAuth

| Variable | Client-safe | Server-only | Notes |
|----------|-------------|-------------|-------|
| `NEXT_PUBLIC_OAUTH_FACEBOOK` | yes | — | Set `true` only when Facebook provider is configured in Supabase |
| Google / Facebook providers | — | Supabase Dashboard | Redirect URL must include `/auth/callback` |

## Pre-flight verification

1. Confirm `NEXT_PUBLIC_USE_SEED_LISTINGS` is **not** `true`.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` is never in client bundles (`NEXT_PUBLIC_*`).
3. Apply pending migrations (see `docs/PRIVATE_BETA_MIGRATIONS.md`).
4. Smoke: login → dashboard → listing edit → public view → inquiry.
5. Auth redirect URLs in Supabase match `NEXT_PUBLIC_APP_URL`.

## Copy-paste template (production)

```env
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_USE_SEED_LISTINGS=false
NEXT_PUBLIC_PREVIEW_V80=false
NEXT_PUBLIC_FREE_LISTINGS=true
NEXT_PUBLIC_CONTACT_EMAIL=support@YOUR_DOMAIN
ADMIN_EMAILS=you@YOUR_DOMAIN
# RESEND_API_KEY=
# EMAIL_FROM=Midora <noreply@YOUR_DOMAIN>
# OPENAI_API_KEY=
```
