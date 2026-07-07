import Link from "next/link";
import Image from "next/image";
import { Home, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/sections/SearchBar";
import { HERO_IMAGE, HOME_OWNER_LISTING_HREF } from "@/lib/homepage-content";
import { MVP_TAGLINE_SENTENCE } from "@/lib/rental-types";
import { isPreviewV80 } from "@/lib/preview-v80";

export function Hero() {
  return (
    <section className="relative min-h-[68vh] bg-cream sm:min-h-[76vh] lg:min-h-[82vh]">
      <div className="absolute inset-0 overflow-hidden origin-center">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center] opacity-[0.82] saturate-[0.88] sm:object-[55%_center] lg:object-[50%_center]"
          quality={75}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cream from-0% via-cream/98 via-[40%] to-cream/10 to-[70%] lg:via-cream/96 lg:via-[42%] lg:to-transparent lg:to-[66%]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cream via-cream/35 via-30% to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_14%_44%,rgba(253,252,248,0.78),transparent_56%)]" />

      <div className="relative z-10 mx-auto flex min-h-[68vh] max-w-7xl flex-col justify-center px-4 pb-7 pt-24 sm:min-h-[76vh] sm:px-6 sm:pb-9 sm:pt-28 lg:min-h-[82vh] lg:pb-10">
        <div className="max-w-2xl">
          <div className="mb-3 sm:mb-3.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-gold-dark uppercase backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Αγγελίες ακινήτων στην Ελλάδα
            </span>
          </div>

          <h1 className="max-w-xl font-display text-[1.875rem] font-semibold leading-[1.12] tracking-tight text-charcoal drop-shadow-[0_1px_0_rgba(253,252,248,0.8)] sm:text-5xl lg:text-[3.2rem]">
            Βρες το επόμενο σπίτι σου στην Ελλάδα
          </h1>

          <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-charcoal/70 sm:mt-3.5 sm:text-lg">
            {MVP_TAGLINE_SENTENCE}
          </p>

          {!isPreviewV80 && (
            <div className="mt-4 sm:mt-4">
              <Link href={HOME_OWNER_LISTING_HREF} className="home-btn-outline">
                <Home className="h-3.5 w-3.5 text-gold/90" strokeWidth={2} />
                Ανέβασε αγγελία
              </Link>
            </div>
          )}
        </div>

        <div className="relative z-20 mt-5 w-full sm:mt-5" id="search">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
