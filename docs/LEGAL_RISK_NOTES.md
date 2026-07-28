# Midora — Internal legal risk notes

**INTERNAL ONLY — do not publish this document on the website.**

Last updated: 2026-07-18

## Midora role

Midora is a **listing + inquiry platform only**.

- Midora is **not** a booking platform.
- Midora does **not** process payments for stays/rentals.
- Midora does **not** collect deposits for stays/rentals.
- Midora does **not** handle damage claims or compensation.
- Midora does **not** provide insurance.
- Midora does **not** submit AADE declarations.
- Midora does **not** provide tax, legal, or accounting advice.

Owner listing-visibility fees (e.g. Stripe checkout for publishing) are **platform fees for listing visibility**, not guest booking/payment.

## What we must not build / imply

- Incident report / damage report / «Καταγραφή περιστατικού»
- Damage photos upload, estimated damage amount, export damage summary
- Damage management dashboard, claim APIs, compensation flows
- Guest booking / checkout / «Κράτηση τώρα»
- Midora-managed rental payments, payment protection, service fees on stays
- «Επαληθευμένο ακίνητο» / «Εγγυημένη διαμονή» as Midora guarantees
- Midora submitting or verifying AADE filings for users

Damage responsibility exists **only** as FAQ + Terms limitation copy.

## AADE guidance (informational)

- Owners remain responsible for tax/legal obligations.
- Users may see an AADE option such as **«Άλλες ψηφιακές πλατφόρμες»** and may write Midora **if the AADE application allows it** and the agreement came from Midora.
- Midora must **not** instruct users to choose Airbnb / Booking.com / Vrbo unless the agreement actually came from those platforms.
- All AADE Help copy must end with a general-information disclaimer (not tax advice).

Canonical user-facing strings: `src/lib/midora-legal-copy.ts`.

## Owner declarations

Before listing submit/publish for review, owners must accept declarations covering:

1. Right to publish / accuracy
2. Registry number (AMA/ESL/MAG) where required
3. Midora role (listing + inquiry only)
4. Tax/legal obligations (owner responsible; Midora does not file AADE)
5. Possible lawful disclosure to authorities (e.g. AADE)
6. Terms / Listing Rules / Privacy

## Visitor inquiry acknowledgement

Inquiry forms must state that the request is **not** a booking or lease, and that agreement/payment happen off-platform.

## Reporting

Public «Αναφορά αγγελίας» is **moderation/safety only**. It must not imply dispute handling, damage verification, or compensation.

## External platform links

Trust links show that a listing may exist elsewhere. They are **not** Midora verification of Airbnb/Booking/Vrbo.

## Address visibility

Never expose floor, apartment number, doorbell, lockbox, or private check-in instructions on the public listing by default. Use approximate / after-inquiry / owner opt-in exact copy from `midora-legal-copy.ts`.

## Pre-launch legal review required

Before public launch, obtain professional review of:

- Terms of Use
- Privacy Policy
- Cookies
- Publishing Rules
- DAC7 / platform reporting obligations (if applicable)
- EU short-term rental platform data obligations (if applicable)
- AADE / Greek short-term rental platform obligations (if any)

This document is guidance for product/engineering. It is **not** legal advice.
