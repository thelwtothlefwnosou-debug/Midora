"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toggleFavorite } from "@/lib/actions";
import { PENDING_FAVORITE_KEY } from "@/lib/favorites-storage";
import { showToast } from "@/lib/toast-store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/** Completes a favorite action after login redirect. */
export function PendingFavoriteSync() {
  const t = useTranslations("Favorites");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !isSupabaseConfigured()) return;
    const pending = sessionStorage.getItem(PENDING_FAVORITE_KEY);
    if (!pending) return;

    ran.current = true;

    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          ran.current = false;
          return;
        }

        sessionStorage.removeItem(PENDING_FAVORITE_KEY);
        const result = await toggleFavorite(pending);
        if (result?.favorited) {
          showToast(t("toastAdded"));
        }
      } catch {
        ran.current = false;
      }
    })();
  }, []);

  return null;
}
