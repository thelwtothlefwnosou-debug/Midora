"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ListingPreviewStatusMessage } from "@/lib/listing-preview-status";

export type PreviewDevice = "desktop" | "mobile";

type Props = {
  listingId: string;
  status: ListingPreviewStatusMessage;
  showPublicLink?: boolean;
  publicHref?: string;
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  children: React.ReactNode;
  mobileEmbedSrc: string;
};

export function ListingPreviewShell({
  listingId,
  status,
  showPublicLink,
  publicHref,
  device,
  onDeviceChange,
  children,
  mobileEmbedSrc,
}: Props) {
  const t = useTranslations("Workspace.preview");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (device !== "mobile") return;
    setIframeLoaded(false);
    setIframeKey((k) => k + 1);
  }, [device, mobileEmbedSrc]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href={`/dashboard/listings/${listingId}`}
            className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-muted hover:text-charcoal"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToManage")}
          </Link>

          <p className="mx-auto hidden font-display text-sm font-semibold text-charcoal sm:block">
            {t("viewListing")}
          </p>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-border bg-sand/30 p-1">
              <DeviceTab
                active={device === "desktop"}
                onClick={() => onDeviceChange("desktop")}
                icon={<Monitor className="h-4 w-4" />}
                label={t("desktop")}
              />
              <DeviceTab
                active={device === "mobile"}
                onClick={() => onDeviceChange("mobile")}
                icon={<Smartphone className="h-4 w-4" />}
                label={t("mobile")}
              />
            </div>
            {showPublicLink && publicHref && (
              <Link
                href={publicHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-charcoal hover:border-gold/30"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("openPublicLink")}</span>
                <span className="sm:hidden">Link</span>
              </Link>
            )}
          </div>
        </div>

        <StatusBanner status={status} />
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {device === "desktop" ? (
          <div className="rounded-2xl border border-border bg-white shadow-soft">
            {children}
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <div className="relative w-full max-w-[390px]">
              <div className="overflow-hidden rounded-[2rem] border-[10px] border-charcoal/90 bg-charcoal/90 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]">
                <div className="mx-auto h-5 w-28 rounded-b-2xl bg-charcoal/90" aria-hidden />
                <div className="relative h-[min(78vh,780px)] bg-white">
                  {!iframeLoaded && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-sm text-muted">
                      {t("loading")}
                    </div>
                  )}
                  <iframe
                    key={iframeKey}
                    title={t("mobilePreviewTitle")}
                    src={mobileEmbedSrc}
                    className="h-full w-full border-0 bg-white"
                    onLoad={() => setIframeLoaded(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors sm:text-sm",
        active ? "bg-charcoal text-white shadow-soft" : "text-muted hover:text-charcoal"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatusBanner({ status }: { status: ListingPreviewStatusMessage }) {
  const styles =
    status.tone === "success"
      ? "border-teal/25 bg-teal/10 text-charcoal"
      : status.tone === "info"
        ? "border-gold/25 bg-gold/5 text-charcoal"
        : status.tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-border bg-sand/40 text-charcoal";

  return (
    <div className={cn("border-t px-4 py-2 text-center text-sm", styles)}>
      {status.text}
    </div>
  );
}
