import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getListingCompleteness } from "@/lib/admin/listing-completeness";
import {
  scoreListingPriority,
  sortByPriority,
  type PriorityListingMeta,
} from "@/lib/admin/priority";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import type { ListingWithImages } from "@/lib/types";

async function adminDb() {
  return createServiceClient() ?? (await createClient());
}

export type AdminOverviewStats = {
  totalListings: number;
  activeListings: number;
  pendingReview: number;
  newUsers30d: number;
  newLeads: number;
  listingReports: number;
  bugReports: number;
  pendingVerifications: number;
  unavailablePeriods: number;
  activeSubscriptions: number;
};

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const db = await adminDb();
  if (!db) {
    return {
      totalListings: 0,
      activeListings: 0,
      pendingReview: 0,
      newUsers30d: 0,
      newLeads: 0,
      listingReports: 0,
      bugReports: 0,
      pendingVerifications: 0,
      unavailablePeriods: 0,
      activeSubscriptions: 0,
    };
  }

  const since30d = new Date();
  since30d.setDate(since30d.getDate() - 30);

  const [
    listingsRes,
    usersRes,
    leadsRes,
    listingReportsRes,
    bugReportsRes,
    periodsRes,
    paymentsRes,
  ] = await Promise.all([
    db.from("listings").select("id, status, approval_status, expires_at, is_hidden, advertiser_verification_status, property_verification_status"),
    db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since30d.toISOString()),
    db.from("property_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("listing_reports").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("bug_reports").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("listing_unavailable_periods").select("id", { count: "exact", head: true }),
    db.from("payments").select("id", { count: "exact", head: true }).eq("status", "completed"),
  ]);

  const listings = listingsRes.data ?? [];
  let active = 0;
  let pending = 0;
  let pendingVerifications = 0;

  for (const l of listings) {
    const effective = getEffectiveListingStatus(l as ListingWithImages);
    if (effective === "approved" && !l.is_hidden) active += 1;
    if (effective === "pending" || l.approval_status === "pending_review") pending += 1;
    if (
      l.advertiser_verification_status === "pending" ||
      l.advertiser_verification_status === "needs_review" ||
      l.property_verification_status === "pending" ||
      l.property_verification_status === "needs_review"
    ) {
      pendingVerifications += 1;
    }
  }

  return {
    totalListings: listings.length,
    activeListings: active,
    pendingReview: pending,
    newUsers30d: usersRes.count ?? 0,
    newLeads: leadsRes.count ?? 0,
    listingReports: listingReportsRes.count ?? 0,
    bugReports: bugReportsRes.count ?? 0,
    pendingVerifications,
    unavailablePeriods: periodsRes.count ?? 0,
    activeSubscriptions: paymentsRes.count ?? 0,
  };
}

export async function getAdminRecentAuditLogs(limit = 10) {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("admin_audit_logs")
    .select("*, profiles:admin_user_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAdminRecentListings(limit = 8) {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("listings")
    .select("id, title, city, area, status, approval_status, rental_type, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAdminRecentUsers(limit = 8) {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAdminRecentLeads(limit = 8) {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("property_leads")
    .select("id, name, email, status, created_at, listings(title)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAdminRecentListingReports(limit = 6) {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("listing_reports")
    .select("id, reason, description, status, created_at, listings(title)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAdminRecentBugReports(limit = 6) {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("bug_reports")
    .select("id, category, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAdminRecentVerifications(limit = 6) {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("listings")
    .select(
      "id, title, advertiser_verification_status, property_verification_status, updated_at"
    )
    .or(
      "advertiser_verification_status.neq.not_started,property_verification_status.neq.not_started"
    )
    .order("updated_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export type AdminListingFilters = {
  status?: string;
  rentalType?: string;
  search?: string;
  registry?: "with" | "without";
  filter?: "location" | "incomplete";
  quick?:
    | "needs_review"
    | "high_priority"
    | "no_photos"
    | "unverified_phone"
    | "with_reports"
    | "needs_changes";
};

export type AdminListingWithMeta = ListingWithImages & {
  report_count: number;
  owner_active_listing_count: number;
};

export type AdminActionCenterStats = {
  pendingReview: number;
  needsChanges: number;
  incompleteListings: number;
  registryPendingReview: number;
  newReports: number;
  usersWithIssues: number;
  highPriority: number;
  /** legacy breakdown fields */
  locationIssues: number;
  noPhotos: number;
  unverifiedPhone: number;
  withReports: number;
  newListingReports: number;
  pendingVerifications: number;
};

function hasLocationIssue(listing: ListingWithImages): boolean {
  return (
    listing.latitude == null ||
    listing.longitude == null ||
    !listing.location_confirmed_by_owner ||
    listing.location_admin_status === "needs_correction" ||
    listing.location_needs_review === true
  );
}

function isListingIncomplete(listing: ListingWithImages): boolean {
  const completeness = getListingCompleteness(listing);
  return completeness.score < completeness.total;
}

function photoCount(listing: ListingWithImages): number {
  return (
    listing.listing_images?.filter((img) => img.media_type !== "video").length ?? 0
  );
}

async function enrichListingsWithMeta(
  rows: ListingWithImages[]
): Promise<AdminListingWithMeta[]> {
  if (!rows.length) return [];

  const db = await adminDb();
  if (!db) {
    return rows.map((listing) => ({
      ...listing,
      report_count: 0,
      owner_active_listing_count: 0,
    }));
  }

  const listingIds = rows.map((l) => l.id);
  const userIds = [...new Set(rows.map((l) => l.user_id).filter(Boolean))];

  const [reportsRes, activeListingsRes] = await Promise.all([
    db.from("listing_reports").select("listing_id").in("listing_id", listingIds),
    userIds.length
      ? db
          .from("listings")
          .select("user_id")
          .in("user_id", userIds)
          .eq("status", "approved")
          .eq("is_hidden", false)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
  ]);

  const reportCounts = new Map<string, number>();
  for (const row of reportsRes.data ?? []) {
    reportCounts.set(row.listing_id, (reportCounts.get(row.listing_id) ?? 0) + 1);
  }

  const activeByUser = new Map<string, number>();
  for (const row of activeListingsRes.data ?? []) {
    activeByUser.set(row.user_id, (activeByUser.get(row.user_id) ?? 0) + 1);
  }

  return rows.map((listing) => ({
    ...listing,
    report_count: reportCounts.get(listing.id) ?? 0,
    owner_active_listing_count: activeByUser.get(listing.user_id) ?? 0,
  }));
}

function applyAdminListingFilters(
  rows: AdminListingWithMeta[],
  filters?: AdminListingFilters
): AdminListingWithMeta[] {
  let result = rows;

  if (filters?.filter === "location") {
    result = result.filter(hasLocationIssue);
  } else if (filters?.filter === "incomplete") {
    result = result.filter(isListingIncomplete);
  }

  if (filters?.quick === "needs_review") {
    result = result.filter(
      (l) => l.approval_status === "pending_review" || l.status === "pending"
    );
  } else if (filters?.quick === "needs_changes") {
    result = result.filter((l) => l.approval_status === "needs_changes");
  } else if (filters?.quick === "no_photos") {
    result = result.filter((l) => photoCount(l) < MIN_LISTING_PHOTOS_FOR_REVIEW);
  } else if (filters?.quick === "unverified_phone") {
    result = result.filter((l) => {
      const owner = l.profiles as { primary_phone_verified_at?: string | null } | null;
      return !owner?.primary_phone_verified_at;
    });
  } else if (filters?.quick === "with_reports") {
    result = result.filter((l) => l.report_count > 0);
  } else if (filters?.quick === "high_priority") {
    result = result.filter((l) => {
      const { priority } = scoreListingPriority(l, l.report_count);
      return priority === "high" || priority === "critical";
    });
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter((l) => {
      const owner = l.profiles as { full_name?: string; email?: string } | null;
      return (
        l.title?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.area?.toLowerCase().includes(q) ||
        l.ama_number?.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        owner?.full_name?.toLowerCase().includes(q) ||
        owner?.email?.toLowerCase().includes(q)
      );
    });
  }

  return result;
}

export async function getAdminAllListings(
  filters?: AdminListingFilters
): Promise<AdminListingWithMeta[]> {
  const db = await adminDb();
  if (!db) return [];

  let query = db
    .from("listings")
    .select(
      "*, listing_images(id, url, sort_order, media_type, is_cover), profiles(id, full_name, phone, email, primary_phone_verified_at, avatar_path, avatar_status)"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (filters?.rentalType) {
    query = query.eq("rental_type", filters.rentalType);
  }
  if (filters?.status === "active") {
    query = query.eq("status", "approved").eq("is_hidden", false);
  } else if (filters?.status === "pending") {
    query = query.eq("status", "pending");
  } else if (filters?.status === "needs_changes") {
    query = query.eq("approval_status", "needs_changes");
  } else if (filters?.status === "rejected") {
    query = query.eq("status", "rejected");
  } else if (filters?.status === "hidden") {
    query = query.eq("is_hidden", true);
  }
  if (filters?.registry === "with") {
    query = query.not("ama_number", "is", null).neq("ama_number", "");
  } else if (filters?.registry === "without") {
    query = query.or("ama_number.is.null,ama_number.eq.");
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin] getAdminAllListings:", error.message);
    return [];
  }

  const enriched = await enrichListingsWithMeta((data ?? []) as ListingWithImages[]);
  return applyAdminListingFilters(enriched, filters);
}

export async function getAdminActionCenterStats(): Promise<AdminActionCenterStats> {
  const db = await adminDb();
  if (!db) {
    return {
      pendingReview: 0,
      needsChanges: 0,
      incompleteListings: 0,
      registryPendingReview: 0,
      newReports: 0,
      usersWithIssues: 0,
      highPriority: 0,
      locationIssues: 0,
      noPhotos: 0,
      unverifiedPhone: 0,
      withReports: 0,
      newListingReports: 0,
      pendingVerifications: 0,
    };
  }

  const [listingsRes, reportsRes, bugReportsRes, usersRes] = await Promise.all([
    db
      .from("listings")
      .select(
        "*, listing_images(id, url, sort_order, media_type, is_cover), profiles(id, full_name, phone, email, primary_phone_verified_at, avatar_path, avatar_status)"
      )
      .order("created_at", { ascending: false })
      .limit(500),
    db.from("listing_reports").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("bug_reports").select("id", { count: "exact", head: true }).eq("status", "new"),
    db
      .from("profiles")
      .select("id, full_name, phone, primary_phone_verified_at, account_status")
      .limit(500),
  ]);

  const enriched = await enrichListingsWithMeta((listingsRes.data ?? []) as ListingWithImages[]);

  let pendingReview = 0;
  let needsChanges = 0;
  let locationIssues = 0;
  let incompleteListings = 0;
  let noPhotos = 0;
  let unverifiedPhone = 0;
  let withReports = 0;
  let highPriority = 0;
  let pendingVerifications = 0;
  let registryPendingReview = 0;

  for (const listing of enriched) {
    const effective = getEffectiveListingStatus(listing);
    if (effective === "pending" || listing.approval_status === "pending_review") {
      pendingReview += 1;
    }
    if (listing.approval_status === "needs_changes") needsChanges += 1;
    if (hasLocationIssue(listing)) locationIssues += 1;
    if (isListingIncomplete(listing)) incompleteListings += 1;
    if (photoCount(listing) < MIN_LISTING_PHOTOS_FOR_REVIEW) noPhotos += 1;

    const owner = listing.profiles as { primary_phone_verified_at?: string | null } | null;
    if (!owner?.primary_phone_verified_at) unverifiedPhone += 1;
    if (listing.report_count > 0) withReports += 1;

    const { priority } = scoreListingPriority(listing, listing.report_count);
    if (priority === "high" || priority === "critical") highPriority += 1;

    if (
      listing.rental_type === "short_term" &&
      (!listing.ama_number?.trim() || listing.legal_registry_type === "none")
    ) {
      registryPendingReview += 1;
    }

    if (
      listing.advertiser_verification_status === "pending" ||
      listing.advertiser_verification_status === "needs_review" ||
      listing.property_verification_status === "pending" ||
      listing.property_verification_status === "needs_review"
    ) {
      pendingVerifications += 1;
    }
  }

  const users = usersRes.data ?? [];
  const usersWithIssues = users.filter(
    (u) =>
      u.account_status === "suspended" ||
      !u.primary_phone_verified_at ||
      !u.full_name?.trim() ||
      !u.phone?.trim()
  ).length;

  const newListingReports = reportsRes.count ?? 0;
  const newBugReports = bugReportsRes.count ?? 0;

  return {
    pendingReview,
    needsChanges,
    incompleteListings,
    registryPendingReview,
    newReports: newListingReports + newBugReports,
    usersWithIssues,
    highPriority,
    locationIssues,
    noPhotos,
    unverifiedPhone,
    withReports,
    newListingReports,
    pendingVerifications,
  };
}

export async function getAdminPriorityQueue(limit = 10): Promise<PriorityListingMeta[]> {
  const db = await adminDb();
  if (!db) return [];

  const { data, error } = await db
    .from("listings")
    .select(
      "*, listing_images(id, url, sort_order, media_type, is_cover), profiles(id, full_name, phone, email, primary_phone_verified_at, avatar_path, avatar_status)"
    )
    .or("status.eq.pending,approval_status.eq.pending_review,approval_status.eq.needs_changes")
    .order("updated_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("[admin] getAdminPriorityQueue:", error.message);
    return [];
  }

  const enriched = await enrichListingsWithMeta((data ?? []) as ListingWithImages[]);
  const scored = enriched.map((listing) =>
    scoreListingPriority(listing, listing.report_count)
  );
  return sortByPriority(scored).slice(0, limit);
}

export async function getAdminAuditLogs(
  limit = 100,
  filters?: { action?: string; entityType?: string; search?: string }
) {
  const db = await adminDb();
  if (!db) return [];

  let query = db
    .from("admin_audit_logs")
    .select("*, profiles:admin_user_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin] getAdminAuditLogs:", error.message);
    return [];
  }

  let rows = data ?? [];
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter((log) => {
      const admin = log.profiles as { full_name?: string; email?: string } | null;
      return (
        log.action?.toLowerCase().includes(q) ||
        log.entity_type?.toLowerCase().includes(q) ||
        log.entity_id?.toLowerCase().includes(q) ||
        admin?.full_name?.toLowerCase().includes(q) ||
        admin?.email?.toLowerCase().includes(q)
      );
    });
  }

  return rows;
}

export async function getAdminListingById(id: string) {
  const db = await adminDb();
  if (!db) return null;

  const { data: listing, error: listingError } = await db
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (listingError || !listing) {
    if (listingError) {
      console.error("[admin] getAdminListingById listing:", listingError.message);
    }
    return null;
  }

  const imagesRes = await db
    .from("listing_images")
    .select("id, listing_id, url, sort_order, media_type, is_cover, created_at")
    .eq("listing_id", id)
    .order("sort_order");

  let listingImages = imagesRes.data ?? [];
  if (imagesRes.error) {
    const fallback = await db
      .from("listing_images")
      .select("id, listing_id, url, sort_order, created_at")
      .eq("listing_id", id)
      .order("sort_order");
    listingImages = (fallback.data ?? []).map((row, index) => ({
      ...row,
      media_type: "image",
      is_cover: index === 0,
    }));
  }

  let profile: Record<string, unknown> | null = null;
  if (listing.user_id) {
    const profileRes = await db
      .from("profiles")
      .select("id, full_name, phone, email, role, created_at")
      .eq("id", listing.user_id)
      .maybeSingle();

    if (!profileRes.error && profileRes.data) {
      profile = profileRes.data;
    } else {
      const fallback = await db
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", listing.user_id)
        .maybeSingle();
      profile = fallback.data;
    }
  }

  return {
    ...listing,
    listing_images: listingImages,
    profiles: profile,
  };
}

export async function getAdminListingOwnerStats(userId: string) {
  const db = await adminDb();
  if (!db) return { listingCount: 0, memberSince: null as string | null, email: null as string | null };
  const [{ count }, { data: profile }] = await Promise.all([
    db.from("listings").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("profiles").select("created_at, email").eq("id", userId).maybeSingle(),
  ]);
  return {
    listingCount: count ?? 0,
    memberSince: profile?.created_at ?? null,
    email: profile?.email ?? null,
  };
}

export async function getAdminPriceRulesForListing(listingId: string) {
  const db = await adminDb();
  if (!db) return [];
  const { data, error } = await db
    .from("listing_price_rules")
    .select("*")
    .eq("listing_id", listingId)
    .order("start_date");
  if (error?.message?.includes("does not exist")) return [];
  return data ?? [];
}

export async function getAdminListingReportsForListing(listingId: string) {
  const db = await adminDb();
  if (!db) return [];
  const { data, error } = await db
    .from("listing_reports")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error?.message?.includes("does not exist")) return [];
  return data ?? [];
}

export async function getAdminUnavailableForListing(listingId: string) {
  const db = await adminDb();
  if (!db) return [];
  const { data, error } = await db
    .from("listing_unavailable_periods")
    .select("*")
    .eq("listing_id", listingId)
    .order("start_date", { ascending: false })
    .limit(20);
  if (error?.message?.includes("does not exist")) return [];
  return data ?? [];
}

export async function getAdminUsers() {
  const db = await adminDb();
  if (!db) return [];
  const { data: profiles } = await db
    .from("profiles")
    .select(
      "id, full_name, email, phone, role, created_at, avatar_path, avatar_status, primary_phone_verified_at, account_status"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (!profiles?.length) return [];

  const [{ data: listingCounts }, { data: leadCounts }, { data: listings }, { data: reports }] =
    await Promise.all([
      db.from("listings").select("user_id"),
      db.from("property_leads").select("owner_id").eq("status", "new"),
      db.from("listings").select("id, user_id"),
      db.from("listing_reports").select("listing_id"),
    ]);

  const listingsByUser = new Map<string, number>();
  for (const row of listingCounts ?? []) {
    listingsByUser.set(row.user_id, (listingsByUser.get(row.user_id) ?? 0) + 1);
  }
  const leadsByOwner = new Map<string, number>();
  for (const row of leadCounts ?? []) {
    leadsByOwner.set(row.owner_id, (leadsByOwner.get(row.owner_id) ?? 0) + 1);
  }

  const listingOwner = new Map<string, string>();
  for (const row of listings ?? []) {
    listingOwner.set(row.id, row.user_id);
  }
  const reportsByUser = new Map<string, number>();
  for (const row of reports ?? []) {
    const ownerId = listingOwner.get(row.listing_id);
    if (ownerId) {
      reportsByUser.set(ownerId, (reportsByUser.get(ownerId) ?? 0) + 1);
    }
  }

  return profiles.map((p) => ({
    ...p,
    listingCount: listingsByUser.get(p.id) ?? 0,
    newLeads: leadsByOwner.get(p.id) ?? 0,
    reportCount: reportsByUser.get(p.id) ?? 0,
  }));
}

export async function getAdminUserById(userId: string) {
  const db = await adminDb();
  if (!db) return null;

  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) return null;

  const { data: listings } = await db
    .from("listings")
    .select("id, title, city, area, status, approval_status, created_at, is_hidden")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const listingIds = (listings ?? []).map((l) => l.id);
  let reportCount = 0;
  if (listingIds.length > 0) {
    const { count } = await db
      .from("listing_reports")
      .select("id", { count: "exact", head: true })
      .in("listing_id", listingIds);
    reportCount = count ?? 0;
  }

  return {
    profile,
    listings: listings ?? [],
    reportCount,
  };
}

export async function getAdminLeads() {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("property_leads")
    .select(
      "*, listings(id, title, city, area, slug), owner:owner_id(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getAdminListingReports() {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("listing_reports")
    .select("*, listings(id, title, city, area, slug)")
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getAdminBugReports() {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("bug_reports")
    .select("*, profiles:user_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getAdminUnavailablePeriods() {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("listing_unavailable_periods")
    .select("*, listings(id, title, city, area), profiles:owner_id(full_name)")
    .order("start_date", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getAdminPayments() {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("payments")
    .select("*, profiles:user_id(full_name), listings(id, title)")
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getAdminSettings() {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db.from("admin_settings").select("*");
  return data ?? [];
}

export async function getRegistryListings() {
  const db = await adminDb();
  if (!db) return [];
  const { data } = await db
    .from("listings")
    .select("id, title, city, area, rental_type, legal_registry_type, ama_number, approval_status, status, property_verification_status, created_at, profiles(full_name)")
    .or("rental_type.eq.short_term,accepts_under_60_days.eq.true")
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getVerificationListings(filter?: string) {
  const db = await adminDb();
  if (!db) return [];
  let query = db
    .from("listings")
    .select(
      "id, title, city, rental_type, advertiser_verification_status, property_verification_status, admin_verification_notes, profiles(full_name)"
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (filter === "pending") {
    query = query.or(
      "advertiser_verification_status.eq.pending,property_verification_status.eq.pending,advertiser_verification_status.eq.needs_review,property_verification_status.eq.needs_review"
    );
  } else if (filter === "verified") {
    query = query.or(
      "advertiser_verification_status.eq.verified,property_verification_status.eq.verified"
    );
  } else if (filter === "failed") {
    query = query.or(
      "advertiser_verification_status.eq.failed,property_verification_status.eq.failed,advertiser_verification_status.eq.rejected,property_verification_status.eq.rejected"
    );
  }

  const { data } = await query;
  return data ?? [];
}
