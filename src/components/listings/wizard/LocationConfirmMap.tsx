"use client";

import dynamic from "next/dynamic";

export const LocationConfirmMap = dynamic(
  () =>
    import("./LocationConfirmMapInner").then((m) => ({
      default: m.LocationConfirmMapInner,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl bg-sand/40 text-sm text-muted">
        Φόρτωση χάρτη...
      </div>
    ),
  }
);
