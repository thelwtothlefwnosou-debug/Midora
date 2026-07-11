"use client";

import { BUILD_INFO } from "@/lib/build-info.generated";

/** Dev-only build stamp — hidden from production users. */
export function DevBuildInfoStrip() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      className="pointer-events-none fixed bottom-1 right-2 z-[9999] select-none font-mono text-[10px] leading-tight text-charcoal/35"
      aria-hidden
      title={`${BUILD_INFO.gitHash} — ${BUILD_INFO.gitSubject}`}
    >
      <span>{BUILD_INFO.gitHash}</span>
      <span className="mx-1">·</span>
      <span>{BUILD_INFO.environment}</span>
    </div>
  );
}
