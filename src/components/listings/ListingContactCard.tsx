"use client";

import { useState } from "react";
import { Copy, Mail, MessageSquare, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import type { ListingPublicContact } from "@/lib/listing-contact";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.4 0C9.473.028 5.333.344 2.886 2.8.441 5.254.034 9.117 0 11.4c-.033 2.016.503 4.79 2.88 5.904l-.03 2.837s-.046.96.598 1.152c.762.234 1.206-.49 1.94-1.266.398-.42.948-1.03 1.36-1.5 3.75.313 6.64-.402 6.96-.5.76-.25 5.072-.8 5.77-6.564.734-6.03-.39-9.84-2.55-11.52C17.4.72 14.093.01 11.4 0zm.12 1.89h.06c2.42.02 5.42.65 7.35 2.35 1.82 1.6 2.75 4.97 2.08 10.45-.58 4.78-4.12 5.22-4.82 5.45-.27.09-2.82.72-6.06.47-.01.01-2.4 2.89-3.15 3.64-.12.12-.25.18-.38.18-.3 0-.3-.47-.3-.47l.03-2.5C2.72 19.66 1.97 17.3 2 11.47 2.03 9.4 2.4 5.9 4.55 3.74 6.7 1.58 10.4 1.9 11.52 1.89z" />
    </svg>
  );
}

const contactButtonClass =
  "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-charcoal transition-colors hover:border-gold/30";

type Props = {
  contact: ListingPublicContact;
  className?: string;
  /** When true, no top border — used as the main contact block in listing sidebar. */
  primary?: boolean;
};

export function ListingContactCard({ contact, className, primary = false }: Props) {
  const { openInterest } = useListingInterest();
  const tCommon = useTranslations("Common");
  const tInquiry = useTranslations("Listing.inquiry");
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [viberCopyHint, setViberCopyHint] = useState(false);

  const hasAnyMethod =
    contact.allowMessage ||
    (contact.allowPhone && contact.phone) ||
    Boolean(contact.email) ||
    (contact.allowWhatsApp && contact.whatsappUrl) ||
    (contact.allowViber && contact.viberPhone);

  if (!hasAnyMethod) return null;

  const mailSubject = encodeURIComponent(
    tInquiry("mailSubject", { title: contact.listingTitle })
  );
  const mailBody = encodeURIComponent(tInquiry("mailBody"));

  async function handleViberClick() {
    if (!contact.viberUrl || !contact.viberPhone) return;
    window.location.href = contact.viberUrl;
    window.setTimeout(() => {
      setViberCopyHint(true);
    }, 1200);
  }

  async function copyViberNumber() {
    if (!contact.viberPhone) return;
    try {
      await navigator.clipboard.writeText(contact.viberPhone);
      setViberCopyHint(true);
    } catch {
      setViberCopyHint(true);
    }
  }

  return (
    <div
      className={cn(
        primary ? "space-y-2" : "mt-5 space-y-2 border-t border-border pt-4",
        className
      )}
    >
      {contact.allowPhone && contact.phone ? (
        phoneRevealed ? (
          <div className="space-y-2">
            <p className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-charcoal">
              {contact.phone}
            </p>
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-white hover:bg-gold-dark"
            >
              <Phone className="h-4 w-4" />
              {tCommon("callNow")}
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPhoneRevealed(true)}
            className={cn(contactButtonClass, "border-gold/25 bg-gold/5 hover:border-gold/40")}
          >
            <Phone className="h-4 w-4 text-gold" />
            {tCommon("showPhone")}
          </button>
        )
      ) : null}

      {contact.allowWhatsApp && contact.whatsappUrl ? (
        <a
          href={contact.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            contactButtonClass,
            "hover:border-[#25D366]/40 hover:bg-[#25D366]/5"
          )}
        >
          <WhatsAppIcon className="h-4 w-4 text-[#128C7E]" />
          {tCommon("whatsApp")}
        </a>
      ) : null}

      {contact.allowViber && contact.viberPhone ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleViberClick}
            className={cn(
              contactButtonClass,
              "hover:border-[#7360f2]/35 hover:bg-[#7360f2]/5"
            )}
          >
            <ViberIcon className="h-4 w-4 text-[#7360f2]" />
            Viber
          </button>
          {viberCopyHint ? (
            <button
              type="button"
              onClick={copyViberNumber}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 text-xs font-medium text-muted hover:border-gold/30 hover:text-charcoal"
            >
              <Copy className="h-3.5 w-3.5" />
              {tCommon("copyViberNumber")}
            </button>
          ) : null}
        </div>
      ) : null}

      {contact.allowMessage ? (
        <button type="button" onClick={() => openInterest()} className={contactButtonClass}>
          <MessageSquare className="h-4 w-4 text-gold/80" />
          {tCommon("sendMessageViaMidora")}
        </button>
      ) : null}

      {contact.email ? (
        <a
          href={`mailto:${contact.email}?subject=${mailSubject}&body=${mailBody}`}
          className={contactButtonClass}
        >
          <Mail className="h-4 w-4 text-gold/80" />
          {tCommon("sendEmail")}
        </a>
      ) : null}
    </div>
  );
}
