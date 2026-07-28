import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FavoritesCompareTable } from "@/components/favorites/FavoritesCompareTable";
import { getFavoriteListings } from "@/lib/user-features";
import { createClient } from "@/lib/supabase/server";
import { getListingPublicId } from "@/lib/utils";

export default async function FavoritesComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const t = await getTranslations("Favorites.compare");
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/favorites/compare");

  const { ids: idsParam } = await searchParams;
  const favoriteListings = await getFavoriteListings();

  let listings = favoriteListings;

  if (idsParam) {
    const publicIds = new Set(idsParam.split(",").filter(Boolean).slice(0, 4));
    const filtered = favoriteListings.filter((l) =>
      publicIds.has(getListingPublicId(l))
    );
    if (filtered.length >= 2) listings = filtered;
    else if (filtered.length === 1) listings = filtered;
  }

  listings = listings.slice(0, 4);

  if (listings.length < 2) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href="/dashboard/favorites"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToFavorites")}
          </Link>

          <h1 className="font-display text-3xl font-bold text-charcoal">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle", { count: 4 })}</p>

          <FavoritesCompareTable listings={listings} />

          <div className="mt-6 flex flex-wrap gap-2">
            {favoriteListings.slice(0, 6).map((l) => {
              const pid = getListingPublicId(l);
              const selected = listings.some((x) => x.id === l.id);
              return (
                <Link
                  key={l.id}
                  href={`/favorites/compare?ids=${pid}`}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selected
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-border text-muted hover:border-gold/30"
                  }`}
                >
                  {l.title.slice(0, 30)}
                  {l.title.length > 30 ? "…" : ""}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
