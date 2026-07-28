"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminReviewStickyPanel } from "@/components/admin/AdminReviewStickyPanel";
import { AdminRegistryCell } from "@/components/admin/AdminRegistryCell";
import {
  adminLogListingOpenedForReview,
  adminApproveListingLocation,
  adminRequestLocationCorrection,
  adminMarkRegistryReviewed,
} from "@/lib/admin/actions";
import { AdminLocationPinEditor } from "@/components/admin/AdminLocationPinEditor";
import { ListingImageCarousel } from "@/components/listings/ListingImageCarousel";
import {
  formatAmaDisplay,
  formatListingPrice,
  formatMinStayLabel,
  listingRentalType,
  rentalTypeLabel,
  requiresAmaRegistry,
  VERIFICATION_STATUS_LABELS,
} from "@/lib/rental-types";
import {
  getRegistryOwnerStatus,
  REGISTRY_OWNER_STATUS_LABELS,
} from "@/lib/registry-compliance";
import type { ListingApprovalChecklist } from "@/lib/admin/listing-approval-checklist";
import type { ListingImage, ListingWithImages } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getListingPublicId } from "@/lib/utils";

type ReportRow = {
  id: string;
  reason?: string | null;
  description?: string | null;
  status: string;
  created_at: string;
};

type PeriodRow = {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
};

type PriceRuleRow = {
  id: string;
  start_date: string;
  end_date: string;
  price_per_night?: number | null;
  price_monthly?: number | null;
};

type OwnerStats = {
  listingCount: number;
  memberSince: string | null;
  email: string | null;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="font-display text-lg font-semibold text-charcoal">{title}</h2>
      <div className="mt-4 space-y-2 text-sm">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p>
      <span className="text-muted">{label}: </span>
      <span className="text-charcoal">{value ?? "—"}</span>
    </p>
  );
}

function formatPrivateAddress(listing: ListingWithImages): string {
  const parts = [
    listing.address_street,
    listing.address_number,
    listing.address_postal_code,
    listing.area,
    listing.city,
  ].filter(Boolean);
  if (parts.length >= 3) return parts.join(", ");
  return listing.address ?? "—";
}

export function AdminListingDetail({
  listing,
  reports = [],
  unavailablePeriods = [],
  priceRules = [],
  ownerStats,
  checklist,
}: {
  listing: ListingWithImages;
  reports?: ReportRow[];
  unavailablePeriods?: PeriodRow[];
  priceRules?: PriceRuleRow[];
  ownerStats?: OwnerStats;
  checklist?: ListingApprovalChecklist;
}) {
  const [error, setError] = useState<string | null>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const rentalType = listingRentalType(listing);
  const needsRegistry = requiresAmaRegistry(rentalType, listing.accepts_under_60_days);
  const price = formatListingPrice(listing);
  const owner = listing.profiles as {
    full_name?: string;
    phone?: string;
    email?: string;
    created_at?: string;
  } | null;
  const images = (listing.listing_images ?? []).filter(
    (img) => img.media_type !== "video"
  ) as ListingImage[];
  const cover =
    images.find((img) => img.is_cover) ?? images.sort((a, b) => a.sort_order - b.sort_order)[0];

  useEffect(() => {
    void adminLogListingOpenedForReview(listing.id);
  }, [listing.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Έλεγχος αγγελίας</p>
          <h1 className="font-display text-2xl font-semibold text-charcoal">{listing.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {listing.area}, {listing.city} · {rentalTypeLabel(rentalType)} · {price.display}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {listing.status === "approved" && (
            <Link
              href={`/listings/${getListingPublicId(listing)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gold/40 bg-gold/5 px-3 py-2 text-sm font-medium text-charcoal hover:bg-gold/10"
            >
              Δημόσια προβολή
            </Link>
          )}
          <Link
            href="/admin/listings"
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-charcoal"
          >
            ← Επιστροφή στη λίστα
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6">
      <Section title="Φωτογραφίες">
        <p className="text-muted">
          {images.length} αποθηκευμένες φωτογραφίες
          {cover ? " · κύρια επιλεγμένη" : ""}
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <ListingImageCarousel
            images={images}
            alt={listing.title}
            imageClassName="h-72 w-full object-cover"
            onImageClick={() => setFullscreenIndex(0)}
          />
        </div>
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setFullscreenIndex(index)}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-lg border",
                  img.id === cover?.id ? "border-gold ring-2 ring-gold/40" : "border-border"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Βασικά στοιχεία">
          <Field label="Τύπος μίσθωσης" value={rentalTypeLabel(rentalType)} />
          <Field label="Κατάσταση" value={`${listing.approval_status ?? listing.status}${listing.is_hidden ? " (κρυφή)" : ""}`} />
          <Field label="Τιμή" value={price.display} />
          <Field label="Τύπος ακινήτου" value={listing.property_type} />
          <Field label="Τ.Μ." value={listing.sqm != null ? `${listing.sqm} τ.μ.` : null} />
          <Field label="Υπνοδωμάτια" value={listing.bedrooms} />
          <Field label="Μπάνια" value={listing.bathrooms} />
          <Field
            label="Όροφος"
            value={
              listing.floor == null
                ? null
                : listing.floor === 0
                  ? "Ισόγειο"
                  : `${listing.floor}ος`
            }
          />
          <Field label="Μέγ. αριθμός ατόμων" value={listing.max_guests} />
          <Field label="Ελάχιστη διαμονή" value={formatMinStayLabel(listing) ?? listing.min_stay_label} />
        </Section>

        <Section title="Τοποθεσία">
          <Field label="Δημόσια πόλη" value={listing.city} />
          <Field label="Δημόσια περιοχή" value={listing.area} />
          <div className="rounded-lg bg-sand/40 p-3">
            <p className="text-xs font-medium uppercase text-muted">Ιδιωτική διεύθυνση (μόνο admin)</p>
            <p className="mt-1 text-charcoal">{formatPrivateAddress(listing)}</p>
            {(listing.address_floor || listing.floor != null) && (
              <p className="mt-1 text-muted">
                Όροφος:{" "}
                {listing.address_floor?.trim() ||
                  (listing.floor === 0 ? "Ισόγειο" : `${listing.floor}ος`)}
              </p>
            )}
            {listing.address_unit && (
              <p className="text-muted">Διαμέρισμα: {listing.address_unit}</p>
            )}
          </div>
        </Section>
      </div>

      <Section title="Περιγραφή">
        <p className="whitespace-pre-wrap text-muted">{listing.description}</p>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Στοιχεία μίσθωσης">
          {rentalType === "short_term" ? (
            <>
              <Field label="Τιμή ανά βράδυ" value={listing.price_per_night ? `€${listing.price_per_night}` : null} />
              <Field label="Included guests" value={listing.included_guests} />
              <Field label="Extra guest fee" value={listing.extra_guest_fee_per_night != null ? `€${listing.extra_guest_fee_per_night}` : null} />
            </>
          ) : (
            <>
              <Field label="Μηνιαία τιμή" value={listing.price_monthly ? `€${listing.price_monthly}` : null} />
              <Field label="Δέχεται κρατήσεις κάτω των 60 ημερών" value={listing.accepts_under_60_days ? "Ναι" : "Όχι"} />
            </>
          )}
          {needsRegistry && (
            <>
              <Field label="Τύπος καταχώρισης" value={listing.legal_registry_type?.toUpperCase()} />
              <Field label="Αριθμός καταχώρισης" value={formatAmaDisplay(listing) ?? "Λείπει"} />
            </>
          )}
        </Section>

        <Section title="Στοιχεία αγγελιοδότη">
          <Field label="Όνομα" value={listing.contact_name ?? owner?.full_name} />
          <Field label="Email" value={listing.contact_email ?? ownerStats?.email ?? owner?.email} />
          <Field label="Τηλέφωνο" value={listing.contact_phone ?? owner?.phone} />
          <Field
            label="Ημερομηνία εγγραφής"
            value={
              ownerStats?.memberSince
                ? new Date(ownerStats.memberSince).toLocaleDateString("el-GR")
                : owner?.created_at
                  ? new Date(owner.created_at).toLocaleDateString("el-GR")
                  : null
            }
          />
          <Field label="Αριθμός αγγελιών" value={ownerStats?.listingCount} />
        </Section>
      </div>

      <Section title="Δηλώσεις αγγελιοδότη">
        <Field
          label="Δικαίωμα δημοσίευσης / ακρίβεια"
          value={listing.owner_responsibility_accepted ? "Αποδεκτή" : "Λείπει"}
        />
        {listing.owner_responsibility_accepted && listing.updated_at && (
          <Field
            label="Χρόνος αποδοχής (δικαίωμα δημοσίευσης)"
            value={new Date(listing.updated_at).toLocaleString("el-GR")}
          />
        )}
        {needsRegistry && (
          <>
            <Field
              label="Δήλωση αριθμού καταχώρισης"
              value={listing.ama_declaration_accepted ? "Αποδεκτή" : "Λείπει"}
            />
            {listing.ama_declaration_accepted && listing.updated_at && (
              <Field
                label="Χρόνος αποδοχής (αριθμός καταχώρισης)"
                value={new Date(listing.updated_at).toLocaleString("el-GR")}
              />
            )}
          </>
        )}
        <Field
          label="Ρόλος Midora"
          value={listing.platform_role_accepted ? "Αποδεκτή" : "Λείπει"}
        />
        {listing.platform_role_accepted && listing.updated_at && (
          <Field
            label="Χρόνος αποδοχής (ρόλος Midora)"
            value={new Date(listing.updated_at).toLocaleString("el-GR")}
          />
        )}
        <Field
          label="Όροι / Απόρρητο"
          value={listing.terms_privacy_accepted ? "Αποδεκτή" : "Λείπει"}
        />
        {listing.terms_privacy_accepted && listing.declarations_submitted_at && (
          <Field
            label="Χρόνος αποδοχής (όροι / απόρρητο)"
            value={new Date(listing.declarations_submitted_at).toLocaleString("el-GR")}
          />
        )}
        {listing.declarations_submitted_at && (
          <Field
            label="Υποβολή δηλώσεων"
            value={new Date(listing.declarations_submitted_at).toLocaleString("el-GR")}
          />
        )}
        <Field
          label="Βραχυχρόνια μίσθωση"
          value={listing.supports_short_term ? "Ναι" : "Όχι"}
        />
        <Field
          label="Διαμονές κάτω 60 ημερών (μηνιαία)"
          value={
            listing.supports_monthly
              ? listing.accepts_under_60_days
                ? "Ναι"
                : "Όχι"
              : "—"
          }
        />
      </Section>

      <Section title="Ακριβής τοποθεσία ακινήτου">
        <Field
          label="Πλήρης διεύθυνση"
          value={listing.formatted_address ?? listing.address ?? "—"}
        />
        <Field label="Οδός" value={listing.private_street ?? listing.address_street ?? "—"} />
        <Field label="Αριθμός" value={listing.private_street_number ?? listing.address_number ?? "—"} />
        <Field
          label="Τ.Κ."
          value={listing.private_postal_code ?? listing.address_postal_code ?? "—"}
        />
        <Field
          label="Συντεταγμένες"
          value={
            listing.latitude != null && listing.longitude != null
              ? `${listing.latitude}, ${listing.longitude}`
              : "—"
          }
        />
        <Field
          label="Επιβεβαίωση από αγγελιοδότη"
          value={listing.location_confirmed_by_owner ? "Ναι" : "Όχι"}
        />
        {listing.location_confirmed_at && (
          <Field
            label="Χρόνος επιβεβαίωσης"
            value={new Date(listing.location_confirmed_at).toLocaleString("el-GR")}
          />
        )}
        <Field
          label="Χειροκίνητη μετακίνηση pin"
          value={listing.location_pin_moved_manually ? "Ναι" : "Όχι"}
        />
        {listing.latitude != null && listing.longitude != null && (
          <AdminLocationPinEditor
            listingId={listing.id}
            initialLat={listing.latitude}
            initialLng={listing.longitude}
          />
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await adminApproveListingLocation(listing.id);
                if (result?.error) setError(result.error);
              })
            }
            className="rounded-lg border border-teal/40 bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal/15 disabled:opacity-50"
          >
            Η τοποθεσία είναι σωστή
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await adminRequestLocationCorrection(listing.id);
                if (result?.error) setError(result.error);
              })
            }
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            Ζήτησε διόρθωση τοποθεσίας
          </button>
        </div>
      </Section>

      {needsRegistry && (
        <Section title="Αριθμός καταχώρισης βραχυχρόνιας μίσθωσης">
          <Field
            label="Τύπος μίσθωσης"
            value={
              rentalType === "short_term"
                ? "Βραχυχρόνια"
                : listing.accepts_under_60_days
                  ? "Μηνιαία με διαμονές κάτω των 60 ημερών"
                  : "Μηνιαία"
            }
          />
          <Field label="Τύπος αριθμού" value={listing.legal_registry_type?.toUpperCase() ?? "—"} />
          <Field label="Αριθμός καταχώρισης" value={listing.ama_number ?? "—"} />
          <Field
            label="Κατάσταση συμπλήρωσης"
            value={
              REGISTRY_OWNER_STATUS_LABELS[
                getRegistryOwnerStatus({
                  legalRegistryType: listing.legal_registry_type ?? "none",
                  amaNumber: listing.ama_number ?? "",
                  propertyVerificationStatus: listing.property_verification_status,
                })
              ]
            }
          />
        </Section>
      )}

      <Section title="Επαλήθευση">
        <Field
          label="Επαλήθευση αγγελιοδότη"
          value={VERIFICATION_STATUS_LABELS[listing.advertiser_verification_status ?? "not_started"]}
        />
        <Field
          label="Επαλήθευση ακινήτου"
          value={VERIFICATION_STATUS_LABELS[listing.property_verification_status ?? "not_started"]}
        />
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className="text-muted">Έλεγχος καταχώρισης:</span>
          <AdminRegistryCell listing={listing} />
          {needsRegistry && formatAmaDisplay(listing) && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await adminMarkRegistryReviewed(listing.id);
                  if (result?.error) setError(result.error);
                })
              }
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-sand disabled:opacity-50"
            >
              Σημείωση βασικού ελέγχου καταχώρισης
            </button>
          )}
        </div>
        {listing.admin_verification_notes && (
          <div className="mt-3 rounded-lg bg-sand/40 p-3">
            <p className="text-xs font-medium text-muted">Σημειώσεις admin</p>
            <p className="mt-1 whitespace-pre-wrap text-charcoal">{listing.admin_verification_notes}</p>
          </div>
        )}
      </Section>

      {(unavailablePeriods.length > 0 || priceRules.length > 0) && (
        <Section title="Διαθεσιμότητα & τιμές">
          {unavailablePeriods.length > 0 && (
            <div>
              <p className="mb-2 font-medium text-charcoal">Μη διαθέσιμες περίοδοι</p>
              <ul className="space-y-1 text-muted">
                {unavailablePeriods.map((p) => (
                  <li key={p.id}>
                    {p.start_date} – {p.end_date}
                    {p.reason ? ` (${p.reason})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {priceRules.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 font-medium text-charcoal">Price rules</p>
              <ul className="space-y-1 text-muted">
                {priceRules.map((rule) => (
                  <li key={rule.id}>
                    {rule.start_date} – {rule.end_date}
                    {rule.price_per_night != null ? ` · €${rule.price_per_night}/βράδυ` : ""}
                    {rule.price_monthly != null ? ` · €${rule.price_monthly}/μήνα` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {reports.length > 0 && (
        <Section title="Αναφορές">
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-lg bg-sand/40 p-3">
                <p className="font-medium text-charcoal">
                  {r.reason ?? "—"} · {r.status}
                </p>
                {r.description && <p className="mt-1 text-muted">{r.description}</p>}
                <p className="mt-1 text-xs text-muted">
                  {new Date(r.created_at).toLocaleString("el-GR")}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

        </div>

        <AdminReviewStickyPanel
          listingId={listing.id}
          ownerUserId={listing.user_id}
          isHidden={Boolean(listing.is_hidden)}
          canApprove={checklist?.canApprove ?? true}
          checklist={checklist}
          onError={setError}
          onSuccess={() => router.refresh()}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {fullscreenIndex != null && images[fullscreenIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 p-4"
          onClick={() => setFullscreenIndex(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[fullscreenIndex].url}
            alt=""
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
