import Link from "next/link";
import {
  Phone,
  UserRound,
  Home,
  Shield,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import {
  listingRentalType,
  requiresAmaRegistry,
} from "@/lib/rental-types";

function profileComplete(profile: {
  full_name?: string | null;
  phone?: string | null;
  avatar_path?: string | null;
  avatar_status?: string | null;
}): boolean {
  return Boolean(
    profile.full_name?.trim() &&
      profile.phone?.trim() &&
      profile.avatar_path?.trim() &&
      profile.avatar_status === "active"
  );
}

export default async function VerificationDashboardPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/verification");
  const listings = await getUserListings(profile.id);

  const phoneVerified = Boolean(profile.primary_phone_verified_at);
  const profileDone = profileComplete(profile);

  const listingChecks = listings.map((listing) => {
    const needsAma = requiresAmaRegistry(
      listingRentalType(listing),
      listing.accepts_under_60_days
    );
    const photoCount =
      listing.listing_images?.filter((i) => i.media_type !== "video").length ?? 0;
    return {
      id: listing.id,
      title: listing.title,
      registryOk:
        !needsAma ||
        Boolean(listing.ama_number?.trim() && listing.legal_registry_type !== "none"),
      locationOk: Boolean(
        listing.latitude != null &&
          listing.longitude != null &&
          listing.location_confirmed_by_owner
      ),
      photosOk: photoCount >= MIN_LISTING_PHOTOS_FOR_REVIEW,
      declarationsOk: Boolean(
        listing.owner_responsibility_accepted &&
          (!needsAma || listing.ama_declaration_accepted)
      ),
    };
  });

  const anyListings = listings.length > 0;
  const allListingItemsDone =
    anyListings &&
    listingChecks.every(
      (c) => c.registryOk && c.locationOk && c.photosOk && c.declarationsOk
    );

  const listingSummaryItems = [
    {
      label: "Αριθμός καταχώρισης",
      done: listingChecks.every((c) => c.registryOk),
    },
    {
      label: "Τοποθεσία",
      done: listingChecks.every((c) => c.locationOk),
    },
    {
      label: "Φωτογραφίες",
      done: listingChecks.every((c) => c.photosOk),
    },
    {
      label: "Δηλώσεις",
      done: listingChecks.every((c) => c.declarationsOk),
    },
  ];

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="verification"
      title="Επαλήθευση λογαριασμού"
      subtitle="Ολοκλήρωσε τα βασικά στοιχεία για να ενισχύσεις την αξιοπιστία των αγγελιών σου"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 1. Phone */}
        <GlassCard className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand">
              <Phone className="h-5 w-5 text-charcoal/70" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-charcoal">Τηλέφωνο</h2>
              <p className="mt-1 text-sm text-muted">
                Επιβεβαίωση κινητού για αξιόπιστη επικοινωνία
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            {phoneVerified ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-teal" />
                <span className="font-medium text-teal">Επιβεβαιώθηκε</span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 text-muted" />
                <span className="text-muted">Δεν έχει επιβεβαιωθεί</span>
              </>
            )}
          </div>
          {!phoneVerified && (
            <Button href="/dashboard/settings/contact" className="mt-5" size="sm">
              Επιβεβαίωση τηλεφώνου
            </Button>
          )}
        </GlassCard>

        {/* 2. Profile */}
        <GlassCard className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand">
              <UserRound className="h-5 w-5 text-charcoal/70" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-charcoal">Στοιχεία προφίλ</h2>
              <p className="mt-1 text-sm text-muted">Όνομα, τηλέφωνο και φωτογραφία προφίλ</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            {profileDone ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-teal" />
                <span className="font-medium text-teal">Ολοκληρωμένο</span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 text-muted" />
                <span className="text-muted">Ατελές</span>
              </>
            )}
          </div>
          {!profileDone && (
            <Button href="/dashboard/settings?tab=profile" className="mt-5" size="sm">
              Συμπλήρωση προφίλ
            </Button>
          )}
        </GlassCard>

        {/* 3. Listing compliance */}
        <GlassCard className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand">
              <Home className="h-5 w-5 text-charcoal/70" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-charcoal">Στοιχεία αγγελίας</h2>
              <p className="mt-1 text-sm text-muted">
                Καταχώριση, τοποθεσία, φωτογραφίες και δηλώσεις
              </p>
            </div>
          </div>
          {!anyListings ? (
            <p className="mt-4 text-sm text-muted">
              Δεν έχεις ακόμα αγγελίες.{" "}
              <Link href="/dashboard/listings/new" className="text-gold hover:underline">
                Δημοσίευσε την πρώτη σου
              </Link>
            </p>
          ) : (
            <>
              <ul className="mt-4 space-y-2">
                {listingSummaryItems.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted" />
                    )}
                    <span className={item.done ? "text-charcoal" : "text-muted"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              {!allListingItemsDone && (
                <Button href="/dashboard/listings" className="mt-5" size="sm">
                  Έλεγχος αγγελιών
                </Button>
              )}
            </>
          )}
        </GlassCard>

        {/* 4. Identity — coming soon */}
        <GlassCard className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand">
              <Shield className="h-5 w-5 text-charcoal/70" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-charcoal">Ταυτοποίηση ταυτότητας</h2>
              <p className="mt-1 text-sm text-muted">
                Επαλήθευση μέσω εξωτερικού παρόχου (όχι φωτογραφία προφίλ)
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Clock className="h-4 w-4" />
            <span>Σύντομα διαθέσιμο</span>
          </div>
        </GlassCard>
      </div>
    </AccountShell>
  );
}
