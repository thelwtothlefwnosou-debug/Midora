import { getTranslations } from "next-intl/server";
import { HOME_TRUST_STRIP } from "@/lib/homepage-content";

const TRUST_KEYS = [
  { title: "trust1Title", text: "trust1Text" },
  { title: "trust2Title", text: "trust2Text" },
  { title: "trust3Title", text: "trust3Text" },
  { title: "trust4Title", text: "trust4Text" },
] as const;

export async function TrustStrip() {
  const t = await getTranslations("Home");

  return (
    <section
      aria-label={t("trustStripAria")}
      className="home-bg-white border-y border-border"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_TRUST_STRIP.map((item, i) => {
            const keys = TRUST_KEYS[i];
            return (
              <li
                key={keys.title}
                className="home-card flex h-full flex-col gap-2.5 px-4 py-4"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-sand/45">
                  <item.icon
                    className="h-4 w-4 text-gold"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug text-charcoal">
                    {t(keys.title)}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted/95">
                    {t(keys.text)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
