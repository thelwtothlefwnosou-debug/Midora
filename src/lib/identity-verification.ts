/**
 * Placeholder identity verification integration.
 * Future providers: Stripe Identity, Veriff, Sumsub.
 *
 * Midora stores ONLY:
 * - identity_verification_status
 * - identity_provider
 * - identity_verified_at
 *
 * Never store ID images, selfies, or raw document files.
 */

export type IdentityVerificationStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "failed"
  | "needs_review";

/** TODO: Create session with external provider when API keys are configured */
export async function createIdentityVerificationSession(
  _userId: string
): Promise<{ url: string | null; error?: string }> {
  return {
    url: null,
    error: "Η επαλήθευση ταυτότητας θα είναι σύντομα διαθέσιμη.",
  };
}

/** TODO: Handle webhook from Stripe Identity / Veriff / Sumsub */
export async function handleIdentityVerificationWebhook(
  _payload: unknown
): Promise<void> {
  // Store only verification result metadata — never document images
}

/** TODO: Persist result on profiles or advertiser verification fields */
export async function updateIdentityVerificationStatus(
  _userId: string,
  _status: IdentityVerificationStatus,
  _provider?: string | null
): Promise<void> {
  // Placeholder until provider integration
}
