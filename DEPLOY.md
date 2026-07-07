# Midora — Οδηγός Deploy & Ρυθμίσεων

Βήμα-βήμα για να βγει online η πλατφόρμα με Supabase + Vercel.

---

## 🚀 Deploy ΤΩΡΑ (Vercel CLI — χωρίς GitHub)

Αν δεν έχεις Git/GitHub, κάνε deploy **απευθείας** από τον υπολογιστή σου.

### Βήμα 1 — Άνοιξε cmd (όχι PowerShell)

```cmd
cd C:\Users\vaggelis\Projects\midora
```

### Βήμα 2 — Σύνδεση Vercel

```cmd
npx vercel login
```

- Θα ανοίξει browser → κάνε login με Google/GitHub/email
- Επέστρεψε στο terminal όταν δεις «Success»

### Βήμα 3 — Πρώτο deploy (preview)

```cmd
npx vercel
```

Απάντησε στις ερωτήσεις:
- **Set up and deploy?** → `Y`
- **Which scope?** → διάλεξε τον λογαριασμό σου
- **Link to existing project?** → `N` (πρώτη φορά)
- **Project name?** → `midora` (ή Enter)
- **Directory?** → `./` (Enter)
- **Override settings?** → `N`

Θα πάρεις URL τύπου: `https://midora-xxxxx.vercel.app`

### Βήμα 4 — Environment Variables στο Vercel

1. Πήγαινε [vercel.com/dashboard](https://vercel.com/dashboard) → project **midora**
2. **Settings → Environment Variables**
3. Πρόσθεσε **ένα-ένα** (αντέγραψε από το `.env.local` σου):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | από Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | από Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | από Supabase |
| `NEXT_PUBLIC_APP_URL` | `https://το-url-σου.vercel.app` ⚠️ |
| `NEXT_PUBLIC_FREE_LISTINGS` | `true` |
| `NEXT_PUBLIC_USE_SEED_LISTINGS` | `false` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `support@midora.gr` (προαιρετικό) |

> ⚠️ Το `NEXT_PUBLIC_APP_URL` πρέπει να είναι το **Vercel URL**, όχι localhost!

4. **Deployments → ... → Redeploy** (για να πάρουν τα env vars)

### Βήμα 5 — Production deploy

```cmd
npx vercel --prod
```

### Βήμα 6 — Ενημέρωση Supabase

Στο Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://το-url-σου.vercel.app`
- **Redirect URLs** — πρόσθεσε:
  ```
  https://το-url-σου.vercel.app/auth/callback
  ```

### Έλεγχος

Άνοιξε το Vercel URL → δοκίμασε login, listings, dashboard.

---

### Βήμα 1 — Project & schema

1. Πήγαινε στο [supabase.com/dashboard](https://supabase.com/dashboard)
2. Άνοιξε το project σου (ή φτιάξε νέο)
3. **SQL Editor** → New query → επικόλλησε όλο το `supabase/schema.sql` → **Run**
4. Αν η βάση υπήρχε ήδη, τρέξε και το `supabase/fix-rls.sql`
5. Τοπικά: `npm run db:check` — πρέπει να δεις «OK»

### Βήμα 2 — API Keys

1. **Project Settings → API**
2. Αντέγραψε:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (anon) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Secret key** (service_role) → `SUPABASE_SERVICE_ROLE_KEY`

> Το Secret key **μην** το βάλεις ποτέ σε client-side κώδικα. Μόνο server env (Vercel).

### Βήμα 3 — URL Configuration (Auth)

1. **Authentication → URL Configuration**
2. **Site URL:**
   - Local: `http://localhost:3000`
   - Production: `https://το-domain-σου.vercel.app`
3. **Redirect URLs** — πρόσθεσε **και τα δύο**:
   ```
   http://localhost:3000/auth/callback
   https://το-domain-σου.vercel.app/auth/callback
   ```

### Βήμα 4 — Email (επιβεβαίωση + επαναφορά κωδικού)

**Επιλογή Α — Γρήγορο (dev/demo):**
1. **Authentication → Providers → Email**
2. Απενεργοποίησε **Confirm email**
3. Οι χρήστες μπαίνουν αμέσως μετά την εγγραφή

**Επιλογή Β — Production (συνιστάται):**
1. Κράτα ενεργό το **Confirm email**
2. **Project Settings → Authentication → SMTP Settings**
3. Βάλε custom SMTP (π.χ. Resend, SendGrid, Brevo):
   - Host, port, user, password, sender email
4. Η εφαρμογή δείχνει «Έλεγξε το email σου» μετά την εγγραφή

### Βήμα 5 — Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. **Authorized redirect URIs** — πρόσθεσε:
   ```
   https://<το-supabase-project-id>.supabase.co/auth/v1/callback
   ```
   (Βρίσκεις το ID από το Project URL: `https://XXXX.supabase.co`)
5. Αντέγραψε **Client ID** και **Client Secret**
6. Στο Supabase: **Authentication → Providers → Google** → Enable → βάλε τα keys

### Βήμα 6 — Facebook OAuth (προαιρετικό)

1. [developers.facebook.com](https://developers.facebook.com) → **Create App** → Consumer
2. **Facebook Login → Settings**
3. **Valid OAuth Redirect URIs:**
   ```
   https://<το-supabase-project-id>.supabase.co/auth/v1/callback
   ```
4. Αντέγραψε **App ID** και **App Secret**
5. Στο Supabase: **Authentication → Providers → Facebook** → Enable

### Βήμα 7 — Admin user

Μετά την πρώτη σου εγγραφή:

1. Supabase → **Authentication → Users** → αντέγραψε το **UUID**
2. **SQL Editor:**
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'το-uuid-σου';
   ```
3. Κάνε logout/login — θα δεις **Admin Panel** στο dashboard

### Βήμα 8 — Storage (φωτογραφίες)

Το `schema.sql` δημιουργεί bucket `listing-photos`. Έλεγξε:
- **Storage → listing-photos** — public bucket
- Αν λείπει, τρέξε ξανά το storage κομμάτι του schema

---

## Μέρος Β: Vercel Deploy

### Βήμα 1 — Push στο GitHub

```bash
git add .
git commit -m "Prepare for deploy"
git push origin main
```

### Βήμα 2 — Σύνδεση Vercel

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Import το GitHub repo `midora`
3. Framework: **Next.js** (auto-detect)

### Βήμα 3 — Environment Variables

Στο Vercel → **Settings → Environment Variables**, πρόσθεσε:

| Variable | Value | Σημείωση |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key | |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key | Μόνο Production |
| `NEXT_PUBLIC_APP_URL` | `https://το-app.vercel.app` | **Κρίσιμο** — όχι localhost |
| `NEXT_PUBLIC_FREE_LISTINGS` | `true` | Μέχρι να βάλεις Stripe |
| `NEXT_PUBLIC_USE_SEED_LISTINGS` | `false` | **Μην** δείχνεις demo αγγελίες |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `support@midora.gr` | Προαιρετικό |

> Μην βάλεις Stripe keys ακόμα αν δεν τα έχεις ρυθμίσει.

### Βήμα 4 — Deploy

1. **Deploy**
2. Περίμενε το build (~1-2 λεπτά)
3. Άνοιξε το URL: `https://το-app.vercel.app`

### Βήμα 5 — Ενημέρωση Supabase URLs

Μετά το deploy, πήγαινε πίσω στο Supabase:

1. **Authentication → URL Configuration**
2. Άλλαξε **Site URL** σε `https://το-app.vercel.app`
3. Βεβαιώσου ότι υπάρχει στα Redirect URLs:
   ```
   https://το-app.vercel.app/auth/callback
   ```

### Βήμα 6 — Ενημέρωση Google/Facebook (αν τα χρησιμοποιείς)

Στο Google Cloud / Facebook Developers, πρόσθεσε authorized domain:
- `το-app.vercel.app`

---

## Μέρος Γ: Smoke test (έλεγχος ότι όλα δουλεύουν)

Κάνε αυτή τη ροή στο production URL:

```
□ Εγγραφή νέου χρήστη (ή login)
□ Complete profile (τηλέφωνο)
□ Dashboard → Νέα αγγελία
□ Ανέβασμα φωτογραφιών (+ διαγραφή μίας για δοκιμή)
□ Υποβολή για έγκριση (δωρεάν mode)
□ Admin → Έγκριση αγγελίας
□ /listings → βλέπεις την αγγελία
□ /listings/[id] → τηλέφωνο ιδιοκτήτη
□ Επεξεργασία αγγελίας
□ Google login (αν ενεργό)
□ Forgot password email (αν SMTP ενεργό)
```

---

## Local development (.env.local)

```bash
cp .env.local.example .env.local
```

Για τοπικό dev **με** demo αγγελίες (χωρίς Supabase ή κενή βάση):
```
NEXT_PUBLIC_USE_SEED_LISTINGS=true
```

Για τοπικό dev **με** πραγματική Supabase (όπως production):
```
NEXT_PUBLIC_USE_SEED_LISTINGS=false
```

---

## Συχνά προβλήματα

| Πρόβλημα | Λύση |
|----------|------|
| OAuth redirect error | Έλεγξε Redirect URLs στο Supabase + Google/Facebook callback URL |
| Μπαίνω στο dashboard χωρίς email confirm | Απενεργοποίησε Confirm email ή ρύθμισε SMTP |
| Δεν στέλνεται reset password | SMTP settings στο Supabase |
| Βλέπω seed-001, seed-002... σε production | Βάλε `NEXT_PUBLIC_USE_SEED_LISTINGS=false` στο Vercel |
| Φωτό δεν ανεβαίνει | Έλεγξε bucket `listing-photos` + RLS policies |
| Admin panel δεν φαίνεται | `UPDATE profiles SET role='admin'` |

---

## Production release checklist

Πριν το επίσημο launch (`midora.gr`):

- [ ] `NEXT_PUBLIC_APP_URL=https://midora.gr` (ή το domain σου)
- [ ] `NEXT_PUBLIC_USE_SEED_LISTINGS=false`
- [ ] `NEXT_PUBLIC_PREVIEW_V80=false`
- [ ] Supabase: schema + migrations, bucket `listing-photos`, auth redirect URLs
- [ ] `ADMIN_EMAILS` ή admin role στη βάση
- [ ] Smoke test: αναζήτηση, αγγελία, login, ανέβασμα φωτό
- [ ] Google Search Console: υποβολή `https://your-domain/sitemap.xml`
- [ ] (Προαιρετικό) `npm install @sentry/nextjs` + `NEXT_PUBLIC_SENTRY_DSN`
- [ ] GitHub Actions CI περνάει (`lint` + `build`)

Νέα production features στο codebase:
- `robots.txt` + `sitemap.xml` (αυτόματα από Next.js)
- Security headers (HSTS όταν `NEXT_PUBLIC_APP_URL` είναι https)
- Rate limiting σε geocode / AI / listing views
- Cache καταλόγου αγγελιών (60s) για ταχύτερη αναζήτηση
- JSON-LD structured data σε αγγελίες
- Open Graph εικόνα + favicon

---

## Επόμενο βήμα: Stripe

Όταν είσαι έτοιμος, βλέπε README.md — ενότητα Πληρωμές.
