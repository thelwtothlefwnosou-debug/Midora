import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check, Home } from "lucide-react";
import {
  HOME_OWNER_LISTING_HREF,
  HOME_OWNER_SPLIT_IMAGE,
} from "@/lib/homepage-content";

const OWNER_BULLET_KEYS = [
  "hostBullet1",
  "hostBullet2",
  "hostBullet3",
  "hostBullet4",
] as const;

export async function HostCTA() {
  const t = await getTranslations("Home");

  return (
    <section id="owners" className="home-section home-section--editorial home-bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          <div className="order-2 lg:order-1">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">
              {t("hostCtaEyebrow")}
            </p>
            <h2 className="mt-3 font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-charcoal sm:text-[2.15rem]">
              {t("hostCtaTitle")}
            </h2>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {t("hostCtaBody")}
            </p>

            <ul className="mt-7 space-y-3.5">
              {OWNER_BULLET_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-3 text-sm text-charcoal/90 sm:text-[0.9375rem]">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  {t(key)}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={HOME_OWNER_LISTING_HREF} className="home-btn-primary">
                <Home className="h-4 w-4" />
                {t("hostCtaPrimary")}
              </Link>
              <Link href="/owners" className="home-btn-secondary">
                {t("hostCtaSecondary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] sm:aspect-[5/4] lg:min-h-[26rem]">
              <Image
                src={HOME_OWNER_SPLIT_IMAGE}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover object-[50%_45%]"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-charcoal/20 via-transparent to-transparent"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
