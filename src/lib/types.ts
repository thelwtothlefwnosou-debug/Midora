export type PropertyLeadStatus = "new" | "read" | "replied" | "archived";

export type ListingAvailabilityStatus =
  | "available_now"
  | "from_month"
  | "upon_request";

export type PropertyLead = {
  id: string;
  listing_id: string;
  owner_id: string;
  guest_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  start_date: string | null;
  duration: string | null;
  timing_note?: string | null;
  interest_start_date?: string | null;
  interest_end_date?: string | null;
  interest_start_month?: string | null;
  interest_duration_months?: number | null;
  guests: number | null;
  message: string | null;
  status: PropertyLeadStatus;
  created_at: string;
  updated_at: string;
};

export type PropertyLeadWithListing = PropertyLead & {
  listings:
    | (Pick<Listing, "id" | "title" | "city" | "area" | "slug"> & {
        listing_images?: Pick<ListingImage, "url" | "media_type" | "is_cover" | "sort_order">[];
      })
    | null;
};

export type CohostPermissionLevel =
  | "full_access"
  | "messages_availability"
  | "messages_only";

export type CohostStatus = "pending" | "accepted" | "declined" | "removed";

export type ListingCohost = {
  id: string;
  listing_id: string;
  owner_user_id: string;
  cohost_user_id: string | null;
  invited_email: string;
  invited_name: string | null;
  invite_token: string;
  invite_message: string | null;
  status: CohostStatus;
  permission_level: CohostPermissionLevel;
  can_manage_listing: boolean;
  can_manage_photos: boolean;
  can_manage_availability: boolean;
  can_manage_pricing: boolean;
  can_manage_messages: boolean;
  can_view_stats: boolean;
  can_manage_cohosts: boolean;
  last_active_at: string | null;
  created_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  removed_at: string | null;
};

export type ListingCohostWithProfile = ListingCohost & {
  profile: Pick<
    Profile,
    | "id"
    | "full_name"
    | "display_name"
    | "email"
    | "phone"
    | "avatar_path"
    | "show_profile_photo_public"
    | "public_slug"
    | "public_profile_enabled"
  > | null;
};

export type ContactNumberVisibility = "private" | "after_inquiry" | "public";

export type ListingContactNumber = {
  id: string;
  listing_id: string;
  user_id: string;
  role: "owner" | "cohost";
  label: string | null;
  phone_number: string;
  visibility: ContactNumberVisibility;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type ListingAuditActorRole = "owner" | "cohost" | "admin" | "system";

export type ListingAuditLog = {
  id: string;
  listing_id: string;
  actor_user_id: string;
  actor_role: ListingAuditActorRole;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PropertyLeadReply = {
  id: string;
  lead_id: string;
  listing_id: string;
  sender_user_id: string;
  sender_role: "owner" | "cohost" | "guest";
  sender_display_name: string;
  body: string;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  role: "user" | "advertiser" | "admin";
  email?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  allow_phone_contact?: boolean | null;
  allow_whatsapp?: boolean | null;
  allow_viber?: boolean | null;
  allow_message?: boolean | null;
  whatsapp_phone?: string | null;
  viber_phone?: string | null;
  whatsapp_use_primary_phone?: boolean | null;
  viber_use_primary_phone?: boolean | null;
  primary_phone_verified_at?: string | null;
  whatsapp_phone_verified_at?: string | null;
  viber_phone_verified_at?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
  show_profile_photo_public?: boolean | null;
  avatar_status?: "active" | "hidden_by_admin" | "removed" | null;
  account_status?: "active" | "suspended" | null;
  last_verification_sent_at?: string | null;
  verification_attempt_count?: number | null;
  display_name?: string | null;
  bio?: string | null;
  advertiser_type?: "individual" | "professional" | null;
  communication_languages?: string[] | null;
  preferred_contact_method?: "message" | "phone" | "email" | null;
  business_name?: string | null;
  business_title?: string | null;
  created_at: string;
  public_slug?: string | null;
  public_profile_enabled?: boolean | null;
  show_owned_listings_on_profile?: boolean | null;
  show_cohosted_listings_on_profile?: boolean | null;
};

export type ListingStatus = "pending" | "approved" | "rejected" | "expired";

export type RentalType = "short_term" | "monthly" | "long_term";
export type PriceType = "per_night" | "per_month";
export type LegalRegistryType = "none" | "ama" | "esl" | "mag";
export type ApprovalStatus =
  | "draft"
  | "pending_review"
  | "needs_changes"
  | "approved"
  | "rejected";
export type VerificationStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "failed"
  | "needs_review"
  | "rejected";

export type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  description_en?: string | null;
  city: string;
  area: string;
  address: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_postal_code?: string | null;
  address_floor?: string | null;
  address_unit?: string | null;
  included_guests?: number | null;
  extra_guest_fee_per_night?: number | null;
  ama_declaration_accepted?: boolean | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  preferred_contact?: string | null;
  allow_phone_contact?: boolean | null;
  allow_whatsapp?: boolean | null;
  allow_viber?: boolean | null;
  allow_message?: boolean | null;
  contact_whatsapp_phone?: string | null;
  contact_viber_phone?: string | null;
  contact_whatsapp_use_primary?: boolean | null;
  contact_viber_use_primary?: boolean | null;
  location_needs_review?: boolean | null;
  city_display_name?: string | null;
  area_display_name?: string | null;
  formatted_address?: string | null;
  provider_place_id?: string | null;
  location_confirmed_at?: string | null;
  location_confirmed_by_owner?: boolean | null;
  location_pin_moved_manually?: boolean | null;
  private_street?: string | null;
  private_street_number?: string | null;
  private_postal_code?: string | null;
  use_profile_contact?: boolean | null;
  location_admin_reviewed_at?: string | null;
  location_admin_status?: string | null;
  latitude: number | null;
  longitude: number | null;
  price_monthly: number;
  price_per_night?: number | null;
  rental_type?: RentalType | null;
  price_type?: PriceType | null;
  ama_number?: string | null;
  legal_registry_type?: LegalRegistryType | null;
  accepts_under_60_days?: boolean | null;
  min_stay_label?: string | null;
  supports_short_term?: boolean | null;
  supports_monthly?: boolean | null;
  minimum_stay_nights?: number | null;
  minimum_stay_months?: number | null;
  weekend_price_per_night?: number | null;
  weekend_days?: number[] | null;
  cleaning_fee_note?: string | null;
  weekly_discount_percent?: number | null;
  monthly_discount_percent?: number | null;
  last_minute_discount_percent?: number | null;
  early_bird_discount_percent?: number | null;
  monthly_includes_bills?: boolean | null;
  monthly_terms?: string | null;
  advertiser_verification_status?: VerificationStatus | null;
  identity_provider?: string | null;
  identity_verified_at?: string | null;
  property_verification_status?: VerificationStatus | null;
  property_verification_method?: string | null;
  external_listing_url?: string | null;
  midora_verification_code?: string | null;
  admin_verification_notes?: string | null;
  owner_responsibility_accepted?: boolean | null;
  platform_role_accepted?: boolean | null;
  terms_privacy_accepted?: boolean | null;
  declarations_submitted_at?: string | null;
  published_at?: string | null;
  approval_status?: ApprovalStatus | null;
  bedrooms: number;
  bathrooms: number | null;
  sqm: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  year_renovated: number | null;
  furnished: boolean;
  has_balcony: boolean;
  has_elevator: boolean;
  heating_type: string | null;
  energy_class: string | null;
  utilities_included: boolean;
  min_months: number;
  availability_status?: ListingAvailabilityStatus | null;
  availability_note?: string | null;
  available_from?: string | null;
  available_until?: string | null;
  property_type: string;
  has_parking: boolean;
  pets_allowed: boolean;
  max_guests: number | null;
  cleaning_included: boolean;
  pets_policy?: PolicyValue | null;
  smoking_policy?: SmokingPolicyValue | null;
  events_policy?: PolicyValue | null;
  quiet_hours_from?: string | null;
  quiet_hours_to?: string | null;
  check_in_from?: string | null;
  check_in_to?: string | null;
  check_out_until?: string | null;
  arrival_method?: ArrivalMethod | null;
  commercial_photo_policy?: PolicyValue | null;
  nearby_metro?: string | null;
  distance_beach?: string | null;
  distance_center?: string | null;
  distance_airport?: string | null;
  distance_port?: string | null;
  status: ListingStatus;
  is_hidden?: boolean;
  expires_at: string | null;
  slug?: string | null;
  search_boost_until?: string | null;
  view_count?: number | null;
  created_at: string;
  updated_at: string;
};

export type PolicyValue = "yes" | "no" | "on_request";
export type SmokingPolicyValue = "yes" | "no" | "outdoor_only";
export type ArrivalMethod = "host" | "self" | "on_request";

export type ListingHighlight = {
  id: string;
  listing_id: string;
  label: string;
  icon_key: string;
  sort_order: number;
  created_at?: string;
};

export type ListingSleepingArrangement = {
  id: string;
  listing_id: string;
  room_name: string;
  bed_type: string;
  quantity: number;
  sort_order: number;
  listing_image_id?: string | null;
  bed_size_note?: string | null;
  created_at?: string;
};

export type ListingAmenityRow = {
  id: string;
  listing_id: string;
  amenity_key: string;
  sort_order: number;
  created_at?: string;
};

export type ListingPriceRule = {
  id: string;
  listing_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  label: string | null;
  price_per_night: number | null;
  included_guests: number | null;
  extra_guest_fee_per_night: number | null;
  min_stay_nights: number | null;
  created_at: string;
  updated_at: string;
};

export type ListingMediaType = "image" | "video";

export type ListingImage = {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
  media_type: ListingMediaType;
  duration_seconds: number | null;
  owner_id?: string | null;
  storage_path?: string | null;
  is_cover?: boolean;
  room_key?: string | null;
  caption?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at?: string;
};

export type ListingWithImages = Listing & {
  listing_images: ListingImage[];
  profiles?: Pick<
    Profile,
    | "id"
    | "full_name"
    | "display_name"
    | "bio"
    | "advertiser_type"
    | "business_name"
    | "business_title"
    | "communication_languages"
    | "phone"
    | "allow_phone_contact"
    | "allow_whatsapp"
    | "allow_viber"
    | "allow_message"
    | "whatsapp_phone"
    | "viber_phone"
    | "whatsapp_use_primary_phone"
    | "viber_use_primary_phone"
    | "primary_phone_verified_at"
    | "avatar_path"
    | "avatar_status"
    | "show_profile_photo_public"
    | "public_slug"
    | "public_profile_enabled"
  > & {
    created_at?: string;
    avatar_url?: string | null;
  };
};

export type ListingPublicDetail = ListingWithImages & {
  highlights: ListingHighlight[];
  sleeping_arrangements: ListingSleepingArrangement[];
  amenities: ListingAmenityRow[];
  price_rules: ListingPriceRule[];
  advertiser_active_listings?: number;
  external_links?: import("@/lib/listing-external-links").ListingExternalLink[];
};

export type ListingSort =
  | "recommended"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "bedrooms_desc"
  | "amenities_desc";

export type LatLng = { lat: number; lng: number };

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type ListingFilters = {
  city?: string;
  area?: string;
  district?: string;
  polygon?: LatLng[];
  bounds?: MapBounds;
  nearby?: { lat: number; lng: number; radiusKm?: number };
  minPrice?: number;
  maxPrice?: number;
  minPriceNight?: number;
  maxPriceNight?: number;
  minMonthly?: number;
  maxMonthly?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  furnished?: boolean;
  utilitiesIncluded?: boolean;
  minMonths?: number;
  duration?: string;
  moveIn?: string;
  propertyType?: string;
  rentalType?: RentalType;
  interestFrom?: string;
  interestTo?: string;
  interestStartMonth?: string;
  interestDurationMonths?: number;
  availableFrom?: string;
  minDurationMonths?: number;
  guests?: number;
  minSqm?: number;
  hasParking?: boolean;
  petsAllowed?: boolean;
  cleaningIncluded?: boolean;
  hasAmaRegistry?: boolean;
  availabilityDeclared?: boolean;
  excludeUnavailableForPeriod?: boolean;
  contactAvailabilityOnly?: boolean;
  hasHeating?: boolean;
  amenityKeys?: string[];
  sort?: ListingSort;
  /** Internal: skip minimum-stay night filter when measuring empty-state cause */
  skipMinimumStayFilter?: boolean;
};

export type SavedSearch = {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, string>;
  email_alerts?: boolean;
  last_notified_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type Favorite = {
  user_id: string;
  listing_id: string;
  created_at: string;
};

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Διαμέρισμα" },
  { value: "house", label: "Σπίτι" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Δωμάτιο" },
  { value: "villa", label: "Βίλα" },
  { value: "other", label: "Άλλο" },
] as const;

export const GREEK_CITIES = [
  "Αθήνα",
  "Θεσσαλονίκη",
  "Πάτρα",
  "Ηράκλειο",
  "Λάρισα",
  "Βόλος",
  "Ιωάννινα",
  "Χανιά",
  "Ρόδος",
  "Κέρκυρα",
  "Καλαμάτα",
  "Καβάλα",
  "Αλεξανδρούπολη",
  "Τρίκala",
  "Λαμία",
  "Κομοτηνή",
  "Μύκονος",
  "Σαντορίνη",
  "Ναύπλιο",
  "Καστοριά",
] as const;
