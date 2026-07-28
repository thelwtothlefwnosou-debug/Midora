/**
 * Unit checks for draft wizard resume step persistence / resolution.
 * Run: npm run test:wizard-resume
 */

import {
  ACTIVE_WIZARD_STEP_IDS,
  RESUME_PRIOR_REQUIRED_MSG_KEY,
  activeWizardStepIdFromNumber,
  activeWizardStepNumber,
  decideWizardStepChange,
  firstIncompleteRequiredActiveStep,
  isActiveStepDataSatisfied,
  nearestIncompletePriorRequiredStep,
  parseWizardResumeStep,
  pickLatestResumeStep,
  preferHigherResumeStep,
  preferSessionWizardStep,
  resolveInitialWizardStep,
  resolveWizardResumeStep,
  resumeStepForAutosave,
  shouldApplyResumeWrite,
  type WizardResumeListingSnapshot,
} from "../src/lib/listing-wizard-resume";
import { parsePortalListingFields } from "../src/lib/listing-portal-payload";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function baseListing(
  overrides: Partial<WizardResumeListingSnapshot> = {}
): WizardResumeListingSnapshot {
  return {
    rental_type: "short_term",
    supports_short_term: true,
    supports_monthly: false,
    property_type: "apartment",
    city: "Αθήνα",
    area: "Κολωνάκι",
    title: "Όμορφο διαμέρισμα στο κέντρο",
    description: "Περιγραφή με αρκετό κείμενο για το draft.",
    bedrooms: 2,
    bathrooms: 1,
    sqm: 65,
    floor: 3,
    max_guests: 4,
    price_per_night: 80,
    contact_name: "Νίκος",
    contact_phone: "+306912345678",
    ...overrides,
  };
}

function main() {
  console.log("\n🧪 listing-wizard-resume\n");

  // Catalog alignment: 12 live steps
  assert(ACTIVE_WIZARD_STEP_IDS.length === 12, "12 active wizard steps");
  assert(ACTIVE_WIZARD_STEP_IDS[5] === "amenities", "step 6 is amenities");
  assert(ACTIVE_WIZARD_STEP_IDS[11] === "review", "step 12 is review");
  console.log("✓ active step catalog");

  // Save lastVisitedStep via parse
  for (const id of ACTIVE_WIZARD_STEP_IDS) {
    assert(parseWizardResumeStep(id) === id, `parse ${id}`);
    assert(activeWizardStepNumber(id) >= 1, `number for ${id}`);
    assert(activeWizardStepIdFromNumber(activeWizardStepNumber(id)) === id, `roundtrip ${id}`);
  }
  // Legacy numeric session/DB strings
  assert(parseWizardResumeStep("9") === "contact", "legacy numeric 9 → contact");
  console.log("✓ save/parse lastVisitedStep for each step id");

  // Resume each step when stored
  for (const id of ACTIVE_WIZARD_STEP_IDS) {
    const listing = baseListing({ wizard_resume_step: id });
    // Fill prior required so resume is honored
    const photoCount = id === "photos" || activeWizardStepNumber(id) > 8 ? 2 : 0;
    const resolved = resolveWizardResumeStep(listing, {
      photoCount: activeWizardStepNumber(id) > 8 ? 2 : photoCount,
    });
    if (id === "rental_mode") {
      // Stale step-1 with mode already chosen → recover to first incomplete
      assert(
        resolved.stepId === "photos" && resolved.source === "first_incomplete",
        `stale rental_mode recovers, got ${resolved.stepId}/${resolved.source}`
      );
    } else if (activeWizardStepNumber(id) > 8) {
      // contact+ need photos satisfied when prior check runs
      const filled = baseListing({
        wizard_resume_step: id,
        owner_responsibility_accepted: true,
        platform_role_accepted: true,
        tax_obligation_accepted: true,
        authority_disclosure_accepted: true,
        terms_privacy_accepted: true,
        ama_declaration_accepted: true,
      });
      const r = resolveWizardResumeStep(filled, { photoCount: 2 });
      assert(r.stepId === id, `resume opens ${id}, got ${r.stepId}`);
      assert(r.source === "resume", `source resume for ${id}`);
    } else if (id === "photos") {
      const r = resolveWizardResumeStep(baseListing({ wizard_resume_step: "photos" }), {
        photoCount: 0,
      });
      assert(r.stepId === "photos", "resume photos even with 0 photos");
    } else {
      assert(resolved.stepId === id, `resume opens ${id}, got ${resolved.stepId}`);
    }
  }
  console.log("✓ resume each step from stored wizard_resume_step");

  // Fresh draft: rental_mode resume honored when mode not chosen yet
  const emptyMode = resolveWizardResumeStep(
    { wizard_resume_step: "rental_mode" },
    { photoCount: 0 }
  );
  assert(
    emptyMode.stepId === "rental_mode" && emptyMode.source === "resume",
    "rental_mode honored when mode not chosen"
  );
  console.log("✓ rental_mode resume when empty draft");

  // Stale DB step-1 with progressed draft (Continue-from-dashboard bug)
  const staleStep1 = resolveWizardResumeStep(
    baseListing({
      wizard_resume_step: "rental_mode",
      title: "Πρόχειρη αγγελία",
      price_per_night: null,
      contact_name: null,
      contact_phone: null,
    }),
    { photoCount: 0 }
  );
  assert(
    staleStep1.stepId === "title" && staleStep1.source === "first_incomplete",
    `stale rental_mode + data → title, got ${staleStep1.stepId}`
  );
  console.log("✓ stale rental_mode recovers to first incomplete");

  // Refresh / new session: same stored field → same step (amenities)
  const amenitiesDraft = baseListing({ wizard_resume_step: "amenities" });
  const session1 = resolveWizardResumeStep(amenitiesDraft, { photoCount: 0 });
  const session2 = resolveWizardResumeStep(amenitiesDraft, { photoCount: 0 });
  assert(session1.stepId === "amenities" && session2.stepId === "amenities", "new session keeps amenities");
  assert(session1.stepNumber === 6, "amenities is step 6");
  console.log("✓ refresh / new session preserves amenities resume");

  // No resumeStep fallback: first incomplete required (skip amenities)
  const noResume = baseListing({
    wizard_resume_step: null,
    title: "Πρόχειρη αγγελία",
    description: "",
  });
  const fallback = resolveWizardResumeStep(noResume, { photoCount: 0 });
  assert(fallback.source === "first_incomplete", "fallback source");
  assert(fallback.stepId === "title", `fallback to title, got ${fallback.stepId}`);
  assert(
    firstIncompleteRequiredActiveStep(noResume, 0) === "title",
    "first incomplete is title"
  );
  assert(isActiveStepDataSatisfied("amenities", noResume, 0) === true, "amenities never required");
  console.log("✓ no resumeStep → first incomplete required (not amenities)");

  // All required done → review
  const complete = baseListing({
    wizard_resume_step: null,
    owner_responsibility_accepted: true,
    platform_role_accepted: true,
    tax_obligation_accepted: true,
    authority_disclosure_accepted: true,
    terms_privacy_accepted: true,
    ama_declaration_accepted: true,
  });
  const toReview = resolveWizardResumeStep(complete, { photoCount: 2 });
  assert(toReview.stepId === "review" && toReview.source === "review", "complete → review");
  console.log("✓ complete draft without resume → review");

  // Invalid / unsupported step
  assert(parseWizardResumeStep("not_a_step") === null, "invalid id rejected");
  assert(parseWizardResumeStep("rental_type") === null, "wrong name rental_type rejected");
  assert(activeWizardStepIdFromNumber(0) === null, "step 0 invalid");
  assert(activeWizardStepIdFromNumber(99) === null, "step 99 invalid");
  const invalidStored = resolveWizardResumeStep(
    baseListing({ wizard_resume_step: "hacked_step" }),
    { photoCount: 0 }
  );
  assert(invalidStored.source !== "resume" || invalidStored.stepId !== ("hacked_step" as never), "no crash on arbitrary");
  assert(
    invalidStored.stepId === "photos" ||
      invalidStored.source === "first_incomplete" ||
      invalidStored.source === "review",
    "invalid stored → safe fallback"
  );
  console.log("✓ invalid/unsupported step → safe fallback");

  // Incomplete prior: detect helper still works, but resolve MUST NOT roll back
  // (that was the live-wizard remount bug on any late step).
  const jumpAhead = baseListing({
    wizard_resume_step: "amenities",
    title: "Πρόχειρη αγγελία",
    description: "",
  });
  const prior = nearestIncompletePriorRequiredStep("amenities", jumpAhead, 0);
  assert(prior === "title", `nearest prior is title, got ${prior}`);
  const trusted = resolveWizardResumeStep(jumpAhead, { photoCount: 0 });
  assert(trusted.stepId === "amenities", "stored resume honored without prior redirect");
  assert(trusted.message === undefined, "no prior redirect message by default");
  const advisory = resolveWizardResumeStep(jumpAhead, {
    photoCount: 0,
    enforcePriorComplete: true,
  });
  assert(advisory.stepId === "amenities", "enforcePrior still keeps stored step");
  assert(advisory.message === RESUME_PRIOR_REQUIRED_MSG_KEY, "advisory message only");
  console.log("✓ incomplete prior detected but resolve does not roll back step");

  // Late-step remount regression: contact stored + 0 photos must stay on contact
  const lateContact = resolveWizardResumeStep(
    baseListing({ wizard_resume_step: "contact" }),
    { photoCount: 0 }
  );
  assert(
    lateContact.stepId === "contact" && lateContact.stepNumber === 9,
    "contact resume with 0 photos must not jump to photos"
  );
  const lateReview = resolveWizardResumeStep(
    baseListing({
      wizard_resume_step: "review",
      owner_responsibility_accepted: true,
      platform_role_accepted: true,
      tax_obligation_accepted: true,
      authority_disclosure_accepted: true,
      terms_privacy_accepted: true,
      ama_declaration_accepted: true,
    }),
    { photoCount: 0 }
  );
  assert(lateReview.stepId === "review", "review resume never rolls back for photos");
  console.log("✓ late-step remount does not roll back for incomplete priors");

  // Query step override validated
  const fromQuery = resolveWizardResumeStep(baseListing({ wizard_resume_step: "location" }), {
    photoCount: 0,
    queryStep: "pricing",
  });
  assert(fromQuery.stepId === "pricing", "valid query step wins");
  const badQuery = resolveWizardResumeStep(baseListing({ wizard_resume_step: "amenities" }), {
    photoCount: 0,
    queryStep: "nope",
  });
  assert(badQuery.stepId === "amenities", "invalid query ignored, uses stored");
  console.log("✓ query step validated");

  // Overlapping autosave: latest generation wins
  assert(shouldApplyResumeWrite(3, 3) === true, "latest gen applies");
  assert(shouldApplyResumeWrite(2, 3) === false, "stale gen skipped");
  const picked = pickLatestResumeStep([
    { generation: 1, stepId: "location" },
    { generation: 3, stepId: "amenities" },
    { generation: 2, stepId: "title" },
  ]);
  assert(picked === "amenities", "latest-write-wins pick");
  console.log("✓ overlapping autosave latest-write-wins");

  // Save&exit with pending: formData includes resume step
  const fd = new FormData();
  fd.set("rental_type", "short_term");
  fd.set("supports_short_term", "on");
  fd.set("title", "Test");
  fd.set("city", "Αθήνα");
  fd.set("area", "Κέντρο");
  fd.set("wizard_resume_step", "amenities");
  fd.set("property_type", "apartment");
  fd.set("bedrooms", "1");
  fd.set("bathrooms", "1");
  fd.set("max_guests", "2");
  fd.set("price_per_night", "50");
  fd.set("price_monthly", "50");
  fd.set("accepts_under_60_days", "yes");
  fd.set("availability_status", "upon_request");
  fd.set("min_months", "1");
  const fields = parsePortalListingFields(fd);
  assert(fields.wizard_resume_step === "amenities", "portal payload keeps amenities");
  const fdBad = new FormData();
  fdBad.set("rental_type", "short_term");
  fdBad.set("supports_short_term", "on");
  fdBad.set("title", "Test");
  fdBad.set("city", "Αθήνα");
  fdBad.set("area", "Κέντρο");
  fdBad.set("wizard_resume_step", "bogus");
  fdBad.set("property_type", "apartment");
  fdBad.set("bedrooms", "1");
  fdBad.set("bathrooms", "1");
  fdBad.set("max_guests", "2");
  fdBad.set("price_per_night", "50");
  fdBad.set("price_monthly", "50");
  fdBad.set("accepts_under_60_days", "yes");
  fdBad.set("availability_status", "upon_request");
  fdBad.set("min_months", "1");
  const fieldsBad = parsePortalListingFields(fdBad);
  assert(fieldsBad.wizard_resume_step === null, "bogus resume stripped in payload");
  console.log("✓ save&exit / portal payload resume field");

  // No step-1 flash: SSR-style resolve before paint
  const ssr = resolveWizardResumeStep(
    baseListing({ wizard_resume_step: "amenities" }),
    { photoCount: 0 }
  );
  assert(ssr.stepNumber === 6 && ssr.stepNumber !== 1, "initial step is 6 not 1");
  console.log("✓ no step-1 flash (resolved step before paint)");

  // Data preserved conceptually: resume does not clear amenities satisfaction
  assert(isActiveStepDataSatisfied("amenities", baseListing(), 0), "amenities data optional/ok");
  console.log("✓ amenities optional — data path preserved");

  // --- Step rollback guards ---
  const staleAutosave = resumeStepForAutosave("location", "amenities");
  assert(staleAutosave === "amenities", "autosave must not downgrade resume below high-water");
  const forwardAutosave = resumeStepForAutosave("pricing", "amenities");
  assert(forwardAutosave === "pricing", "autosave may advance resume to current UI step");
  assert(
    preferHigherResumeStep("title", "amenities") === "amenities",
    "preferHigher keeps later step"
  );
  assert(
    preferHigherResumeStep("photos", null) === "photos",
    "preferHigher handles null"
  );
  // Simulate: high-water photos, then another autosave completion must not lower
  let hw: ReturnType<typeof resumeStepForAutosave> | null = "photos";
  hw = resumeStepForAutosave("contact", hw);
  assert(hw === "contact", "high-water advances on forward autosave");
  hw = resumeStepForAutosave("location", hw);
  assert(hw === "contact", "high-water never lowers on stale autosave");
  console.log("✓ no downgrade from stale autosave resume");

  const resumeOnce = decideWizardStepChange({
    currentStep: 1,
    nextStep: 6,
    reason: "resume",
    stepInitialized: false,
  });
  assert(resumeOnce.apply === true, "first resume applies");
  const resumeTwice = decideWizardStepChange({
    currentStep: 6,
    nextStep: 2,
    reason: "resume",
    stepInitialized: true,
  });
  assert(resumeTwice.apply === false, "second resume blocked");
  assert(resumeTwice.detail === "resume_after_init_forbidden", "init-once detail");
  const resumeDowngrade = decideWizardStepChange({
    currentStep: 9,
    nextStep: 3,
    reason: "resume",
    stepInitialized: true,
  });
  assert(resumeDowngrade.apply === false, "post-init resume downgrade blocked");
  const draftRefetch = decideWizardStepChange({
    currentStep: 6,
    nextStep: 1,
    reason: "draft_refetch",
    stepInitialized: true,
  });
  assert(draftRefetch.apply === false, "draft refetch never changes step");
  const autosaveReason = decideWizardStepChange({
    currentStep: 4,
    nextStep: 1,
    reason: "autosave",
    stepInitialized: true,
  });
  assert(autosaveReason.apply === false, "autosave reason cannot change step");
  const propSync = decideWizardStepChange({
    currentStep: 8,
    nextStep: 2,
    reason: "prop_sync",
    stepInitialized: true,
  });
  assert(propSync.apply === false, "prop sync cannot change step");
  const nextOk = decideWizardStepChange({
    currentStep: 3,
    nextStep: 4,
    reason: "next",
    stepInitialized: true,
  });
  assert(nextOk.apply === true, "user next allowed");
  const backOk = decideWizardStepChange({
    currentStep: 4,
    nextStep: 3,
    reason: "back",
    stepInitialized: true,
  });
  assert(backOk.apply === true, "user back allowed");
  const sessionSyncOk = decideWizardStepChange({
    currentStep: 2,
    nextStep: 9,
    reason: "session_sync",
    stepInitialized: false,
    sessionSynced: false,
  });
  assert(sessionSyncOk.apply === true, "session_sync applies once");
  const sessionSyncTwice = decideWizardStepChange({
    currentStep: 9,
    nextStep: 2,
    reason: "session_sync",
    stepInitialized: true,
    sessionSynced: true,
  });
  assert(sessionSyncTwice.apply === false, "second session_sync blocked");
  assert(sessionSyncTwice.detail === "session_sync_already_applied", "session sync once detail");
  console.log("✓ step init once + goToStep guard + no post-init downgrade");

  const preferredSession = preferSessionWizardStep("contact", 3);
  assert(
    preferredSession.stepNumber === 9 && preferredSession.source === "session",
    "session step id wins over lower SSR"
  );
  const preferredSsr = preferSessionWizardStep(null, 7);
  assert(preferredSsr.stepId === "pricing" && preferredSsr.source === "ssr", "ssr when no session");
  const preferredSsrBeatsStaleSession = preferSessionWizardStep("rental_mode", 6);
  assert(
    preferredSsrBeatsStaleSession.stepId === "amenities" &&
      preferredSsrBeatsStaleSession.source === "ssr",
    "stale session step 1 must not beat SSR amenities"
  );
  console.log("✓ preferSessionWizardStep");

  const initialFromSession = resolveInitialWizardStep(
    baseListing({ wizard_resume_step: "location" }),
    { photoCount: 0, sessionStepNumber: 7 }
  );
  assert(
    initialFromSession.stepNumber === 7 && initialFromSession.stepId === "pricing",
    "session step wins over stale stored resume"
  );
  const initialFromStored = resolveInitialWizardStep(
    baseListing({ wizard_resume_step: "amenities" }),
    { photoCount: 0 }
  );
  assert(initialFromStored.stepNumber === 6, "resolveInitialStep falls back to stored");
  // Session must win even when stored resume would have had incomplete priors
  const sessionBeatsPrior = resolveInitialWizardStep(
    baseListing({
      wizard_resume_step: "contact",
      title: "Πρόχειρη αγγελία",
    }),
    { photoCount: 0, sessionStepNumber: 9 }
  );
  assert(
    sessionBeatsPrior.stepId === "contact",
    "session contact wins over incomplete draft fields"
  );
  // Dashboard Continue: empty/stale session step 1 must not block DB resume
  const staleSessionStep1 = resolveInitialWizardStep(
    baseListing({ wizard_resume_step: "amenities" }),
    { photoCount: 0, sessionStepNumber: 1 }
  );
  assert(
    staleSessionStep1.stepId === "amenities" && staleSessionStep1.stepNumber === 6,
    "stale session step 1 must not block DB amenities resume"
  );
  const emptySessionUsesDb = resolveInitialWizardStep(
    baseListing({ wizard_resume_step: "capacity" }),
    { photoCount: 0, sessionStepNumber: null }
  );
  assert(
    emptySessionUsesDb.stepId === "capacity",
    "empty session uses DB resume"
  );
  console.log("✓ resolveInitialStep");

  console.log("\n✅ listing-wizard-resume OK\n");
}

try {
  main();
} catch (err) {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
}
