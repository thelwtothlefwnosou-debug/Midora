import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Home, Search } from "lucide-react";
import {
  HOME_FINAL_CTA_IMAGE,
  HOME_OWNER_LISTING_HREF,
} from "@/lib/homepage-content";

export async function FinalHomeCta() {
  const t = await getTranslations("Home");

  return (
    <section className="home-section home-section--editorial px-4 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem]">
        <div className="absolute inset-0">
          <Image
            src={HOME_FINAL_CTA_IMAGE}
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[50%_45%]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-charcoal/72 via-charcoal/55 to-charcoal/45"
            aria-hidden
          />
        </div>

        <div className="relative px-6 py-14 text-center sm:px-10 sm:py-16 lg:px-16 lg:py-[4.5rem]">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[2.35rem]">
            {t("finalCtaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/88 sm:text-base">
            {t("finalCtaBody")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/listings?rentalType=short_term" className="home-btn-primary">
              <Search className="h-4 w-4" />
              {t("finalCtaSearch")}
            </Link>
            <Link
              href={HOME_OWNER_LISTING_HREF}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/18"
            >
              <Home className="h-4 w-4" />
              {t("finalCtaList")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
