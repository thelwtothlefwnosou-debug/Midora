"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function ReferralShareButton({
  url,
  code,
}: {
  url: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" /> Αντιγράφηκε
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Αντιγραφή ({code})
        </>
      )}
    </button>
  );
}
