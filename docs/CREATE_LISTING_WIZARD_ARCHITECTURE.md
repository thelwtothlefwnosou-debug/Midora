# Create listing wizard — Phase A architecture

Status: **Phase D complete** (premium polish: phase intros, address visibility UX, room photo tags).  
Product: Midora = **listings + inquiry** (no bookings / checkout / payments-as-host).  
Reference: guided host UX quality inspiration only — **do not** copy Airbnb brand, colors, logos, or copy.

---

## Preferred routes

| Intent | Route | Behavior |
|--------|-------|----------|
| New listing (canonical) | `/dashboard/listings/new` | Guided create wizard (`OWNER_LISTING_NEW_PATH`) |
| Alias | `/dashboard/listings/create` | Redirect → `/dashboard/listings/new` |
| Resume draft (current) | `/dashboard/listings/new?draft=<id>` | Load existing draft into wizard |
| Resume draft (optional later) | `/dashboard/listings/new/[draftId]` | Same as `?draft=` — nicer URL; **not required for Phase B** |
| Edit published / workspace | `/dashboard/listings/[id]/*` | Listing workspace tabs — **not** the create wizard |

CTAs (`Νέα αγγελία`, header, home empty state, nav, HostCTA, footer) must keep pointing at `OWNER_LISTING_NEW_PATH`.

**Do not** merge create-wizard into workspace edit in Phase B without an explicit migration plan.

---

## Current vs target flow

### Current (live on prod)

`NewListingWizard` — **7 steps** in one page:

1. Βασικά στοιχεία (title, location, map, capacity, description)
2. Τύπος μίσθωσης
3. Τιμή & μίσθωση (+ registry bits)
4. Φωτογραφίες
5. Επικοινωνία
6. Δηλώσεις
7. Έλεγχος πριν την υποβολή

Draft save on Continue (`ensureDraft` → `savePortalListingDraft`). Resume via `?draft=`.

**Step-1 price bug (fixed):** Continue on step 1 called draft save with `price_monthly = 0` → DB `CHECK (price_monthly > 0)` → user saw price error while still on step 1. Fix: `withDraftSafePrices` (commits `6549896` / `d6bf501`). Deployed to https://midora.vercel.app.

### Target (premium guided)

**3 phases · ~16 steps** — config in `src/lib/listing-wizard-steps.ts` (not wired into UI yet).

| Phase | Steps |
|-------|--------|
| **Το ακίνητό σου** (`about`) | welcome → rental_mode → property_type → location → map_pin → capacity → basics |
| **Να ξεχωρίζει** (`stand_out`) | amenities → photos → title → description |
| **Ολοκλήρωση** (`finish`) | pricing → availability → registry → contact → declarations → review |

Legacy mapping: `LEGACY_STEP_TO_TARGET` in the same file.

---

## Field mapping (target steps → existing schema)

| Target step | Existing fields / tables | Gap |
|-------------|--------------------------|-----|
| welcome | — (UX only) | none |
| rental_mode | `rental_type`, `supports_short_term`, `supports_monthly` | none |
| property_type | `property_type` | optional later: `place_type` (whole/private/shared) — **not in DB** |
| location | `city`, `area`, address_*, display names | optional: `address_visibility` — **not in DB** |
| map_pin | lat/lng, location_confirmed_* | none |
| capacity | `bedrooms`, `bathrooms`, `max_guests`, `sqm`, `floor` | optional: `beds` count — use `bedrooms` or workspace sleeping arrangements |
| basics | `furnished`, `has_balcony`, `has_elevator`, heating… | none |
| amenities | amenity join tables (workspace today) | wizard does not edit amenities yet |
| photos | `listing_images` | none |
| title / description | `title`, `description` | none |
| pricing | `price_monthly`, `price_per_night`, guest fees, min stay | draft placeholder `1` until real price |
| availability | `availability_status`, `availability_note` | none |
| registry | AMA / legal_registry_* | none |
| contact / declarations / review | existing contact + declaration flags | none |

---

## Draft autosave model (existing schema)

### Goals

- Create a **DB draft early** (after first Continue past welcome / first meaningful fields).
- One active draft per owner session (`listingId` + `?draft=` + sessionStorage key).
- Resume from `?draft=` or “continue incomplete listing” CTAs.
- Debounced autosave on blur/idle = Phase C; Phase B keeps Continue-save (+ optional light debounce).
- No duplicate spam drafts (reuse same-title draft already partially done).

### Hard constraint

`listings.price_monthly INTEGER NOT NULL CHECK (price_monthly > 0)`.

| Need | Existing today | Approach |
|------|----------------|----------|
| Draft row | `approval_status = 'draft'`, `status = 'pending'` | OK |
| Prices before pricing step | CHECK > 0 | **`withDraftSafePrices`**: insert `1`, omit on update |
| Current step | — | Client `step` + URL; optional `wizard_step` later |
| Completion % | `listing-completeness.ts` | OK; watch placeholder price false-positive |
| Last autosave | `updated_at` | OK |

**Phase A decision:** no risky migrations for Phase B MVP.

### Autosave rules (target)

1. **Insert** draft on first successful Continue past welcome (or after location+title min).
2. **Update** same `listingId` thereafter; never create a second row for the same session.
3. Debounce ~800ms on text fields (Phase C); immediate save on step advance / photo upload.
4. If price unset: insert placeholder `price_monthly = 1`, omit price on update.
5. Real price validated only on **pricing** step and on submit (`validatePortalListingFields`).

---

## Schema gaps (defer migrations)

| Column / feature | Exists? | When |
|------------------|---------|------|
| `place_type` | **No** | Phase C+ if product wants whole/private/shared |
| `wizard_step` | **No** | Phase B only if URL/`?draft=` insufficient |
| `beds` (separate from bedrooms) | **No** | Prefer `bedrooms` + sleeping arrangements in workspace |
| `address_visibility` | **No** | Prefer existing private_* + confirm flags |
| Nullable / zero `price_monthly` for drafts | **No** (CHECK > 0) | Only with careful CHECK change + backfill; placeholder is OK for now |
| `completion_score` | **No** | Nice-to-have |

---

## Risks to existing flows

| Risk | Mitigation |
|------|------------|
| Dual edit surfaces (wizard vs `/dashboard/listings/[id]/edit`) | Keep wizard for create/resume draft; workspace for published/edit |
| Completeness CTAs send to `/edit` not wizard | Phase B: draft → wizard `?draft=`; approved → workspace |
| Placeholder `price_monthly = 1` looks “priced” | Completeness / public: treat `approval_status=draft` + unset real price as incomplete; never show €1 on public |
| Amenity / beds only in workspace | Phase B MVP can skip amenities; Phase C wire amenity picker |
| Public search / map / calendar unchanged | Do not touch public listing cards pricing display for drafts |
| HostCTA `?rentalType=` | Preserve query when wiring new step shell |
| Regression of 7-step Continue save | Keep `savePortalListingDraft` + `withDraftSafePrices` as single write path |

---

## Out of scope (explicit)

- Broader owner-dashboard redesign (beyond create wizard)
- Public listing / search / map / calendar product changes
- Owner dashboard chrome redesign
- **Bookings / checkout / Airbnb-style reservation**
- Copying Airbnb visual system or marketing copy
- Unnecessary new markdown beyond this plan
- Full house-tour / sleeping-arrangement editor inside create wizard (workspace remains canonical for deep photo tour)

---

## Recommended Phase B MVP subset

Wire a **thin step shell** on existing fields — Midora tokens only, no visual overhaul:

1. rental_mode  
2. property_type  
3. location (+ map_pin can stay combined if faster)  
4. capacity  
5. title  
6. pricing (first time real price is required)  
7. photos (basic upload, existing `ListingWizardPhotosStep`)  
8. review / publish (`submitPortalListingForReview`)

Defer to Phase C: welcome polish, amenities, description-only step, availability split, registry/contact/declarations as separate micro-steps, debounce autosave, resume modal, `/new/[draftId]`.

---

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| **A (done)** | Routes decision, step config, autosave model, schema map, this doc + `listing-wizard-steps.ts` |
| **B (done)** | Full-screen shell, rental-first split steps, per-step validation, `withDraftSafePrices` |
| **C (done)** | 11 steps (+ optional Παροχές), autosave debounce, resume modal, live preview, amenity picker |
| **D (done)** | Phase intros (Το ακίνητό σου / Να ξεχωρίζει / Ολοκλήρωση), shell polish + STEP_HINTS, address visibility checkbox (`location_confirmed_by_owner`, default area-only), light room tags on photos via existing `room_key` APIs |

### Phase C live step order (`NewListingWizard`)

1. Τύπος μίσθωσης → 2. Τύπος ακινήτου → 3. Τοποθεσία → 4. Χωρητικότητα → 5. Τίτλος & περιγραφή → **6. Παροχές (optional)** → 7. Τιμή & διαθεσιμότητα → 8. Φωτογραφίες → 9. Επικοινωνία → 10. Δηλώσεις → 11. Έλεγχος

Amenities: `popularFilterAmenities` + `saveOwnerListingAmenities` / `getOwnerListingAmenities`. Skip allowed; Continue always ok.

### Phase D notes

- Phase intros skip on `?draft=` resume; skippable with Επόμενο on fresh create.
- Address visibility: no new DB column — uses `location_confirmed_by_owner` (map geocode no longer auto-sets public exact).
- Room organization: `suggestPhotoRooms` + existing assign APIs in wizard; deep tour stays in listing workspace.
- Save and Exit → `/dashboard/listings?draftSaved=1` unchanged; no draft-resume modal on fresh `/new`.

---

## Phase B kickoff checklist

- [ ] Import `WIZARD_STEPS` / `WIZARD_PHASES` into a new thin shell (or evolve `NewListingWizard` behind a feature flag).
- [ ] Implement **only** MVP steps listed above; map Continue → `savePortalListingDraft`.
- [ ] Per-step validators: **no price check** until `pricing`; keep `withDraftSafePrices`.
- [ ] Preserve `?draft=` resume + all `OWNER_LISTING_NEW_PATH` CTAs.
- [ ] Do **not** change workspace routes or public listing pages.
- [ ] Hide / ignore placeholder €1 in owner completeness and public surfaces for drafts.
- [ ] Smoke: step 1 Continue creates draft without price error; pricing step accepts real price; submit still validates fully.
- [ ] Run `npm run qa:all` before claiming DONE.
- [ ] No Airbnb branding/copy; no booking/checkout UI.

---

## Related code

- `src/app/dashboard/listings/new/NewListingWizard.tsx` — current UI
- `src/lib/owner-flow.ts` — `OWNER_LISTING_NEW_PATH`
- `src/lib/listing-portal-payload.ts` — parse/validate/row + `withDraftSafePrices`
- `src/lib/actions.ts` — `savePortalListingDraft`, `submitPortalListingForReview`
- `src/lib/listing-completeness.ts` — completion checklist
- `src/lib/listing-wizard-steps.ts` — Phase A step config
- `src/lib/listing-workspace-nav.ts` — workspace tabs
