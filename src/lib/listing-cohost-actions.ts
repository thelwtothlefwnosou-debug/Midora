"use server";

import { actionError, authActionError, mustSignInError } from "@/lib/action-error-i18n";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  accessAllows,
  resolveListingAccess,
  type ListingAccessContext,
} from "@/lib/listing-access";
import { logListingAudit } from "@/lib/listing-audit-log";
import {
  canInviteMoreCohosts,
  countActiveCohosts,
} from "@/lib/listing-cohosts-db";
import {
  DEFAULT_COHOST_INVITE_MESSAGE,
  MAX_COHOSTS_PER_LISTING,
  permissionFlagsForLevel,
  type CohostPermissionLevel,
  type ListingAccessPermission,
} from "@/lib/listing-cohost-permissions";
import {
  sendCohostInviteEmail,
  sendCohostRemovedEmail,
  sendCohostAcceptedEmail,
} from "@/lib/listing-cohost-emails";
import { profileDisplayName } from "@/lib/profile-display";

type ActionResult = { success: true } | { error: string };

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { error: await authActionError("supabaseNotConfigured") } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return await mustSignInError();
  return { supabase, user };
}

export async function requireListingPermission(
  listingId: string,
  permission: ListingAccessPermission
): Promise<
  | { error: string }
  | {
      supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
      user: { id: string; email?: string | null };
      access: ListingAccessContext;
      listing: { user_id: string };
    }
> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const access = await resolveListingAccess(auth.supabase, listingId, auth.user.id);
  if (!access) return { error: await actionError("noAccess") };

  if (!accessAllows(access, permission)) {
    return { error: await actionError("noPermission") };
  }

  const { data: listing } = await auth.supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (!listing) return { error: await actionError("listingNotFound") };

  return {
    supabase: auth.supabase,
    user: auth.user,
    access,
    listing,
  };
}

async function requireListingOwnerOnly(listingId: string) {
  return requireListingPermission(listingId, "owner_only");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function acceptCohostInviteForm(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return;
  await acceptCohostInvite(token);
}

export async function declineCohostInviteForm(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return;
  await declineCohostInvite(token);
}

export async function inviteListingCohost(
  listingId: string,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireListingOwnerOnly(listingId);
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const invitedName = String(formData.get("name") ?? "").trim() || null;
  const permissionLevel = String(
    formData.get("permission_level") ?? "full_access"
  ) as CohostPermissionLevel;
  const inviteMessage =
    String(formData.get("message") ?? "").trim() || DEFAULT_COHOST_INVITE_MESSAGE;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: await actionError("cohostValidEmail") };
  }

  if (auth.user.email && normalizeEmail(auth.user.email) === email) {
    return { error: await actionError("cohostSelfInvite") };
  }

  const activeCount = await countActiveCohosts(listingId, auth.listing.user_id);
  if (!canInviteMoreCohosts(activeCount)) {
    return {
      error: await actionError("cohostMax", { count: MAX_COHOSTS_PER_LISTING }),
    };
  }

  const flags = permissionFlagsForLevel(permissionLevel);

  const { data: existing } = await auth.supabase
    .from("listing_cohosts")
    .select("id, status")
    .eq("listing_id", listingId)
    .eq("invited_email", email)
    .in("status", ["pending", "accepted"])
    .maybeSingle();

  if (existing) {
    return { error: await actionError("cohostDuplicateEmail") };
  }

  const { data: listing } = await auth.supabase
    .from("listings")
    .select("title")
    .eq("id", listingId)
    .single();

  const { data: ownerProfile } = await auth.supabase
    .from("profiles")
    .select("full_name, display_name")
    .eq("id", auth.user.id)
    .single();

  const { data: invite, error } = await auth.supabase
    .from("listing_cohosts")
    .insert({
      listing_id: listingId,
      owner_user_id: auth.listing.user_id,
      invited_email: email,
      invited_name: invitedName,
      invite_message: inviteMessage,
      permission_level: permissionLevel,
      ...flags,
      status: "pending",
    })
    .select("invite_token")
    .single();

  if (error || !invite) {
    return { error: error?.message ?? (await actionError("inviteSendFailed")) };
  }

  await logListingAudit(auth.supabase, {
    listingId,
    actorUserId: auth.user.id,
    actorRole: "owner",
    action: "cohost.invited",
    targetType: "listing_cohost",
    metadata: { invitedEmail: email, permissionLevel },
  });

  const ownerName = ownerProfile
    ? profileDisplayName(ownerProfile)
    : await actionError("ownerFallback");

  await sendCohostInviteEmail({
    to: email,
    ownerName,
    listingTitle: listing?.title ?? (await actionError("listingFallback")),
    inviteToken: invite.invite_token,
    message: inviteMessage,
  });

  revalidatePath(`/dashboard/listings/${listingId}/cohosts`);
  return { success: true };
}

export async function updateListingCohostPermission(
  cohostId: string,
  listingId: string,
  permissionLevel: CohostPermissionLevel
): Promise<ActionResult> {
  const auth = await requireListingOwnerOnly(listingId);
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const flags = permissionFlagsForLevel(permissionLevel);

  const { error } = await auth.supabase
    .from("listing_cohosts")
    .update({
      permission_level: permissionLevel,
      ...flags,
    })
    .eq("id", cohostId)
    .eq("listing_id", listingId)
    .eq("owner_user_id", auth.user.id)
    .in("status", ["pending", "accepted"]);

  if (error) return { error: error.message };

  await logListingAudit(auth.supabase, {
    listingId,
    actorUserId: auth.user.id,
    actorRole: "owner",
    action: "cohost.permission_updated",
    targetType: "listing_cohost",
    targetId: cohostId,
    metadata: { permissionLevel },
  });

  revalidatePath(`/dashboard/listings/${listingId}/cohosts`);
  return { success: true };
}

export async function removeListingCohost(
  cohostId: string,
  listingId: string
): Promise<ActionResult> {
  const auth = await requireListingOwnerOnly(listingId);
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const { data: row } = await auth.supabase
    .from("listing_cohosts")
    .select("invited_email, cohost_user_id, status")
    .eq("id", cohostId)
    .eq("listing_id", listingId)
    .single();

  const { error } = await auth.supabase
    .from("listing_cohosts")
    .update({
      status: "removed",
      removed_at: new Date().toISOString(),
    })
    .eq("id", cohostId)
    .eq("listing_id", listingId)
    .eq("owner_user_id", auth.user.id);

  if (error) return { error: error.message };

  await logListingAudit(auth.supabase, {
    listingId,
    actorUserId: auth.user.id,
    actorRole: "owner",
    action: "cohost.removed",
    targetType: "listing_cohost",
    targetId: cohostId,
  });

  if (row?.invited_email) {
    const { data: listing } = await auth.supabase
      .from("listings")
      .select("title")
      .eq("id", listingId)
      .single();
    await sendCohostRemovedEmail({
      to: row.invited_email,
      listingTitle: listing?.title ?? (await actionError("listingFallback")),
    });
  }

  revalidatePath(`/dashboard/listings/${listingId}/cohosts`);
  return { success: true };
}

export async function resendListingCohostInvite(
  cohostId: string,
  listingId: string
): Promise<ActionResult> {
  const auth = await requireListingOwnerOnly(listingId);
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const { data: row } = await auth.supabase
    .from("listing_cohosts")
    .select("invited_email, invite_token, invite_message, status")
    .eq("id", cohostId)
    .eq("listing_id", listingId)
    .eq("owner_user_id", auth.user.id)
    .single();

  if (!row || row.status !== "pending") {
    return { error: await actionError("inviteNotPending") };
  }

  const { data: listing } = await auth.supabase
    .from("listings")
    .select("title")
    .eq("id", listingId)
    .single();

  const { data: ownerProfile } = await auth.supabase
    .from("profiles")
    .select("full_name, display_name")
    .eq("id", auth.user.id)
    .single();

  const ownerName = ownerProfile
    ? profileDisplayName(ownerProfile)
    : await actionError("ownerFallback");

  await sendCohostInviteEmail({
    to: row.invited_email,
    ownerName,
    listingTitle: listing?.title ?? (await actionError("listingFallback")),
    inviteToken: row.invite_token,
    message: row.invite_message ?? DEFAULT_COHOST_INVITE_MESSAGE,
  });

  return { success: true };
}

export async function acceptCohostInvite(token: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const userEmail = auth.user.email?.trim().toLowerCase();
  if (!userEmail) return { error: await actionError("accountNoEmail") };

  const { data: invite } = await auth.supabase
    .from("listing_cohosts")
    .select("*, listings(title, user_id)")
    .eq("invite_token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite) return { error: await actionError("inviteNotFoundOrExpired") };

  if (invite.invited_email !== userEmail) {
    return { error: await actionError("inviteWrongEmail") };
  }

  const { error } = await auth.supabase
    .from("listing_cohosts")
    .update({
      status: "accepted",
      cohost_user_id: auth.user.id,
      accepted_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  await logListingAudit(auth.supabase, {
    listingId: invite.listing_id,
    actorUserId: auth.user.id,
    actorRole: "cohost",
    action: "cohost.accepted",
    targetType: "listing_cohost",
    targetId: invite.id,
  });

  const listingTitle =
    (invite.listings as { title?: string } | null)?.title ?? (await actionError("listingFallback"));

  const cohostName = profileDisplayName({
    full_name: auth.user.user_metadata?.full_name ?? "",
    display_name: null,
  });

  // Prefer auth.users email via service role — profiles.email is not a reliable column.
  let ownerEmail: string | null = null;
  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const service = createServiceClient();
    if (service) {
      const { data: ownerUser } = await service.auth.admin.getUserById(invite.owner_user_id);
      ownerEmail = ownerUser.user?.email?.trim() || null;
    }
  } catch {
    ownerEmail = null;
  }

  if (ownerEmail) {
    await sendCohostAcceptedEmail({
      to: ownerEmail,
      cohostName,
      listingTitle,
    });
  }

  revalidatePath("/dashboard/listings");
  redirect("/dashboard/listings");
}

export async function declineCohostInvite(token: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const userEmail = auth.user.email?.trim().toLowerCase();
  if (!userEmail) return { error: await actionError("accountNoEmail") };

  const { data: invite } = await auth.supabase
    .from("listing_cohosts")
    .select("id, listing_id, invited_email")
    .eq("invite_token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite || invite.invited_email !== userEmail) {
    return { error: await actionError("inviteNotFound") };
  }

  const { error } = await auth.supabase
    .from("listing_cohosts")
    .update({
      status: "declined",
      declined_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (error) return { error: error.message };

  await logListingAudit(auth.supabase, {
    listingId: invite.listing_id,
    actorUserId: auth.user.id,
    actorRole: "cohost",
    action: "cohost.declined",
    targetType: "listing_cohost",
    targetId: invite.id,
  });

  redirect("/dashboard/listings");
}

export async function leaveListingAsCohost(listingId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const { error } = await auth.supabase
    .from("listing_cohosts")
    .update({
      status: "removed",
      removed_at: new Date().toISOString(),
    })
    .eq("listing_id", listingId)
    .eq("cohost_user_id", auth.user.id)
    .eq("status", "accepted");

  if (error) return { error: error.message };

  await logListingAudit(auth.supabase, {
    listingId,
    actorUserId: auth.user.id,
    actorRole: "cohost",
    action: "cohost.left",
  });

  revalidatePath("/dashboard/listings");
  return { success: true };
}

export async function replyToPropertyLead(
  leadId: string,
  body: string
): Promise<ActionResult> {
  const trimmed = body.trim();
  if (!trimmed) return { error: await actionError("replyMessageRequired") };

  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const { data: lead } = await auth.supabase
    .from("property_leads")
    .select("id, listing_id, owner_id")
    .eq("id", leadId)
    .single();

  if (!lead) return { error: await actionError("leadNotFound") };

  const access = await resolveListingAccess(
    auth.supabase,
    lead.listing_id,
    auth.user.id
  );
  if (!access || !accessAllows(access, "manage_messages")) {
    return { error: await actionError("noPermissionReply") };
  }

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("full_name, display_name")
    .eq("id", auth.user.id)
    .single();

  const displayName = profile ? profileDisplayName(profile) : await actionError("userFallback");
  const senderRole = access.role === "owner" ? "owner" : "cohost";

  const { error: replyError } = await auth.supabase.from("property_lead_replies").insert({
    lead_id: leadId,
    listing_id: lead.listing_id,
    sender_user_id: auth.user.id,
    sender_role: senderRole,
    sender_display_name: displayName,
    body: trimmed,
  });

  if (replyError) return { error: replyError.message };

  await auth.supabase
    .from("property_leads")
    .update({ status: "replied", updated_at: new Date().toISOString() })
    .eq("id", leadId);

  await logListingAudit(auth.supabase, {
    listingId: lead.listing_id,
    actorUserId: auth.user.id,
    actorRole: senderRole,
    action: "lead.replied",
    targetType: "property_lead",
    targetId: leadId,
  });

  if (access.cohostId) {
    await auth.supabase
      .from("listing_cohosts")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", access.cohostId);
  }

  revalidatePath(`/dashboard/listings/${lead.listing_id}/inquiries`);
  revalidatePath("/dashboard/requests");
  return { success: true };
}

export async function upsertListingContactNumber(
  listingId: string,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireListingPermission(listingId, "manage_listing");
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const phone = String(formData.get("phone_number") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || null;
  const visibility = String(formData.get("visibility") ?? "private") as
    | "private"
    | "after_inquiry"
    | "public";
  const contactId = String(formData.get("id") ?? "").trim() || null;

  if (!phone) return { error: await actionError("phoneRequired") };

  const role = auth.access.role === "owner" ? "owner" : "cohost";

  if (contactId) {
    const { error } = await auth.supabase
      .from("listing_contact_numbers")
      .update({
        phone_number: phone,
        label,
        visibility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId)
      .eq("listing_id", listingId)
      .eq("user_id", auth.user.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await auth.supabase.from("listing_contact_numbers").insert({
      listing_id: listingId,
      user_id: auth.user.id,
      role,
      phone_number: phone,
      label,
      visibility,
    });

    if (error) return { error: error.message };
  }

  await logListingAudit(auth.supabase, {
    listingId,
    actorUserId: auth.user.id,
    actorRole: auth.access.role,
    action: "contact_number.upserted",
    targetType: "listing_contact_number",
  });

  revalidatePath(`/dashboard/listings/${listingId}/cohosts`);
  return { success: true };
}

export async function deleteListingContactNumber(
  contactId: string,
  listingId: string
): Promise<ActionResult> {
  const auth = await requireListingPermission(listingId, "manage_listing");
  if ("error" in auth) return { error: auth.error ?? (await actionError("accessError")) };

  const { error } = await auth.supabase
    .from("listing_contact_numbers")
    .delete()
    .eq("id", contactId)
    .eq("listing_id", listingId)
    .eq("user_id", auth.user.id);

  if (error) return { error: error.message };

  await logListingAudit(auth.supabase, {
    listingId,
    actorUserId: auth.user.id,
    actorRole: auth.access.role,
    action: "contact_number.deleted",
    targetType: "listing_contact_number",
    targetId: contactId,
  });

  revalidatePath(`/dashboard/listings/${listingId}/cohosts`);
  return { success: true };
}
