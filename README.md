# Midora

Πλατφόρμα **mid-term ενοικιάσεων** στην Ελλάδα — σπίτι για 1 μήνα και πάνω.

## Τεχνολογίες

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- Supabase (Auth, PostgreSQL, Storage)

## Εγκατάσταση

```bash
npm install
cp .env.local.example .env.local   # συμπλήρωσε τα Supabase keys
```

**Πλήρης οδηγός deploy, OAuth και Vercel:** δες [`DEPLOY.md`](./DEPLOY.md)

### Supabase setup

1. Δημιούργησε project στο [Supabase](https://supabase.com)
2. Τρέξε το `supabase/schema.sql` στο SQL Editor
3. Αν έχεις ήδη DB, τρέξε και το `supabase/fix-rls.sql`
4. Βάλε στο `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
   - `NEXT_PUBLIC_FREE_LISTINGS=true` (δωρεάν αγγελίες στο launch)
   - `NEXT_PUBLIC_USE_SEED_LISTINGS=true` (μόνο local — demo αγγελίες)

```bash
npm run db:check    # έλεγχος σύνδεσης
npm run db:seed     # demo δεδομένα (προαιρετικό)
npm run dev         # http://localhost:3000
```

## Κύριες σελίδες

| Διαδρομή | Περιγραφή |
|----------|-----------|
| `/` | Landing |
| `/listings` | Αναζήτηση + χάρτης |
| `/listings/[id]` | Λεπτομέρειες αγγελίας |
| `/login`, `/register` | Σύνδεση / εγγραφή |
| `/auth/forgot-password` | Επαναφορά κωδικού |
| `/dashboard` | Διαχείριση αγγελιών |
| `/dashboard/listings/new` | Νέα αγγελία |
| `/dashboard/listings/[id]/edit` | Επεξεργασία |
| `/dashboard/settings` | Ρυθμίσεις προφίλ |
| `/admin` | Έγκριση αγγελιών (admin) |
| `/faq`, `/contact` | Βοήθεια |

## Πληρωμές (τελευταίο βήμα)

Η πληρωμή μέσω Stripe **δεν είναι ενεργή** ακόμα. Με `NEXT_PUBLIC_FREE_LISTINGS=true` οι αγγελίες δημοσιεύονται δωρεάν.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run db:check` — έλεγχος Supabase
- `npm run db:seed` — seed demo listings
