import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  ClipboardCheck,
  GraduationCap,
  Headphones,
  Briefcase,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Users,
  PawPrint,
  Home,
  CalendarDays,
  Building2,
} from "lucide-react";
import type { RentalType } from "@/lib/rental-types";

export type HomeTrustItem = {
  icon: LucideIcon;
};

export const HOME_TRUST_STRIP: HomeTrustItem[] = [
  { icon: ClipboardCheck },
  { icon: MessageCircle },
  { icon: BadgeCheck },
  { icon: ShieldCheck },
];

export type HomeFeatureCard = {
  icon: LucideIcon;
};

export const HOME_SUPPORT_TRUST: HomeFeatureCard[] = [
  { icon: ShieldCheck },
  { icon: Headphones },
  { icon: ClipboardCheck },
];

/** @deprecated Use HOME_SUPPORT_TRUST */
export const HOME_COMPACT_TRUST = HOME_SUPPORT_TRUST;

export type HomeStayNeed = {
  stay: string;
  rentalType?: RentalType;
  /** Extra search query params (e.g. pets=true) */
  query?: Record<string, string>;
  image: string;
  icon: LucideIcon;
};

export const HOME_STAY_NEEDS: HomeStayNeed[] = [
  {
    icon: CalendarDays,
    stay: "short_days",
    rentalType: "short_term",
    image: "/images/home/sections/need-short.webp",
  },
  {
    icon: Building2,
    stay: "monthly_stay",
    rentalType: "monthly",
    image: "/images/home/sections/need-monthly.webp",
  },
  {
    icon: Briefcase,
    stay: "business",
    rentalType: "short_term",
    image: "/images/home/sections/need-work.webp",
  },
  {
    icon: GraduationCap,
    stay: "students",
    rentalType: "monthly",
    image: "/images/home/sections/need-students.webp",
  },
  {
    icon: Users,
    stay: "families",
    image: "/images/home/sections/need-family.webp",
  },
  {
    icon: PawPrint,
    stay: "pets",
    query: { pets: "true" },
    image: "/images/home/sections/need-pets.webp",
  },
];

export const HOME_WHY_MIDORA: HomeFeatureCard[] = [
  { icon: Home },
  { icon: ClipboardCheck },
  { icon: MessageCircle },
];

export type HomeStep = {
  icon: LucideIcon;
};

export const HOME_HOW_IT_WORKS: HomeStep[] = [
  { icon: Search },
  { icon: MessageCircle },
  { icon: Phone },
];

export type OwnerRentalCard = {
  rentalType: RentalType;
};

export const HOME_OWNER_RENTAL_CARDS: OwnerRentalCard[] = [
  { rentalType: "short_term" },
  { rentalType: "monthly" },
];

export type RentalTypeSearchTab = {
  value: RentalType;
};

export const RENTAL_TYPE_SEARCH_TABS: RentalTypeSearchTab[] = [
  { value: "short_term" },
  { value: "monthly" },
];

/** Editorial panel for “How Midora works”. */
export const HOME_HOW_EDITORIAL_IMAGE = "/images/home/sections/how-editorial-3200.webp";

/** Owner acquisition split visual. */
export const HOME_OWNER_SPLIT_IMAGE = "/images/home/sections/owner-split.webp";

/** Final CTA band background. */
export const HOME_FINAL_CTA_IMAGE = "/images/home/sections/final-cta.webp";

/** Owner listing flow — middleware redirects unauthenticated users to login. */
export { OWNER_LISTING_NEW_PATH as HOME_OWNER_LISTING_HREF } from "@/lib/owner-flow";
