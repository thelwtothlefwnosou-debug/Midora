"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { isSchemaColumnError } from "@/lib/listing-image-db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logAdminAudit, logAppEvent } from "@/lib/admin/audit";
import {
  getListingApprovalChecklist,
} from "@/lib/admin/listing-approval-checklist";
import { formatChangeReasons } from "@/lib/admin/change-reasons";
import {
  approveListing as baseApprove,
  rejectListing as baseReject,
  requestListingChanges as baseRequestChanges,
} from "@/lib/actions";
import type { ListingWithImages } from "@/lib/types";

async function fetchListingSnapshot(listingId: string) {
  const db = createServiceClient();
  if (!db) return null;
  const { data } = await db
    .from("listings")
    .select("status, approval_status")
    .eq("id", listingId)
    .maybeSingle();
  return data;
}

export async function adminLogListingOpenedForReview(listingId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const snapshot = await fetchListingSnapshot(listingId);
  await logAdminAudit(auth.user.id, "listing_opened_for_review", "listing", listingId, {
    old_status: snapshot?.status ?? null,
    approval_status: snapshot?.approval_status ?? null,
    timestamp: new Date().toISOString(),
  });
  return {};
}

export async function adminGetListingApprovalChecklist(listingId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const db = createServiceClient() ?? auth.supabase;
  const { data: listing, error } = await db
    .from("listings")
    .select("*, listing_images(id, media_type)")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !listing) return { error: "Η αγγελία δεν βρέθηκε." };

  const checklist = await getListingApprovalChecklist(
    db,
    listing as ListingWithImages
  );
  return { checklist };
}

export async function adminHideListing(listingId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const snapshot = await fetchListingSnapshot(listingId);
  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("listings")
    .update({ is_hidden: true })
    .eq("id", listingId);
  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "listing_hidden", "listing", listingId, {
    old_status: snapshot?.status ?? null,
    new_status: snapshot?.status ?? null,
    timestamp: new Date().toISOString(),
  });
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}

export async function adminRestoreListing(listingId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const snapshot = await fetchListingSnapshot(listingId);
  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("listings")
    .update({ is_hidden: false })
    .eq("id", listingId);
  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "listing_restored", "listing", listingId, {
    old_status: snapshot?.status ?? null,
    new_status: snapshot?.status ?? null,
    timestamp: new Date().toISOString(),
  });
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}

export async function adminApproveListing(listingId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const snapshot = await fetchListingSnapshot(listingId);
  const result = await baseApprove(listingId);
  if (!result.error) {
    await logAdminAudit(auth.user.id, "listing_approved", "listing", listingId, {
      listing_id: listingId,
      admin_user_id: auth.user.id,
      old_status: snapshot?.status ?? null,
      new_status: "approved",
      timestamp: new Date().toISOString(),
    });
    await logAppEvent("admin_listing_approved", {
      userId: auth.user.id,
      entityType: "listing",
      entityId: listingId,
    });
  }
  revalidatePath("/admin/listings");
  revalidatePath("/admin/listings/review");
  revalidatePath(`/admin/listings/${listingId}`);
  return result;
}

export async function adminRejectListing(listingId: string, adminReason?: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const snapshot = await fetchListingSnapshot(listingId);
  const result = await baseReject(listingId, adminReason);
  if (result.error) return result;

  await logAdminAudit(auth.user.id, "listing_rejected", "listing", listingId, {
    listing_id: listingId,
    admin_user_id: auth.user.id,
    old_status: snapshot?.status ?? null,
    new_status: "rejected",
    admin_note: adminReason?.trim() ?? null,
    timestamp: new Date().toISOString(),
  });
  await logAppEvent("admin_listing_rejected", {
    userId: auth.user.id,
    entityType: "listing",
    entityId: listingId,
  });
  revalidatePath("/admin/listings");
  revalidatePath("/admin/listings/review");
  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}

export async function adminRequestListingChanges(
  listingId: string,
  options?: { note?: string; reasonIds?: string[] }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const note = options?.note?.trim() ?? "";
  if (!note) {
    return { error: "Συμπλήρωσε σημείωση προς τον αγγελιοδότη." };
  }
  const reasonIds = options?.reasonIds ?? [];
  if (reasonIds.length === 0) {
    return { error: "Επίλεξε τουλάχιστον έναν λόγο αλλαγής." };
  }

  const composedNote = formatChangeReasons(reasonIds, note);
  const snapshot = await fetchListingSnapshot(listingId);
  const result = await baseRequestChanges(listingId, { note: composedNote });
  if (result.error) return result;

  await logAdminAudit(auth.user.id, "listing_needs_changes", "listing", listingId, {
    listing_id: listingId,
    admin_user_id: auth.user.id,
    old_status: snapshot?.status ?? null,
    new_status: "needs_changes",
    admin_note: note,
    change_reason_ids: reasonIds,
    timestamp: new Date().toISOString(),
  });
  revalidatePath("/admin/listings");
  revalidatePath("/admin/listings/review");
  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}

export async function adminSuspendUser(userId: string, note?: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  if (userId === auth.user.id) {
    return { error: "Δεν μπορείς να αναστείλεις τον δικό σου λογαριασμό." };
  }

  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("profiles")
    .update({
      account_status: "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "user_suspended", "profile", userId, {
    admin_note: note?.trim() ?? null,
    timestamp: new Date().toISOString(),
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function adminUnsuspendUser(userId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("profiles")
    .update({
      account_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "user_unsuspended", "profile", userId, {
    timestamp: new Date().toISOString(),
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function adminUpdateUserRole(userId: string, role: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  if (!["user", "advertiser", "admin"].includes(role)) {
    return { error: "Μη έγκυρος ρόλος." };
  }
  if (userId === auth.user.id && role !== "admin") {
    return { error: "Δεν μπορείς να αφαιρέσεις τον δικό σου admin ρόλο." };
  }

  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "user_role_changed", "profile", userId, { role });
  revalidatePath("/admin/users");
  return {};
}

export async function adminUpdateLeadStatus(leadId: string, status: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  if (!["new", "read", "replied", "archived"].includes(status)) {
    return { error: "Μη έγκυρο status." };
  }
  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("property_leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) return { error: error.message };

  const action = status === "archived" ? "lead_archived" : "lead_marked_read";
  await logAdminAudit(auth.user.id, action, "property_lead", leadId, { status });
  revalidatePath("/admin/interests");
  return {};
}

export async function adminUpdateListingReport(
  reportId: string,
  status: string,
  adminNotes?: string
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("listing_reports")
    .update({
      status,
      admin_notes: adminNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) return { error: error.message };

  const action =
    status === "resolved"
      ? "report_resolved"
      : status === "dismissed"
        ? "report_dismissed"
        : "report_reviewing";
  await logAdminAudit(auth.user.id, action, "listing_report", reportId, { status });
  revalidatePath("/admin/reports/listings");
  return {};
}

export async function adminUpdateBugReport(
  reportId: string,
  status: string,
  adminNotes?: string
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("bug_reports")
    .update({
      status,
      admin_notes: adminNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) return { error: error.message };

  if (status === "fixed") {
    await logAdminAudit(auth.user.id, "bug_report_fixed", "bug_report", reportId);
  }
  revalidatePath("/admin/reports/bugs");
  return {};
}

export async function adminDeleteUnavailablePeriod(periodId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db.from("listing_unavailable_periods").delete().eq("id", periodId);
  if (error) return { error: error.message };
  await logAdminAudit(auth.user.id, "unavailable_period_deleted", "unavailable_period", periodId);
  revalidatePath("/admin/availability");
  return {};
}

export async function adminSaveSetting(key: string, value: Record<string, unknown>) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db.from("admin_settings").upsert({
    key,
    value,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  await logAdminAudit(auth.user.id, "admin_setting_updated", "admin_setting", undefined, {
    key,
  });
  revalidatePath("/admin/settings");
  return {};
}

export async function adminUpdateVerificationStatus(
  listingId: string,
  field: "advertiser" | "property",
  status: string
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const column =
    field === "advertiser" ? "advertiser_verification_status" : "property_verification_status";
  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("listings")
    .update({ [column]: status, updated_at: new Date().toISOString() })
    .eq("id", listingId);
  if (error) return { error: error.message };

  const action =
    status === "verified" ? "verification_approved" : "verification_rejected";
  await logAdminAudit(auth.user.id, action, "listing", listingId, { field, status });
  revalidatePath("/admin/verifications");
  return {};
}

export async function adminMarkRegistryReviewed(listingId: string, notes?: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const db = createServiceClient() ?? auth.supabase;
  const update: Record<string, unknown> = {
    property_verification_status: "verified",
    updated_at: new Date().toISOString(),
  };
  if (notes?.trim()) update.admin_verification_notes = notes.trim();

  const { error } = await db.from("listings").update(update).eq("id", listingId);
  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "registry_reviewed", "listing", listingId, {
    listing_id: listingId,
    admin_user_id: auth.user.id,
    admin_note: notes?.trim() ?? null,
    timestamp: new Date().toISOString(),
  });
  revalidatePath("/admin/registry");
  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}

export async function adminApproveListingLocation(listingId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("listings")
    .update({
      location_admin_status: "approved",
      location_admin_reviewed_at: new Date().toISOString(),
    })
    .eq("id", listingId);
  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "listing_location_approved", "listing", listingId, {
    timestamp: new Date().toISOString(),
  });
  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}

export async function adminRequestLocationCorrection(listingId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const result = await adminRequestListingChanges(listingId, {
    note: "Χρειάζεται διόρθωση στην ακριβή τοποθεσία του ακινήτου πριν από τη δημοσίευση.",
    reasonIds: ["location"],
  });
  if (result.error) return result;

  const db = createServiceClient() ?? auth.supabase;
  await db
    .from("listings")
    .update({ location_admin_status: "needs_correction" })
    .eq("id", listingId);

  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}

export async function adminUpdateListingLocation(
  listingId: string,
  latitude: number,
  longitude: number
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: "Μη έγκυρες συντεταγμένες." };
  }
  if (latitude < 34 || latitude > 42 || longitude < 19 || longitude > 30) {
    return { error: "Οι συντεταγμένες πρέπει να είναι εντός Ελλάδας." };
  }

  const db = createServiceClient() ?? auth.supabase;
  const locationPatch = {
    latitude,
    longitude,
    location_pin_moved_manually: true,
    location_admin_status: "approved" as const,
    location_admin_reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let { error } = await db.from("listings").update(locationPatch).eq("id", listingId);

  if (error && isSchemaColumnError(error)) {
    ({ error } = await db
      .from("listings")
      .update({
        latitude,
        longitude,
        location_pin_moved_manually: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId));
  }

  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "listing_location_updated", "listing", listingId, {
    latitude,
    longitude,
    timestamp: new Date().toISOString(),
  });

  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/admin/listings");
  return { success: true as const };
}

export async function submitBugReport(formData: FormData) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  if (!supabase) return { error: "Η αναφορά δεν είναι διαθέσιμη." };

  const category = (formData.get("category") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();
  const pageUrl = (formData.get("page_url") as string)?.trim() || null;
  const browserInfoRaw = (formData.get("browser_info") as string)?.trim();

  if (!message || message.length < 10) {
    return { error: "Περιγράψε το πρόβλημα με λίγα λόγια (τουλάχιστον 10 χαρακτήρες)." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let browser_info: Record<string, unknown> | null = null;
  if (browserInfoRaw) {
    try {
      browser_info = JSON.parse(browserInfoRaw) as Record<string, unknown>;
    } catch {
      browser_info = { raw: browserInfoRaw };
    }
  }

  const db = createServiceClient() ?? supabase;
  const { error } = await db.from("bug_reports").insert({
    user_id: user?.id ?? null,
    page_url: pageUrl,
    message,
    category: category || "other",
    browser_info,
    status: "new",
  });

  if (error) return { error: error.message };

  await logAppEvent("bug_report_submitted", {
    userId: user?.id,
    metadata: { category, pageUrl },
  });

  return { success: true };
}