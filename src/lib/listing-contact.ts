import type { Listing, Profile } from "@/lib/types";

import { REQUIRE_LISTING_PHONE_SMS_VERIFICATION } from "@/lib/constants";
import { buildListingWhatsAppMessage, buildWhatsAppUrl, normalizePhoneForWhatsApp } from "@/lib/whatsapp";

import { normalizePhoneToE164, isValidGreekMobileE164, phonesMatch } from "@/lib/phone-e164";

export type ListingPublicContact = {
  allowMessage: boolean;
  allowPhone: boolean;
  allowWhatsApp: boolean;
  allowViber: boolean;
  phone: string | null;
  email: string | null;
  whatsappPhone: string | null;
  viberPhone: string | null;
  whatsappUrl: string | null;
  viberUrl: string | null;
  listingTitle: string;
};

type ProfileContact = Pick<
  Profile,
  | "phone"
  | "primary_phone_verified_at"
  | "allow_phone_contact"
  | "allow_whatsapp"
  | "allow_viber"
  | "allow_message"
  | "whatsapp_phone"
  | "viber_phone"
  | "whatsapp_use_primary_phone"
  | "viber_use_primary_phone"
  | "whatsapp_phone_verified_at"
  | "viber_phone_verified_at"
>;

type ListingContact = Pick<
  Listing,
  | "title"
  | "contact_phone"
  | "contact_email"
  | "use_profile_contact"
  | "allow_phone_contact"
  | "allow_whatsapp"
  | "allow_viber"
  | "allow_message"
  | "contact_whatsapp_phone"
  | "contact_viber_phone"
  | "contact_whatsapp_use_primary"
  | "contact_viber_use_primary"
>;

function resolveFlag(
  listingValue: boolean | null | undefined,
  profileValue: boolean | null | undefined,
  fallback: boolean
): boolean {
  if (listingValue != null) return listingValue;
  if (profileValue != null) return profileValue;
  return fallback;
}

function phoneIsCallable(phone: string | null | undefined): boolean {
  if (!phone?.trim()) return false;
  const e164 = normalizePhoneToE164(phone);
  return Boolean(e164 && isValidGreekMobileE164(e164));
}

function phoneIsVerified(
  phone: string | null | undefined,
  verifiedAt: string | null | undefined
): boolean {
  if (!phone?.trim() || !verifiedAt) return false;
  return phoneIsCallable(phone);
}

export function isProfilePhoneVerified(
  profile: Pick<Profile, "phone" | "primary_phone_verified_at"> | null | undefined,
  phone: string
): boolean {
  if (!profile?.primary_phone_verified_at || !profile.phone?.trim()) return false;
  return phonesMatch(profile.phone, phone);
}

function resolveVerifiedPrimaryPhone(
  listing: ListingContact,
  profile?: ProfileContact | null
): string | null {
  const useProfile = listing.use_profile_contact !== false;

  const listingPhone = listing.contact_phone?.trim() || null;
  const profilePhone = profile?.phone?.trim() || null;
  const candidate = useProfile ? profilePhone || listingPhone : listingPhone || profilePhone;

  if (!candidate) return null;

  if (
    phoneIsVerified(profilePhone, profile?.primary_phone_verified_at) &&
    phonesMatch(profilePhone, candidate)
  ) {
    return candidate;
  }

  return null;
}

function resolveVerifiedChannelPhone(input: {
  listingCustom: string | null | undefined;
  listingUsePrimary: boolean | null | undefined;
  profileCustom: string | null | undefined;
  profileUsePrimary: boolean | null | undefined;
  primaryPhone: string | null;
  primaryVerifiedAt: string | null | undefined;
  channelVerifiedAt: string | null | undefined;
  useProfileContact: boolean;
}): string | null {
  const {
    listingCustom,
    listingUsePrimary,
    profileCustom,
    profileUsePrimary,
    primaryPhone,
    primaryVerifiedAt,
    channelVerifiedAt,
    useProfileContact,
  } = input;

  if (!useProfileContact && listingCustom?.trim()) {
    const custom = listingCustom.trim();
    const e164 = normalizePhoneToE164(custom);
    if (!e164) return null;

    if (
      phoneIsVerified(profileCustom, channelVerifiedAt) &&
      phonesMatch(profileCustom, custom)
    ) {
      return custom;
    }

    if (
      phoneIsVerified(primaryPhone, primaryVerifiedAt) &&
      primaryPhone &&
      phonesMatch(primaryPhone, custom)
    ) {
      return custom;
    }

    return null;
  }

  const usePrimary = listingUsePrimary ?? profileUsePrimary ?? true;

  if (usePrimary) {
    return phoneIsVerified(primaryPhone, primaryVerifiedAt) ? primaryPhone : null;
  }

  const custom = profileCustom?.trim();
  if (!custom) return null;

  return phoneIsVerified(custom, channelVerifiedAt) ? custom : null;
}

export function buildViberUrl(phone: string): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  return `viber://chat?number=%2B${normalized}`;
}

export function resolveListingPublicContact(
  listing: ListingContact,
  profile?: ProfileContact | null
): ListingPublicContact {
  const useProfileContact = listing.use_profile_contact !== false;
  const primaryPhone = resolveVerifiedPrimaryPhone(listing, profile);

  const allowMessage = resolveFlag(listing.allow_message, profile?.allow_message, true);

  const allowPhone = resolveFlag(
    listing.allow_phone_contact,
    profile?.allow_phone_contact,
    Boolean(primaryPhone)
  );

  const allowWhatsApp = resolveFlag(listing.allow_whatsapp, profile?.allow_whatsapp, false);

  const allowViber = resolveFlag(listing.allow_viber, profile?.allow_viber, false);

  const whatsappPhone = allowWhatsApp
    ? resolveVerifiedChannelPhone({
        listingCustom: listing.contact_whatsapp_phone,
        listingUsePrimary: listing.contact_whatsapp_use_primary,
        profileCustom: profile?.whatsapp_phone,
        profileUsePrimary: profile?.whatsapp_use_primary_phone,
        primaryPhone: profile?.phone?.trim() || listing.contact_phone?.trim() || null,
        primaryVerifiedAt: profile?.primary_phone_verified_at,
        channelVerifiedAt: profile?.whatsapp_phone_verified_at,
        useProfileContact,
      })
    : null;

  const viberPhone = allowViber
    ? resolveVerifiedChannelPhone({
        listingCustom: listing.contact_viber_phone,
        listingUsePrimary: listing.contact_viber_use_primary,
        profileCustom: profile?.viber_phone,
        profileUsePrimary: profile?.viber_use_primary_phone,
        primaryPhone: profile?.phone?.trim() || listing.contact_phone?.trim() || null,
        primaryVerifiedAt: profile?.primary_phone_verified_at,
        channelVerifiedAt: profile?.viber_phone_verified_at,
        useProfileContact,
      })
    : null;

  const whatsappUrl =
    whatsappPhone &&
    buildWhatsAppUrl(whatsappPhone, buildListingWhatsAppMessage(listing.title));

  const viberUrl = viberPhone ? buildViberUrl(viberPhone) : null;

  const email = listing.contact_email?.trim() || null;

  return {
    allowMessage,
    allowPhone: allowPhone && Boolean(primaryPhone),
    allowWhatsApp: allowWhatsApp && Boolean(whatsappPhone),
    allowViber: allowViber && Boolean(viberPhone),
    phone: primaryPhone,
    email,
    whatsappPhone,
    viberPhone,
    whatsappUrl,
    viberUrl,
    listingTitle: listing.title,
  };
}

export function hasVerifiedContactPhone(profile: ProfileContact | null | undefined): boolean {
  return phoneIsVerified(profile?.phone, profile?.primary_phone_verified_at);
}

export function hasCallablePhone(phone: string | null | undefined): boolean {
  return phoneIsCallable(phone);
}

export function listingPhoneReadyForCalls(
  contactPhone: string,
  allowPhone: boolean,
  profile: Pick<Profile, "phone" | "primary_phone_verified_at"> | null | undefined
): boolean {
  if (!allowPhone || !contactPhone.trim()) return true;
  if (!hasCallablePhone(contactPhone)) return false;
  if (!REQUIRE_LISTING_PHONE_SMS_VERIFICATION) return true;
  return isProfilePhoneVerified(profile, contactPhone);
}
