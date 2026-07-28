import { createClient } from "@/lib/supabase/server";
import {
  actionError,
  authActionError,
  mustSignInError,
} from "@/lib/action-error-i18n";
import { accessAllows, resolveListingAccess } from "@/lib/listing-access";
import type { ListingAccessPermission } from "@/lib/listing-cohost-permissions";

export async function requireUser() {
  const supabase = await createClient();
  if (!supabase) {
    return { error: await authActionError("supabaseNotConfigured") } as const;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return await mustSignInError();
  return { supabase, user } as const;
}

export async function requireServiceUser() {
  const supabase = await createClient();
  if (!supabase) {
    return { error: await actionError("serviceUnavailable") } as const;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return await mustSignInError();
  return { supabase, user } as const;
}

export async function requireAdmin() {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "admin") {
    return { error: await actionError("noPermission") } as const;
  }
  return auth;
}

export async function requireListingOwner(
  listingId: string,
  permission: ListingAccessPermission = "manage_listing"
) {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const access = await resolveListingAccess(auth.supabase, listingId, auth.user.id);
  if (!access || !accessAllows(access, permission)) {
    return { error: await actionError("noAccess") } as const;
  }
  const { data: listing } = await auth.supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();
  if (!listing) {
    return { error: await actionError("noAccess") } as const;
  }
  return { ...auth, listing, access } as const;
}
