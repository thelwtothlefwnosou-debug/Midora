import Link from "next/link";
import { getListingPublicId } from "@/lib/utils";
import { FreeHostingMark } from "@/components/brand/FreeHostingMark";
import { cn } from "@/lib/utils";

type CompactOffer = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingHref: string;
  city?: string | null;
  area?: string | null;
  coverUrl?: string | null;
  windowLabel: string;
};

type Props = {
  className?: string;
  /** Real offers only — never invent cards. */
  offers?: CompactOffer[];
  emptyLabel?: string;
};

/**
 * Right-rail branded visual for Free Hosting modules.
 * Geometry echoes the hospitality mark: soft arcs, open circles, restrained gold.
 * With real offers: compact previews. With zero: editorial geometry only.
 */
export function FreeHostingVisualPanel({
  className,
  offers = [],
  emptyLabel,
}: Props) {
  const hasOffers = offers.length > 0;

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[1.5rem] border border-charcoal/8",
        "bg-gradient-to-br from-[#f7f1e8] via-[#fbf8f3] to-[#e8dfd2]",
        "min-h-[220px] sm:min-h-[260px] lg:min-h-full lg:min-h-[320px]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -right-8 -top-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(185,140,90,0.22),transparent_68%)]" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(44,40,37,0.06),transparent_70%)]" />
        <svg
          className="absolute inset-0 h-full w-full text-charcoal opacity-[0.13]"
          viewBox="0 0 400 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          {/* Soft availability arcs + connection paths (not door posts) */}
          <path
            d="M36 250 C70 180, 110 120, 160 96 C210 72, 250 78, 280 110"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M70 260 C120 210, 170 170, 230 150 C280 134, 320 142, 348 170"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.75"
          />
          <circle cx="300" cy="96" r="46" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="300" cy="96" r="22" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
          <path
            d="M48 72h64M48 92h44M48 112h28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.55"
          />
          {/* Soft heart silhouette echoing HeartHandshake mark */}
          <path
            d="M300 248
               C268 226 246 200 246 174
               C246 156 258 144 274 144
               C284 144 292 150 300 160
               C308 150 316 144 326 144
               C342 144 354 156 354 174
               C354 200 332 226 300 248 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.4"
          />
        </svg>
      </div>

      <div className="relative flex h-full flex-col justify-between gap-5 p-5 sm:p-6 lg:p-7">
        <div className="flex items-start justify-between gap-3">
          <FreeHostingMark className="h-11 w-11 sm:h-12 sm:w-12" title={emptyLabel} />
          <span className="rounded-full border border-charcoal/10 bg-white/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-charcoal/70 uppercase backdrop-blur-sm">
            Midora
          </span>
        </div>

        {hasOffers ? (
          <ul className="space-y-2.5">
            {offers.slice(0, 3).map((offer) => (
              <li key={offer.id}>
                <Link
                  href={offer.listingHref}
                  className="group flex items-center gap-3 rounded-xl border border-charcoal/8 bg-white/80 p-2 pr-3 shadow-soft backdrop-blur-sm transition hover:border-gold/35 hover:bg-white"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                    {offer.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={offer.coverUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <FreeHostingMark className="h-5 w-5 text-gold/80" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-charcoal group-hover:text-charcoal">
                      {offer.listingTitle}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">
                      {[offer.area, offer.city].filter(Boolean).join(" · ")}
                      {offer.windowLabel ? ` · ${offer.windowLabel}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="max-w-[16rem]">
            <p className="font-display text-lg font-semibold leading-snug tracking-tight text-charcoal sm:text-xl">
              {emptyLabel}
            </p>
            <div className="mt-4 h-px w-16 bg-gold/50" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}

export function toCompactFreeHostingOffers(
  offers: {
    id: string;
    listingId: string;
    startDate: string;
    endExclusive: string;
    listing: {
      id: string;
      title: string;
      slug?: string | null;
      city?: string | null;
      area?: string | null;
      listing_images?: { url: string; is_cover?: boolean | null; sort_order?: number | null }[];
    };
  }[],
  formatWindow: (start: string, endExclusive: string) => string
): CompactOffer[] {
  return offers.map((offer) => {
    const images = [...(offer.listing.listing_images ?? [])].sort((a, b) => {
      const aCover = a.is_cover ? 1 : 0;
      const bCover = b.is_cover ? 1 : 0;
      if (aCover !== bCover) return bCover - aCover;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
    return {
      id: offer.id,
      listingId: offer.listingId,
      listingTitle: offer.listing.title,
      listingHref: `/listings/${getListingPublicId(offer.listing)}`,
      city: offer.listing.city,
      area: offer.listing.area,
      coverUrl: images[0]?.url ?? null,
      windowLabel: formatWindow(offer.startDate, offer.endExclusive),
    };
  });
}
