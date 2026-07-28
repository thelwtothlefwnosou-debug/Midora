"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions";
import { ACTION_ERROR_CODES } from "@/lib/action-error-i18n";
import {
  isLocalFavorite,
  toggleLocalFavorite,
  PENDING_FAVORITE_KEY,
} from "@/lib/favorites-storage";
import { showToast } from "@/lib/toast-store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const SAVE_ERROR = "Δεν ήταν δυνατή η αποθήκευση. Δοκίμασε ξανά.";

export function useFavoriteToggle(listingId: string, initialFavorited = false) {
  const [favorited, setFavorited] = useState(() =>
    typeof window !== "undefined" && !isSupabaseConfigured()
      ? isLocalFavorite(listingId)
      : initialFavorited
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (isSupabaseConfigured()) return;
    const onChange = () => setFavorited(isLocalFavorite(listingId));
    window.addEventListener("midora:favorites-changed", onChange);
    return () => window.removeEventListener("midora:favorites-changed", onChange);
  }, [listingId]);

  const redirectToLogin = useCallback(() => {
    const returnPath = window.location.pathname + window.location.search;
    sessionStorage.setItem(PENDING_FAVORITE_KEY, listingId);
    window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;
  }, [listingId]);

  const toggle = useCallback(() => {
    startTransition(async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            redirectToLogin();
            return;
          }
        } catch {
          redirectToLogin();
          return;
        }
      }

      const previous = favorited;
      const optimistic = !favorited;
      setFavorited(optimistic);

      if (!isSupabaseConfigured()) {
        const next = toggleLocalFavorite(listingId);
        setFavorited(next);
        showToast(next ? "Προστέθηκε στα αγαπημένα" : "Αφαιρέθηκε από τα αγαπημένα");
        return;
      }

      const result = await toggleFavorite(listingId);
      if (result?.error) {
        setFavorited(previous);
        if ("errorCode" in result && result.errorCode === ACTION_ERROR_CODES.mustSignIn) {
          redirectToLogin();
          return;
        }
        showToast(SAVE_ERROR);
        return;
      }

      if (typeof result?.favorited === "boolean") {
        setFavorited(result.favorited);
        showToast(
          result.favorited ? "Προστέθηκε στα αγαπημένα" : "Αφαιρέθηκε από τα αγαπημένα"
        );
      } else {
        setFavorited(previous);
        showToast(SAVE_ERROR);
      }
    });
  }, [favorited, listingId, redirectToLogin]);

  return { favorited, pending, toggle };
}
