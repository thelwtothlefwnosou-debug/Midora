"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

type DeclarationItem = {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: React.ReactNode;
};

function DeclarationCheckbox({
  checked,
  onChange,
  label,
  description,
}: Omit<DeclarationItem, "id">) {
  return (
    <label className="flex gap-3 rounded-xl border border-border bg-sand/20 p-4 text-sm leading-relaxed">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-gold"
      />
      <span>
        <span className="block font-semibold text-charcoal">{label}</span>
        <span className="mt-2 block text-muted">{description}</span>
      </span>
    </label>
  );
}

const legalLinkClass = "font-medium text-gold-dark hover:underline";

type Props = {
  needsRegistryDeclaration: boolean;
  showMonthlyTaxHelper?: boolean;
  ownerAccepted: boolean;
  registryAccepted: boolean;
  platformAccepted: boolean;
  taxAccepted: boolean;
  authorityAccepted: boolean;
  termsAccepted: boolean;
  onOwnerChange: (v: boolean) => void;
  onRegistryChange: (v: boolean) => void;
  onPlatformChange: (v: boolean) => void;
  onTaxChange: (v: boolean) => void;
  onAuthorityChange: (v: boolean) => void;
  onTermsChange: (v: boolean) => void;
  allRequiredChecked: boolean;
};

export function ListingWizardDeclarationsStep({
  needsRegistryDeclaration,
  showMonthlyTaxHelper = false,
  ownerAccepted,
  registryAccepted,
  platformAccepted,
  taxAccepted,
  authorityAccepted,
  termsAccepted,
  onOwnerChange,
  onRegistryChange,
  onPlatformChange,
  onTaxChange,
  onAuthorityChange,
  onTermsChange,
  allRequiredChecked,
}: Props) {
  const t = useTranslations("Wizard.declarations");
  const tDecl = useTranslations("Legal.declarations");
  const tTerms = useTranslations("Legal.terms");
  const tPrivacy = useTranslations("Legal.privacy");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          {tDecl("title")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {tDecl("subtitle")}
        </p>
      </div>

      <div className="space-y-3">
        <DeclarationCheckbox
          checked={ownerAccepted}
          onChange={onOwnerChange}
          label={tDecl("rightsTitle")}
          description={tDecl("rightsText")}
        />

        {needsRegistryDeclaration ? (
          <DeclarationCheckbox
            checked={registryAccepted}
            onChange={onRegistryChange}
            label={tDecl("registryTitle")}
            description={tDecl("registryText")}
          />
        ) : null}

        {showMonthlyTaxHelper ? (
          <p className="rounded-xl border border-border/80 bg-white px-4 py-3 text-xs leading-relaxed text-muted">
            {tDecl("monthlyHelper")}
          </p>
        ) : null}

        <DeclarationCheckbox
          checked={platformAccepted}
          onChange={onPlatformChange}
          label={tDecl("platformTitle")}
          description={tDecl("platformText")}
        />

        <DeclarationCheckbox
          checked={taxAccepted}
          onChange={onTaxChange}
          label={tDecl("taxTitle")}
          description={tDecl("taxText")}
        />

        <DeclarationCheckbox
          checked={authorityAccepted}
          onChange={onAuthorityChange}
          label={tDecl("authorityTitle")}
          description={tDecl("authorityText")}
        />

        <DeclarationCheckbox
          checked={termsAccepted}
          onChange={onTermsChange}
          label={tDecl("termsTitle")}
          description={
            <>
              {t("termsPrefix")}{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                {tTerms("title")}
              </Link>
              {t("termsMid")}
              <Link
                href="/listing-rules"
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                {tTerms("listingsRulesLink")}
              </Link>
              {t("termsAnd")}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                {tPrivacy("title")}
              </Link>{" "}
              {t("termsSuffix")}
            </>
          }
        />
      </div>

      <p className={allRequiredChecked ? "text-sm text-teal" : "text-sm text-muted"}>
        {allRequiredChecked ? t("ready") : t("needAll")}
      </p>
    </div>
  );
}

export function areWizardDeclarationsComplete(input: {
  needsRegistryDeclaration: boolean;
  ownerAccepted: boolean;
  registryAccepted: boolean;
  platformAccepted: boolean;
  taxAccepted: boolean;
  authorityAccepted: boolean;
  termsAccepted: boolean;
}): boolean {
  return (
    input.ownerAccepted &&
    input.platformAccepted &&
    input.taxAccepted &&
    input.authorityAccepted &&
    input.termsAccepted &&
    (!input.needsRegistryDeclaration || input.registryAccepted)
  );
}
