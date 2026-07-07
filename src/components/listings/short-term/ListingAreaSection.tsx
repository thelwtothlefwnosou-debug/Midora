import { ExternalLink, MapPinned } from "lucide-react";
import { PropertyMapLoader } from "@/components/map/PropertyMapLoader";
import type { ListingPublicDetail } from "@/lib/types";
import { buildExternalMapsUrl } from "@/lib/geocoding/nominatim";
import {
  getListingMapCenter,
  listingShowsExactPublicLocation,
} from "@/lib/listing-map";

export function ListingAreaSection({ listing }: { listing: ListingPublicDetail }) {
  const exact = listingShowsExactPublicLocation(listing);
  const hasCoords = listing.latitude != null && listing.longitude != null;
  const mapCenter = hasCoords
    ? getListingMapCenter(
        listing.id,
        listing.latitude!,
        listing.longitude!,
        listing.location_confirmed_by_owner
      )
    : null;

  const displayCity = listing.city_display_name || listing.city;
  const displayArea = listing.area_display_name || listing.area;
  const addressLine =
    listing.formatted_address ||
    [listing.address_street, listing.address_number, displayCity]
      .filter(Boolean)
      .join(", ");

  const hints = [
    listing.nearby_metro && { label: "Κοντινότερο μετρό / στάση", value: listing.nearby_metro },
    listing.distance_beach && { label: "Απόσταση από παραλία", value: listing.distance_beach },
    listing.distance_center && { label: "Απόσταση από κέντρο", value: listing.distance_center },
    listing.distance_airport && { label: "Απόσταση από αεροδρόμιο", value: listing.distance_airport },
    listing.distance_port && { label: "Απόσταση από λιμάνι", value: listing.distance_port },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <section id="area" className="listing-section scroll-mt-28">
      <h2 className="listing-section-title">Τοποθεσία</h2>
      <p className="listing-meta mt-3">
        {displayArea}, {displayCity}
      </p>
      {addressLine && exact && (
        <p className="mt-2 text-sm text-charcoal/85">{addressLine}</p>
      )}
      {!exact && (
        <p className="mt-2 text-sm text-muted">
          Η ακριβής διεύθυνση κοινοποιείται μετά την επικοινωνία με τον ιδιοκτήτη.
        </p>
      )}
      {hints.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-charcoal/80">
          {hints.map((h) => (
            <li key={h.label}>
              <span className="text-muted">{h.label}:</span> {h.value}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 overflow-hidden rounded-2xl">
        {mapCenter && hasCoords ? (
          <PropertyMapLoader
            listingId={listing.id}
            lat={listing.latitude!}
            lng={listing.longitude!}
            title={listing.title}
            height="380px"
            exactLocation={exact}
          />
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white px-6 text-center">
            <MapPinned className="h-10 w-10 text-gold" />
            <p className="mt-4 font-medium text-charcoal">
              {displayArea}, {displayCity}
            </p>
          </div>
        )}
      </div>
      {mapCenter && (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={buildExternalMapsUrl(mapCenter.lat, mapCenter.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:border-gold/30"
          >
            <ExternalLink className="h-4 w-4 text-gold-dark" />
            Άνοιγμα περιοχής στους Χάρτες
          </a>
        </div>
      )}
      {!exact && hasCoords && (
        <p className="mt-3 text-xs text-muted">
          Η ακριβής τοποθεσία επιβεβαιώνεται απευθείας με τον αγγελιοδότη. Ο χάρτης δείχνει
          κατά προσέγγιση την περιοχή.
        </p>
      )}
    </section>
  );
}
