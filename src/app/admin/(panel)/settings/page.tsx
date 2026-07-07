import { getAdminSettings } from "@/lib/admin/queries";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const planLimits = map.max_listings_per_plan as { free?: number; premium?: number } | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Ρυθμίσεις</h1>
        <p className="mt-1 text-sm text-muted">Ρυθμίσεις πλατφόρμας Midora</p>
      </div>

      <AdminSettingsForm
        initial={{
          support_email: (map.support_email as { email?: string })?.email ?? "",
          maintenance_banner: Boolean((map.maintenance_banner as { enabled?: boolean })?.enabled),
          featured_cities: (map.featured_cities as { cities?: string[] })?.cities?.join(", ") ?? "",
          homepage_popular_chips:
            (map.homepage_popular_chips as { chips?: string[] })?.chips?.join(", ") ?? "",
          max_listings_free: String(planLimits?.free ?? 1),
          max_listings_premium: String(planLimits?.premium ?? 5),
        }}
      />
    </div>
  );
}
