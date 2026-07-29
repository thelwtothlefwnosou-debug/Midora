"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { isUsableListingImageUrl } from "@/lib/listing-media";

type Props = {
  src: string | null | undefined;
  className?: string;
  imgClassName?: string;
  /** Compact (hero thumb) hides label text */
  compact?: boolean;
  roundedClassName?: string;
};

/**
 * Owner-dashboard listing cover with loading skeleton + Midora placeholder on failure.
 * Never leaves a black broken image rectangle visible.
 */
export function DashboardListingCover({
  src,
  className,
  imgClassName,
  compact = false,
  roundedClassName,
}: Props) {
  const t = useTranslations("Owner.list");
  const usable = isUsableListingImageUrl(src) ? src.trim() : null;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [usable]);

  const showImage = Boolean(usable && !failed);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br from-sand/80 via-[#f7f3ec] to-cream",
        roundedClassName,
        className
      )}
    >
      {showImage ? (
        <>
          {!loaded ? (
            <div className="absolute inset-0 animate-pulse bg-sand/70" aria-hidden />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element -- dashboard must not blank on remote host config */}
          <img
            src={usable!}
            alt=""
            onLoad={() => setLoaded(true)}
            onError={() => {
              setFailed(true);
              setLoaded(false);
            }}
            className={cn(
              "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
              imgClassName
            )}
          />
        </>
      ) : (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center px-4 text-center",
            compact ? "gap-1.5" : "gap-2"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl bg-white/70 text-gold-dark shadow-soft ring-1 ring-charcoal/6",
              compact ? "h-9 w-9" : "h-12 w-12"
            )}
          >
            <ImageIcon
              className={cn(compact ? "h-4 w-4" : "h-5 w-5")}
              strokeWidth={1.5}
            />
          </div>
          {!compact ? (
            <span className="max-w-[12rem] text-xs leading-snug text-muted">
              {t("noPhotoAdded")}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
