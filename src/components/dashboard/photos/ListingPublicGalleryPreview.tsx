"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { sortListingPhotosForDisplay } from "@/lib/listing-photo-display";
import { resolveListingImageUrl } from "@/lib/listing-media";
import type { ListingImage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  images: ListingImage[];
  publicHref?: string;
  roomWarning?: string | null;
};

export function ListingPublicGalleryPreview({ images, publicHref, roomWarning }: Props) {
  const t = useTranslations("Workspace.galleryPreview");
  const photos = sortListingPhotosForDisplay(images);
  const preview = photos.slice(0, 5);

  if (preview.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-charcoal">{t("title")}</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">{t("subtitle")}</p>
        </div>
        {publicHref && (
          <Link
            href={publicHref}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-charcoal hover:border-gold/40"
          >
            <ExternalLink className="h-4 w-4" />
            {t("publicListing")}
          </Link>
        )}
      </div>

      <div className="mt-4 grid h-[220px] grid-cols-[1.4fr_1fr] gap-2 overflow-hidden rounded-2xl">
        <div className="relative min-h-0 overflow-hidden rounded-xl">
          <PreviewTile photo={preview[0]} priority className="absolute inset-0" sizes="40vw" />
          <span className="absolute left-2 top-2 rounded-full bg-charcoal/85 px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {t("cover")}
          </span>
        </div>
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2">
          {preview.slice(1, 5).map((photo, i) => (
            <div key={photo.id} className="relative min-h-0 overflow-hidden rounded-xl">
              <PreviewTile photo={photo} sizes="15vw" />
              <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-charcoal">
                #{i + 2}
              </span>
            </div>
          ))}
          {preview.length < 5 &&
            Array.from({ length: 5 - preview.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-center rounded-xl border border-dashed border-border bg-sand/20 text-[10px] text-muted"
              >
                —
              </div>
            ))}
        </div>
      </div>

      {roomWarning && (
        <p className="mt-3 rounded-xl border border-gold/25 bg-gold/5 px-3 py-2 text-sm text-charcoal">
          {roomWarning}
        </p>
      )}
    </section>
  );
}

function PreviewTile({
  photo,
  className,
  sizes,
  priority,
}: {
  photo: ListingImage;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  const src = resolveListingImageUrl(photo.url) ?? photo.url;
  return (
    <div className={cn("relative h-full w-full bg-sand/30", className)}>
      <Image src={src} alt="" fill className="object-cover" sizes={sizes} priority={priority} />
    </div>
  );
}
