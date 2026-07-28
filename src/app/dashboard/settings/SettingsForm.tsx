"use client";

import Link from "next/link";
import { Bell, KeyRound, ShieldCheck, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  DashboardSettingsTabs,
  type SettingsTabId,
} from "@/components/dashboard/DashboardSettingsTabs";

type SettingsFormProps = {
  fullName: string;
  phone: string;
  email: string;
  activeTab: SettingsTabId;
};

export function SettingsForm({ fullName, phone, email, activeTab }: SettingsFormProps) {
  const t = useTranslations("Owner.settings");
  return (
    <DashboardSettingsTabs active={activeTab}>
      {activeTab === "contact" && (
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand">
              <Phone className="h-5 w-5 text-charcoal/70" />
            </div>
            <div>
              <h2 className="font-semibold text-charcoal">{t("contact.title")}</h2>
              <p className="text-sm text-muted">{t("contact.subtitle")}</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            {t("contact.primaryPhoneLabel")}{" "}
            <span className="font-medium text-charcoal">{phone || "—"}</span>
          </p>
          <p className="mt-3 text-sm text-muted">{t("contact.manageHint")}</p>
          <Button href="/dashboard/settings/contact" className="mt-5" variant="outline">
            {t("contact.openContactSettings")}
          </Button>
        </GlassCard>
      )}

      {activeTab === "privacy" && (
        <div className="space-y-6">
          <GlassCard className="p-6 sm:p-8">
            <h2 className="font-semibold text-charcoal">{t("privacy.title")}</h2>
            <p className="mt-2 text-sm text-muted">{t("privacy.subtitle")}</p>
            <div className="mt-5 space-y-3 text-sm">
              <label className="flex items-start gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
                <input type="checkbox" disabled className="mt-0.5 accent-gold opacity-60" />
                <span>
                  <span className="font-medium text-charcoal">
                    {t("privacy.showProfilePhoto")}
                  </span>
                  <span className="mt-0.5 block text-muted">
                    {t("privacy.showProfilePhotoHint")}{" "}
                    <Link href="/dashboard/profile" className="text-gold hover:underline">
                      {t("privacy.myProfileLink")}
                    </Link>
                    .
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
                <input type="checkbox" checked disabled className="mt-0.5 accent-gold" />
                <span>
                  <span className="font-medium text-charcoal">
                    {t("privacy.contactAfterInterest")}
                  </span>
                  <span className="mt-0.5 block text-muted">
                    {t("privacy.contactAfterInterestHint")}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
                <input type="checkbox" disabled className="mt-0.5 accent-gold opacity-60" />
                <span className="text-muted">{t("privacy.marketingEmails")}</span>
              </label>
            </div>
          </GlassCard>

          <GlassCard className="border-teal/20 bg-teal/5 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
              <div className="text-sm text-charcoal/80">
                <p className="font-medium text-charcoal">{t("privacy.protectionTitle")}</p>
                <p className="mt-1 text-muted">{t("privacy.protectionDesc")}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === "security" && (
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand">
              <KeyRound className="h-5 w-5 text-charcoal/70" />
            </div>
            <div>
              <h2 className="font-semibold text-charcoal">{t("security.title")}</h2>
              <p className="text-sm text-muted">{t("security.subtitle")}</p>
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-border bg-sand/30 px-4 py-3">
              <p className="text-xs text-muted uppercase">{t("security.loginEmail")}</p>
              <p className="mt-1 font-medium text-charcoal">{email}</p>
            </div>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center gap-2 font-medium text-gold hover:underline"
            >
              {t("security.changePassword")}
            </Link>
            <p className="text-xs text-muted">{t("security.sessionsHint")}</p>
          </div>
        </GlassCard>
      )}

      {activeTab === "notifications" && (
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
              <Bell className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-semibold text-charcoal">{t("notificationsSection.title")}</h2>
              <p className="text-sm text-muted">{t("notificationsSection.subtitle")}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-muted">
            <label className="flex items-center gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
              <input type="checkbox" disabled className="accent-gold opacity-60" />
              <span>{t("notificationsSection.newInterest")}</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
              <input type="checkbox" disabled className="accent-gold opacity-60" />
              <span>{t("notificationsSection.newMessages")}</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
              <input type="checkbox" disabled className="accent-gold opacity-60" />
              <span>{t("notificationsSection.listingApproval")}</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3">
              <input type="checkbox" disabled className="accent-gold opacity-60" />
              <span>{t("notificationsSection.weeklySummary")}</span>
            </label>
            <p className="text-xs text-muted/80">{t("notificationsSection.comingSoon")}</p>
          </div>
        </GlassCard>
      )}
    </DashboardSettingsTabs>
  );
}
