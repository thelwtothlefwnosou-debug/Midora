# Midora — Source of truth & QA gate

## Current safe point

| Item | Value |
|------|-------|
| Branch | `recovery/midora-stabilize` (verify with `git branch --show-current`) |
| Commit | `61ace24` (update after verified commits) |
| Safe tag | `safe-owner-workspace-a57ba3c` → `a57ba3c` |
| Restore line | `Γύρισε στο <hash>` from `CURRENT_GIT_COMMIT.txt` |

Update this table when a new verified safe tag is created.

---

## Mandatory QA (agents)

**Golden rule:** Do not say DONE / έτοιμο / fixed until checks pass.

```powershell
npm run qa:doctor      # git + old UI regression
npm run qa:preflight   # typecheck + lint + build
npm run qa:smoke       # Playwright browser smoke
npm run qa:all         # all three in sequence
```

Before asking the user to open the site:

```powershell
npm run dev:restart:clean
```

### Required agent response footer

```
DONE / NOT DONE

Changed: ...
Checks run: (PASS/FAIL/NOT RUN for each)
Browser verification: routes + test-results/midora-smoke/screenshots/
Git: branch, commit, uncommitted, checkpoint, commit yes/no
```

---

## QA commands reference

| Command | What it does |
|---------|----------------|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (full project; may have pre-existing debt) |
| `npm run lint:gate` | ESLint on QA/smoke scripts only (hard gate in preflight) |
| `npm run build` | Next.js production build |
| `npm run check` | typecheck + lint (no build) |
| `npm run check:full` | typecheck + lint + build |
| `npm run qa:doctor` | Git summary + `verify-canonical-ui.ps1` + `check-old-ui-regression.mjs` |
| `npm run qa:preflight` | typecheck + `lint:gate` + build (+ full lint informational) |
| `npm run qa:smoke` | Playwright smoke (`tests/smoke/midora-smoke.spec.ts`) |
| `npm run qa:smoke:install` | Install Chromium for Playwright |
| `npm run qa:all` | doctor → preflight → smoke |
| `npm run dev:restart:clean` | Stop dev server, delete `.next`, restart, open browser |
| `npm run verify:ui` | Canonical search UI file checks |

Smoke screenshots: `test-results/midora-smoke/screenshots/`

Smoke config: `tests/smoke/smoke-config.ts` (`SMOKE_LISTING_SLUG`, `SMOKE_BASE_URL`)

---

## Active routes (protect)

### Public

| Route | Notes |
|-------|-------|
| `/` | Homepage + hero search |
| `/listings` | **Canonical search results** (not `/search`) |
| `/listings?rentalType=short_term` | Short-term search |
| `/listings/[slug]` | Public listing detail |
| `/users/[slug]` | Public owner profile |

### Owner dashboard

| Route | Notes |
|-------|-------|
| `/dashboard` | Owner home overview |
| `/dashboard/listings` | «Οι αγγελίες μου» |
| `/dashboard/listings/[id]` | Listing workspace hub |
| `/dashboard/listings/[id]/*` | Workspace tabs (edit, photos, availability, pricing, publish, …) |
| `/dashboard/profile` | Owner profile |
| `/dashboard/verification` | Verification |
| `/dashboard/requests` | **Inquiries** (not `/dashboard/inquiries`) |
| `/dashboard/messages` | Messages |
| `/dashboard/stats` | Statistics |

Legacy paths must redirect or remain deleted — do not serve old UI from duplicate routes.

---

## Active components (do not revert)

### Public search

- `src/components/sections/SearchBar.tsx` — homepage hero
- `src/components/listings/ListingsFilters.tsx` — compact top bar on `/listings`
- `src/components/search/GuidedSearchFields.tsx` — segmented Άφιξη/Αναχώρηση/Ποιος
- `src/components/search/SearchFieldPopover.tsx` — popover (no desktop dim overlay)
- `src/components/listings/ListingsSearchView.tsx` + `SearchListingCardGrid`

### Public listing detail

- `src/components/listings/short-term/ListingPageContent.tsx`
- `src/components/listings/detail/AvailabilityCalendarSection.tsx` — `unavailableDayStyle="premium-blocked"`
- `src/components/listings/detail/ShortTermInquiryCard.tsx` — sticky inquiry card
- `src/components/listings/detail/ListingExternalLinksSection.tsx`

### Owner dashboard

- `src/components/dashboard/DashboardListingGridCard.tsx` — listing cards default
- `src/components/dashboard/owner-home/OwnerHomeOverview.tsx` — `/dashboard` home
- `src/components/dashboard/OwnerTopNav.tsx` + `DashboardHeader.tsx`
- `src/components/dashboard/listing-workspace/**` — listing workspace tabs
- `src/components/dashboard/ShortTermCalendarHub.tsx` — short-term pricing calendar

---

## Deprecated (must not return in active UI)

| Item | Replacement / rule |
|------|-------------------|
| `/search` route | Use `/listings` |
| `/dashboard/inquiries` | Use `/dashboard/requests` |
| «Παρόμοιες αγγελίες» | Nearby carousel section |
| «Ενδεικτική τιμή» (public) | Current price copy from `displayRange` |
| «Προεπισκόπηση» (public CTA) | «Προβολή» / «Δες αγγελία» |
| `ListingCardBadges` in `SearchListingCard` | Removed — do not re-add |
| Full-screen search modal on desktop `/listings` | Popover under compact bar |
| Imports from `scripts/extracted-from-transcript/` | Archive only |

Detected by: `node scripts/check-old-ui-regression.mjs` (via `npm run qa:doctor`).

---

## Protection layers

1. **Git commits** — permanent history
2. **File checkpoints** — `../midora-checkpoints/`
3. **Cursor auto-checkpoints** — `auto-agent` after agent edits
4. **`CURRENT_GIT_COMMIT.txt`** — post-commit hook footer

## After verified good work

1. `npm run qa:all` (must pass)
2. `npm run dev:restart:clean`
3. Optional: `npm run checkpoint -- -Label "description"`
4. `git add` + `git commit`
5. `npm run git:push`

## Never without explicit user approval

- `git reset --hard`, `git push --force`
- `checkpoint:restore` without pre-restore backup + YES
- Bulk revert of owner dashboard files
- Claiming **DONE** when QA failed or was not run

## Checkpoint restore

1. Auto **pre-restore** snapshot
2. User types `YES`
3. Restore
4. `npm run dev:restart:clean` + hard refresh

## Data

Code ≠ DB/uploads — see [DATA_BACKUP_PLAN.md](./DATA_BACKUP_PLAN.md).
