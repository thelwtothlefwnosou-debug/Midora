import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HOME_STAY_NEEDS } from "@/lib/homepage-content";
import { HomeSectionHeader } from "@/components/sections/HomeSectionHeader";

const NEED_KEYS = [
  "need1Title",
  "need2Title",
  "need3Title",
  "need4Title",
  "need5Title",
  "need6Title",
] as const;

function buildNeedHref(item: (typeof HOME_STAY_NEEDS)[number]): string {
  const params = new URLSearchParams();
  if (item.rentalType) params.set("rentalType", item.rentalType);
  if (item.stay && !item.rentalType) params.set("stay", item.stay);
  if (item.stay === "students" || item.stay === "families" || item.stay === "business") {
    params.set("stay", item.stay);
  }
  if (item.query) {
    for (const [k, v] of Object.entries(item.query)) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/listings?${qs}` : "/listings";
}

export async function StayByNeed() {
  const t = await getTranslations("Home");

  return (
    <section id="needs" className="home-section home-section--editorial home-bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeSectionHeader
          title={t("needsTitle")}
          subtitle={t("needsSubtitle")}
          centered
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {HOME_STAY_NEEDS.map((item, index) => {
            const titleKey = NEED_KEYS[index];
            return (
              <Link
                key={item.stay}
                href={buildNeedHref(item)}
                className="home-need-tile group relative block aspect-[5/4] overflow-hidden rounded-[1.35rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2"
              >
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-charcoal/5"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <span className="font-display text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
                    {t(titleKey)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
