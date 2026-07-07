"use client";

import { useEffect, useState } from "react";
import { subscribeToast } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return subscribeToast((msg) => {
      if (msg) {
        setMessage(msg);
        setVisible(true);
      } else {
        setVisible(false);
        setTimeout(() => setMessage(null), 200);
      }
    });
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-[200] max-w-[min(90vw,22rem)] -translate-x-1/2 rounded-full border border-border bg-charcoal px-5 py-3 text-center text-sm font-medium text-white shadow-2xl transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      {message}
    </div>
  );
}
