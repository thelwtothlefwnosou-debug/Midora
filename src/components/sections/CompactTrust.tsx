import { getTranslations } from "next-intl/server";
import { HOME_SUPPORT_TRUST } from "@/lib/homepage-content";

const SUPPORT_KEYS = [
  { title: "support1Title", text: "support1Text" },
  { title: "support2Title", text: "support2Text" },
  { title: "support3Title", text: "support3Text" },
] as const;

export async function CompactTrust() {
  const t = await getTranslations("Home");

  return (
    <section className="border-t border-border bg-sand/30 py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-xl font-semibold text-charcoal sm:text-2xl">
            {t("supportTrustTitle")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_SUPPORT_TRUST.map((card, i) => {
            const keys = SUPPORT_KEYS[i];
            return (
              <article
                key={keys.title}
                className="rounded-2xl border border-border bg-white/90 p-5 shadow-soft"
              >
                <card.icon
                  className="h-4 w-4 text-gold"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 className="mt-3 font-display text-base font-semibold text-charcoal">
                  {t(keys.title)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(keys.text)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
