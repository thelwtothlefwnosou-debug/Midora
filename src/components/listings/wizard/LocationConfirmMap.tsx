"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

function MapLoadingState() {
  const t = useTranslations("Wizard.location");
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-xl bg-sand/40 text-sm text-muted">
      {t("loadingMap")}
    </div>
  );
}

export const LocationConfirmMap = dynamic(
  () =>
    import("./LocationConfirmMapInner").then((m) => ({
      default: m.LocationConfirmMapInner,
    })),
  {
    ssr: false,
    loading: () => <MapLoadingState />,
  }
);
