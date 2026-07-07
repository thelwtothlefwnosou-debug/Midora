"use client";

import dynamic from "next/dynamic";

export const AiAssistantLazy = dynamic(
  () => import("@/components/ai/AiAssistant").then((m) => m.AiAssistant),
  { ssr: false }
);
