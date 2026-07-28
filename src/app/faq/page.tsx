import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Faq");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function FaqPage() {
  const t = await getTranslations("Faq");
  const groupOrder = t.raw("groupOrder") as string[];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-display text-4xl font-bold text-charcoal">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted">{t("subtitle")}</p>

          <div className="mt-10 space-y-10">
            {groupOrder.map((groupId) => {
              const items = t.raw(`groups.${groupId}.items`) as Record<
                string,
                { q: string; a: string }
              >;
              const itemIds = Object.keys(items);
              if (itemIds.length === 0) return null;
              return (
                <section key={groupId}>
                  <h2 className="font-display text-xl font-semibold text-charcoal">
                    {t(`groups.${groupId}.title`)}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {itemIds.map((itemId) => (
                      <details
                        key={itemId}
                        className="group rounded-2xl border border-border bg-sand/40 p-5"
                      >
                        <summary className="cursor-pointer font-medium text-charcoal marker:content-none">
                          {t(`groups.${groupId}.items.${itemId}.q`)}
                        </summary>
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal/70">
                          {t(`groups.${groupId}.items.${itemId}.a`)}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <p className="mt-10 text-center text-sm text-muted">
            {t("noAnswer")}{" "}
            <Link href="/contact" className="text-gold hover:underline">
              {t("contactLink")}
            </Link>
            {" · "}
            <Link href="/help" className="text-gold hover:underline">
              {t("helpLink")}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
