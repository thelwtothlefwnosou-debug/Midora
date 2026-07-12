import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { PublicProfilePageContent } from "@/components/profile/PublicProfilePageContent";
import {
  getPublicProfileBySlugOrId,
  getPublicProfilePageData,
} from "@/lib/profile-public-queries";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 120;

type SearchParams = {
  interestFrom?: string;
  interestTo?: string;
  checkIn?: string;
  checkOut?: string;
  start?: string;
  end?: string;
  durationMonths?: string;
  rentalType?: string;
};

function parseDateContext(searchParams: SearchParams) {
  const interestFrom =
    searchParams.interestFrom?.trim() ||
    searchParams.checkIn?.trim() ||
    searchParams.start?.trim() ||
    undefined;
  const interestTo =
    searchParams.interestTo?.trim() ||
    searchParams.checkOut?.trim() ||
    searchParams.end?.trim() ||
    undefined;
  const durationRaw = searchParams.durationMonths?.trim();
  const durationMonths = durationRaw ? parseInt(durationRaw, 10) : undefined;

  return {
    interestFrom,
    interestTo,
    durationMonths: Number.isFinite(durationMonths) ? durationMonths : undefined,
    rentalTypeFilter: searchParams.rentalType?.trim() ?? null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfileBySlugOrId(slug);
  if (!profile) return { title: "Προφίλ μη διαθέσιμο" };

  const data = await getPublicProfilePageData(profile);
  if (!data) return { title: "Προφίλ μη διαθέσιμο" };

  const title = `${data.displayName} — Προφίλ`;
  const description = data.profile.bio?.trim()
    ? data.profile.bio.trim().slice(0, 155) +
      (data.profile.bio.trim().length > 155 ? "…" : "")
    : `Δείτε τις δημόσιες αγγελίες του/της ${data.displayName} στο Midora.`;
  const canonicalPath = profile.public_slug
    ? `/users/${profile.public_slug}`
    : `/users/${profile.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${getSiteUrl()}${canonicalPath}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicUserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const profile = await getPublicProfileBySlugOrId(slug);
  if (!profile) notFound();

  const data = await getPublicProfilePageData(profile);
  if (!data) notFound();

  const dateContext = parseDateContext(sp);

  return (
    <PublicPageLayout wide className="bg-white pt-20">
      <div className="py-4">
        <PublicProfilePageContent data={data} {...dateContext} />
      </div>
    </PublicPageLayout>
  );
}
