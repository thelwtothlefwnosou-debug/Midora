# Create listing wizard — Phase A architecture

Status: **architecture only** (no premium UI rebuild yet).  
Product: Midora = **listings + inquiry** (no bookings / checkout).  
Reference: guided host UX inspiration only — **do not** copy Airbnb brand, colors, or copy.

---

## Preferred routes

| Intent | Route | Behavior |
|--------|-------|----------|
| New listing (canonical) | `/dashboard/listings/new` | Guided create wizard (`OWNER_LISTING_NEW_PATH`) |
| Alias | `/dashboard/listings/create` | Redirect → `/dashboard/listings/new` |
| Resume draft | `/dashboard/listings/new?draft=<id>` | Load existing draft into wizard |
| Edit published / workspace | `/dashboard/listings/[id]/*` | Listing workspace tabs (edit, photos, pricing, publish…) — **not** the create wizard |

CTAs (`Νέα αγγελία`, header, home empty state, nav) must keep pointing at `OWNER_LISTING_NEW_PATH`.

**Do not** merge create-wizard into workspace edit in Phase B without an explicit migration plan.

---

## Current vs target flow

### Current (live)

`NewListingWizard` — **7 steps** in one page:

1. Βασικά στοιχεία (title, location, map, capacity, description)
2. Τύπος μίσθωσης
3. Τιμή & μίσθωση (+ registry bits)
4. Φωτογραφίες
5. Επικοινωνία
6. Δηλώσεις
7. Έλεγχος πριν την υποβολή

Draft save on Continue (`ensureDraft` → `savePortalListingDraft`). Resume via `?draft=`.

### Target (premium guided)

**3 phases · ~16 steps** — config in `src/lib/listing-wizard-steps.ts`.

| Phase | Steps |
|-------|--------|
| **Το ακίνητό σου** (`about`) | welcome → rental_mode → property_type → location → map_pin → capacity → basics |
| **Να ξεχωρίζει** (`stand_out`) | amenities → photos → title → description |
| **Ολοκλήρωση** (`finish`) | pricing → availability → registry → contact → declarations → review |

Legacy mapping: `LEGACY_STEP_TO_TARGET` in the same file.

---

## Draft autosave model

### Goals

- Create a **DB draft early** (after first meaningful step / Continue), not only at the end.
- One active draft per owner when possible (reuse by title / existing draft id — already partially done).
- Resume from `?draft=` or “continue incomplete listing” CTAs.
- Debounced autosave on field blur / idle (Phase B+); Phase A keeps explicit Continue-save.
- No duplicate spam drafts.

### Proposed fields (prefer existing first)

| Need | Existing today | Gap |
|------|----------------|-----|
| Draft row | `approval_status = 'draft'`, `status = 'pending'` | OK |
| Prices before step pricing | `price_monthly NOT NULL CHECK (> 0)` | **Hard** — drafts use placeholder `1` via `withDraftSafePrices` until real price set |
| Current step | — | Optional: `wizard_step text` or store in client + URL only for Phase B |
| Completion % | Computed client-side (`listing-completeness.ts`) | Optional: `completion_score smallint` cache later |
| Last autosave | `updated_at` | OK |

**Phase A decision:** do **not** apply risky migrations yet. Use:

1. `withDraftSafePrices` for early drafts (already shipped).
2. Client `step` state + `?draft=` + existing completeness helpers.
3. Modal when opening `/new` if owner already has an incomplete draft: Continue / Start fresh (Phase B UI).

### Autosave rules (target)

1. **Insert** draft on first successful Continue past welcome (or after location+title min).
2. **Update** same `listingId` thereafter; never create a second row for the same session.
3. Debounce ~800ms on text fields; immediate save on step advance / photo upload.
4. If price unset on draft write: insert placeholder `price_monthly = 1`, omit price on update (preserve prior).
5. Real price validated only on **pricing** step and on submit (`validatePortalListingFields`).

---

## Schema map (existing vs needed)

### Already on `listings` (usable)

- Identity / copy: `title`, `description`, `property_type`
- Location: `city`, `area`, address_* , lat/lng, confirmation flags
- Capacity: `bedrooms`, `bathrooms`, `sqm`, `floor`, `max_guests`
- Rental mode: `rental_type`, `supports_short_term`, `supports_monthly`, stay labels
- Pricing: `price_monthly`, `price_per_night`, guest fees
- Availability: `availability_status`, `availability_note`
- Registry: `ama_number`, `legal_registry_type`, `accepts_under_60_days`
- Contact + declarations flags
- Photos: `listing_images` table
- Amenities: related amenity join tables (workspace)

### Gaps (defer migrations)

| Column / feature | Why | When |
|------------------|-----|------|
| `wizard_step` | Resume exact micro-step after refresh | Phase B if URL alone is insufficient |
| Nullable / zero `price_monthly` for drafts | Cleaner than placeholder `1` | Only with careful CHECK change + backfill |
| `completion_score` | Dashboard badges without recompute | Nice-to-have |
| Welcome / amenities-only steps | Mostly UX, fields exist | Phase B UI |

---

## Out of scope (this doc / Phase A)

- Full premium UI redesign
- Public listing / search / map / calendar changes
- Owner dashboard chrome redesign
- Booking / checkout (never Midora core)
- Copying Airbnb visual system

---

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| **A (this)** | Routes decision, step config, autosave model, schema map, docs + `listing-wizard-steps.ts` |
| **B** | Wire step config into wizard shell; split current 7 steps; fix validation per-step (pricing only on pricing) |
| **C** | Autosave debounce, resume modal, progress UI polish |
| **D** | Visual premium pass (Midora tokens only) |

---

## Related code

- `src/app/dashboard/listings/new/NewListingWizard.tsx` — current UI
- `src/lib/owner-flow.ts` — `OWNER_LISTING_NEW_PATH`
- `src/lib/listing-portal-payload.ts` — parse/validate/row + `withDraftSafePrices`
- `src/lib/actions.ts` — `savePortalListingDraft`, `submitPortalListingForReview`
- `src/lib/listing-completeness.ts` — completion checklist
- `src/lib/listing-wizard-steps.ts` — Phase A step config
