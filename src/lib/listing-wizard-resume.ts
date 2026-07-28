/**
 * Persist / resolve create-wizard resume step for draft listings.
 * Uses live NewListingWizard step ids aligned with listing-wizard-steps catalog.
 */

import {
  listingDescriptionValidationError,
  listingTitleValidationError,
} from "@/lib/listing-wizard-validation";
import { MIN_LISTING_PHOTOS_REQUIRED } from "@/lib/constants";
import type { WizardStepId } from "@/lib/listing-wizard-steps";

/** Live wizard steps (1-based order in NewListingWizard). */
export const ACTIVE_WIZARD_STEP_IDS = [
  "rental_mode",
  "property_type",
  "location",
  "capacity",
  "title",
  "amenities",
  "pricing",
  "photos",
  "contact",
  "declarations",
  "trust_links",
  "review",
] as const satisfies readonly WizardStepId[];

export type ActiveWizardStepId = (typeof ACTIVE_WIZARD_STEP_IDS)[number];

export const WIZARD_RESUME_FIELD = "wizard_resume_step" as const;

/** Resolve via `Wizard.errors.priorRequired` in UI. */
export const RESUME_PRIOR_REQUIRED_MSG_KEY = "priorRequired" as const;

/** @deprecated Use `RESUME_PRIOR_REQUIRED_MSG_KEY` + `Wizard.errors.priorRequired`. */
export const RESUME_PRIOR_REQUIRED_MSG = RESUME_PRIOR_REQUIRED_MSG_KEY;

const ACTIVE_STEP_SET = new Set<string>(ACTIVE_WIZARD_STEP_IDS);

/** Steps that are optional — never block resume / fallback as "incomplete required". */
const OPTIONAL_ACTIVE_STEPS = new Set<ActiveWizardStepId>([
  "amenities",
  "trust_links",
  "review",
]);

export type WizardResumeListingSnapshot = {
  wizard_resume_step?: string | null;
  rental_type?: string | null;
  supports_short_term?: boolean | null;
  supports_monthly?: boolean | null;
  property_type?: string | null;
  city?: string | null;
  area?: string | null;
  title?: string | null;
  description?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqm?: number | null;
  floor?: number | null;
  max_guests?: number | null;
  price_per_night?: number | null;
  price_monthly?: number | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  owner_responsibility_accepted?: boolean | null;
  platform_role_accepted?: boolean | null;
  tax_obligation_accepted?: boolean | null;
  authority_disclosure_accepted?: boolean | null;
  terms_privacy_accepted?: boolean | null;
  ama_declaration_accepted?: boolean | null;
  accepts_under_60_days?: boolean | null;
  ama_number?: string | null;
  legal_registry_type?: string | null;
};

export type ResolveWizardResumeResult = {
  stepId: ActiveWizardStepId;
  stepNumber: number;
  source: "resume" | "first_incomplete" | "review" | "first";
  message?: string;
};

export function isActiveWizardStepId(value: unknown): value is ActiveWizardStepId {
  return typeof value === "string" && ACTIVE_STEP_SET.has(value);
}

export function parseWizardResumeStep(raw: unknown): ActiveWizardStepId | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isActiveWizardStepId(trimmed)) return trimmed;
  // Tolerate legacy numeric strings (1–12) if ever stored.
  const asNum = Number.parseInt(trimmed, 10);
  if (Number.isFinite(asNum)) {
    return activeWizardStepIdFromNumber(asNum);
  }
  return null;
}

export function activeWizardStepNumber(id: ActiveWizardStepId): number {
  return ACTIVE_WIZARD_STEP_IDS.indexOf(id) + 1;
}

export function activeWizardStepIdFromNumber(n: number): ActiveWizardStepId | null {
  if (!Number.isInteger(n) || n < 1 || n > ACTIVE_WIZARD_STEP_IDS.length) {
    return null;
  }
  return ACTIVE_WIZARD_STEP_IDS[n - 1] ?? null;
}

function hasRentalMode(listing: WizardResumeListingSnapshot): boolean {
  return Boolean(
    listing.rental_type === "short_term" ||
      listing.rental_type === "monthly" ||
      listing.supports_short_term === true ||
      listing.supports_monthly === true
  );
}

function isShortTerm(listing: WizardResumeListingSnapshot): boolean {
  return (
    listing.supports_short_term === true ||
    listing.rental_type === "short_term"
  );
}

function isMonthly(listing: WizardResumeListingSnapshot): boolean {
  return (
    listing.supports_monthly === true || listing.rental_type === "monthly"
  );
}

function hasPricing(listing: WizardResumeListingSnapshot): boolean {
  if (isShortTerm(listing) && !isMonthly(listing)) {
    return Boolean(listing.price_per_night && listing.price_per_night > 0);
  }
  if (isMonthly(listing) && !isShortTerm(listing)) {
    return Boolean(listing.price_monthly && listing.price_monthly > 0);
  }
  if (isShortTerm(listing) || isMonthly(listing)) {
    return (
      Boolean(listing.price_per_night && listing.price_per_night > 0) ||
      Boolean(listing.price_monthly && listing.price_monthly > 0)
    );
  }
  return false;
}

function hasDeclarations(listing: WizardResumeListingSnapshot): boolean {
  const base =
    listing.owner_responsibility_accepted === true &&
    listing.platform_role_accepted === true &&
    listing.tax_obligation_accepted === true &&
    listing.authority_disclosure_accepted === true &&
    listing.terms_privacy_accepted === true;
  if (!base) return false;
  const needsAma =
    isShortTerm(listing) ||
    (isMonthly(listing) && listing.accepts_under_60_days === true);
  if (needsAma && listing.ama_declaration_accepted !== true) return false;
  return true;
}

/** Whether a required-for-continue active step has enough data. Amenities are never required. */
export function isActiveStepDataSatisfied(
  stepId: ActiveWizardStepId,
  listing: WizardResumeListingSnapshot,
  photoCount = 0
): boolean {
  if (OPTIONAL_ACTIVE_STEPS.has(stepId) && stepId !== "review") {
    return true;
  }

  switch (stepId) {
    case "rental_mode":
      return hasRentalMode(listing);
    case "property_type":
      return Boolean(listing.property_type?.trim());
    case "location":
      return Boolean(listing.city?.trim() && listing.city.trim() !== "—");
    case "capacity": {
      const guests = listing.max_guests;
      const sqm = listing.sqm;
      const beds = listing.bedrooms;
      const baths = listing.bathrooms;
      const floor = listing.floor;
      return (
        typeof guests === "number" &&
        guests >= 1 &&
        typeof sqm === "number" &&
        sqm > 0 &&
        typeof beds === "number" &&
        beds >= 0 &&
        typeof baths === "number" &&
        baths >= 0 &&
        typeof floor === "number" &&
        floor >= 0
      );
    }
    case "title": {
      const title = listing.title?.trim() ?? "";
      if (!title || title === "Πρόχειρη αγγελία") return false;
      if (listingTitleValidationError(title)) return false;
      // Description is optional to continue; over-max must not count as complete.
      if (
        listingDescriptionValidationError(listing.description ?? "", {
          forSubmission: false,
        })
      ) {
        return false;
      }
      return true;
    }
    case "amenities":
      return true;
    case "pricing":
      return hasPricing(listing);
    case "photos":
      return photoCount >= MIN_LISTING_PHOTOS_REQUIRED;
    case "contact": {
      const name = listing.contact_name?.trim() ?? "";
      const phone = listing.contact_phone?.trim() ?? "";
      const email = listing.contact_email?.trim() ?? "";
      return Boolean(name && (phone || email));
    }
    case "declarations":
      return hasDeclarations(listing);
    case "trust_links":
      return true;
    case "review":
      return true;
    default:
      return false;
  }
}

/** First incomplete required active step (skips amenities / trust_links). */
export function firstIncompleteRequiredActiveStep(
  listing: WizardResumeListingSnapshot,
  photoCount = 0
): ActiveWizardStepId | null {
  for (const id of ACTIVE_WIZARD_STEP_IDS) {
    if (OPTIONAL_ACTIVE_STEPS.has(id)) continue;
    if (!isActiveStepDataSatisfied(id, listing, photoCount)) return id;
  }
  return null;
}

/**
 * Nearest previous required step that is incomplete, or null if all prior required are OK.
 * Optional steps (amenities) are never returned.
 */
export function nearestIncompletePriorRequiredStep(
  target: ActiveWizardStepId,
  listing: WizardResumeListingSnapshot,
  photoCount = 0
): ActiveWizardStepId | null {
  const targetIndex = ACTIVE_WIZARD_STEP_IDS.indexOf(target);
  if (targetIndex <= 0) return null;
  for (let i = 0; i < targetIndex; i++) {
    const id = ACTIVE_WIZARD_STEP_IDS[i]!;
    if (OPTIONAL_ACTIVE_STEPS.has(id)) continue;
    if (!isActiveStepDataSatisfied(id, listing, photoCount)) return id;
  }
  return null;
}

/**
 * Resolve which wizard step to open when continuing a draft.
 * Priority: valid stored/query resume → first incomplete required → review.
 *
 * Important: a valid stored resume is honored as-is (except stale step-1 — see
 * below). We do NOT redirect to nearestIncompletePriorRequiredStep — that caused
 * live-wizard rollbacks whenever a Server Action refresh remounted the page
 * (photo count races, placeholder city "—", title validation, etc.). Prior
 * completeness is enforced on Next.
 *
 * Stale `rental_mode` recovery: if the DB still says step 1 but rental mode is
 * already chosen, treat resume as missing and fall through to first incomplete.
 * That fixes Continue-from-dashboard landing on «Τύπος μίσθωσης» after an
 * earlier autosave wrote rental_mode and never advanced the column.
 */
export function resolveWizardResumeStep(
  listing: WizardResumeListingSnapshot | null | undefined,
  options?: {
    photoCount?: number;
    /** Optional ?step= query override (validated). */
    queryStep?: string | null;
    /**
     * @deprecated No longer redirects. Kept so callers/tests can still detect
     * incomplete priors for messaging without moving the step.
     */
    enforcePriorComplete?: boolean;
  }
): ResolveWizardResumeResult {
  const photoCount = options?.photoCount ?? 0;
  const snapshot = listing ?? {};

  const fromQuery = parseWizardResumeStep(options?.queryStep ?? null);
  const fromStored = parseWizardResumeStep(snapshot.wizard_resume_step);
  let candidate = fromQuery ?? fromStored;

  // Explicit ?step= always wins. Stored rental_mode with mode already chosen is
  // treated as missing so Continue never silently sticks on step 1.
  if (
    !fromQuery &&
    candidate === "rental_mode" &&
    hasRentalMode(snapshot)
  ) {
    candidate = null;
  }

  if (candidate) {
    const prior = nearestIncompletePriorRequiredStep(
      candidate,
      snapshot,
      photoCount
    );
    return {
      stepId: candidate,
      stepNumber: activeWizardStepNumber(candidate),
      source: "resume",
      message:
        options?.enforcePriorComplete && prior
          ? RESUME_PRIOR_REQUIRED_MSG_KEY
          : undefined,
    };
  }

  const incomplete = firstIncompleteRequiredActiveStep(snapshot, photoCount);
  if (incomplete) {
    return {
      stepId: incomplete,
      stepNumber: activeWizardStepNumber(incomplete),
      source: "first_incomplete",
    };
  }

  // All required steps done → review / preview.
  return {
    stepId: "review",
    stepNumber: activeWizardStepNumber("review"),
    source: "review",
  };
}

/** Serialize overlapping resume writes: higher generation always wins. */
export function shouldApplyResumeWrite(
  writeGeneration: number,
  latestGeneration: number
): boolean {
  return writeGeneration === latestGeneration;
}

/**
 * Pick resume step for a save payload when concurrent saves may race.
 * Prefer the step from the latest generation's form data.
 */
export function pickLatestResumeStep(
  writes: Array<{ generation: number; stepId: ActiveWizardStepId | null }>
): ActiveWizardStepId | null {
  if (writes.length === 0) return null;
  let best = writes[0]!;
  for (let i = 1; i < writes.length; i++) {
    const w = writes[i]!;
    if (w.generation >= best.generation) best = w;
  }
  return best.stepId;
}

/** Explicit user / bootstrap reasons that may change the live wizard step. */
export const WIZARD_STEP_CHANGE_REASONS = [
  "next",
  "back",
  "step_click",
  "resume",
  "start_new",
  "publish_missing_click",
  /** One-shot per mount: prefer in-tab session step over SSR. */
  "session_sync",
] as const;

export type WizardStepChangeReason = (typeof WIZARD_STEP_CHANGE_REASONS)[number];

/** Background / forbidden reasons — must never move the UI step. */
export const FORBIDDEN_WIZARD_STEP_CHANGE_REASONS = [
  "draft_refetch",
  "autosave",
  "hydrate",
  "stale_save",
  "prop_sync",
] as const;

export type ForbiddenWizardStepChangeReason =
  (typeof FORBIDDEN_WIZARD_STEP_CHANGE_REASONS)[number];

const ALLOWED_STEP_REASON_SET = new Set<string>(WIZARD_STEP_CHANGE_REASONS);
const FORBIDDEN_STEP_REASON_SET = new Set<string>(FORBIDDEN_WIZARD_STEP_CHANGE_REASONS);

export function isAllowedWizardStepChangeReason(
  reason: string
): reason is WizardStepChangeReason {
  return ALLOWED_STEP_REASON_SET.has(reason);
}

export type WizardStepChangeDecision = {
  apply: boolean;
  blocked: boolean;
  reason: string;
  detail?: string;
};

/**
 * Guard live wizard step transitions.
 * After init, "resume" / draft refetch must never overwrite the UI step.
 * Background reasons are always blocked.
 * session_sync is allowed only once per mount (caller tracks sessionSynced).
 */
export function decideWizardStepChange(options: {
  currentStep: number;
  nextStep: number;
  reason: string;
  stepInitialized: boolean;
  /** True after the one-shot session→UI sync for this mount. */
  sessionSynced?: boolean;
}): WizardStepChangeDecision {
  const { reason, stepInitialized, sessionSynced = false } = options;

  if (FORBIDDEN_STEP_REASON_SET.has(reason)) {
    return {
      apply: false,
      blocked: true,
      reason,
      detail: "background_step_change_forbidden",
    };
  }

  if (!isAllowedWizardStepChangeReason(reason)) {
    return {
      apply: false,
      blocked: true,
      reason,
      detail: "unknown_step_change_reason",
    };
  }

  if (reason === "session_sync" && sessionSynced) {
    return {
      apply: false,
      blocked: true,
      reason,
      detail: "session_sync_already_applied",
    };
  }

  if (reason === "resume" && stepInitialized) {
    return {
      apply: false,
      blocked: true,
      reason,
      detail: "resume_after_init_forbidden",
    };
  }

  return { apply: true, blocked: false, reason };
}

/**
 * Pick the step number to show after a remount.
 * Session may be ahead of SSR (mid-wizard remount). A *lower* session step must
 * never beat SSR/DB — that caused Continue-from-dashboard to open step 1 when
 * sessionStorage still held stale `rental_mode` from an earlier visit.
 */
export function preferSessionWizardStep(
  sessionStepId: ActiveWizardStepId | null | undefined,
  ssrStepNumber: number | null | undefined,
  catalogLength = ACTIVE_WIZARD_STEP_IDS.length
): { stepId: ActiveWizardStepId; stepNumber: number; source: "session" | "ssr" | "first" } {
  const ssrValid =
    typeof ssrStepNumber === "number" &&
    Number.isInteger(ssrStepNumber) &&
    ssrStepNumber >= 1 &&
    ssrStepNumber <= catalogLength;
  const ssrId = ssrValid
    ? activeWizardStepIdFromNumber(ssrStepNumber) ?? null
    : null;

  if (sessionStepId && ssrId) {
    const best = preferHigherResumeStep(sessionStepId, ssrId)!;
    const fromSession = best === sessionStepId &&
      activeWizardStepNumber(sessionStepId) >= activeWizardStepNumber(ssrId);
    return {
      stepId: best,
      stepNumber: activeWizardStepNumber(best),
      source: fromSession ? "session" : "ssr",
    };
  }
  if (sessionStepId) {
    return {
      stepId: sessionStepId,
      stepNumber: activeWizardStepNumber(sessionStepId),
      source: "session",
    };
  }
  if (ssrId && ssrValid) {
    return { stepId: ssrId, stepNumber: ssrStepNumber, source: "ssr" };
  }
  return {
    stepId: ACTIVE_WIZARD_STEP_IDS[0],
    stepNumber: 1,
    source: "first",
  };
}

/**
 * Autosave must never persist a lower resume step than the high-water mark
 * from explicit navigation. Explicit nav/back/save-exit uses the UI step as-is.
 */
export function resumeStepForAutosave(
  uiStepId: ActiveWizardStepId,
  highWaterStepId: ActiveWizardStepId | null
): ActiveWizardStepId {
  if (!highWaterStepId) return uiStepId;
  return activeWizardStepNumber(uiStepId) >= activeWizardStepNumber(highWaterStepId)
    ? uiStepId
    : highWaterStepId;
}

/** Prefer the higher of two resume step ids (null-safe). */
export function preferHigherResumeStep(
  a: ActiveWizardStepId | null | undefined,
  b: ActiveWizardStepId | null | undefined
): ActiveWizardStepId | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return activeWizardStepNumber(a) >= activeWizardStepNumber(b) ? a : b;
}

/**
 * One-shot initial step for draft open / remount.
 * Priority: query → max(session, DB resume / first incomplete).
 * Session may win when ahead of DB (mid-wizard remount). Empty or lower
 * session must not block DB resume when opening Continue from the dashboard.
 */
export function resolveInitialWizardStep(
  listing: WizardResumeListingSnapshot | null | undefined,
  options?: {
    photoCount?: number;
    queryStep?: string | null;
    /** 1-based step from sessionStorage for this draft tab. */
    sessionStepNumber?: number | null;
  }
): ResolveWizardResumeResult {
  const fromQuery = parseWizardResumeStep(options?.queryStep ?? null);
  if (fromQuery) {
    return resolveWizardResumeStep(listing, {
      photoCount: options?.photoCount,
      queryStep: fromQuery,
    });
  }

  const fromDb = resolveWizardResumeStep(listing, {
    photoCount: options?.photoCount,
    queryStep: null,
  });

  const sessionN = options?.sessionStepNumber;
  if (
    typeof sessionN === "number" &&
    Number.isInteger(sessionN) &&
    sessionN >= 1 &&
    sessionN <= ACTIVE_WIZARD_STEP_IDS.length
  ) {
    const sessionId = activeWizardStepIdFromNumber(sessionN);
    if (sessionId) {
      const best = preferHigherResumeStep(sessionId, fromDb.stepId)!;
      if (best === fromDb.stepId) {
        return fromDb;
      }
      return {
        stepId: best,
        stepNumber: activeWizardStepNumber(best),
        source: "resume",
        message: fromDb.message,
      };
    }
  }

  return fromDb;
}
