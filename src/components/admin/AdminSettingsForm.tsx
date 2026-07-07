"use client";

import { useState, useTransition } from "react";
import { adminSaveSetting } from "@/lib/admin/actions";

type Props = {
  initial: {
    support_email: string;
    maintenance_banner: boolean;
    featured_cities: string;
    homepage_popular_chips: string;
    max_listings_free: string;
    max_listings_premium: string;
  };
};

export function AdminSettingsForm({ initial }: Props) {
  const [supportEmail, setSupportEmail] = useState(initial.support_email);
  const [maintenance, setMaintenance] = useState(initial.maintenance_banner);
  const [cities, setCities] = useState(initial.featured_cities);
  const [chips, setChips] = useState(initial.homepage_popular_chips);
  const [maxFree, setMaxFree] = useState(initial.max_listings_free);
  const [maxPremium, setMaxPremium] = useState(initial.max_listings_premium);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      await adminSaveSetting("support_email", { email: supportEmail.trim() });
      await adminSaveSetting("maintenance_banner", { enabled: maintenance });
      await adminSaveSetting("featured_cities", {
        cities: cities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      });
      await adminSaveSetting("homepage_popular_chips", {
        chips: chips
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      });
      await adminSaveSetting("max_listings_per_plan", {
        free: parseInt(maxFree, 10) || 1,
        premium: parseInt(maxPremium, 10) || 5,
      });
      setMessage("Οι ρυθμίσεις αποθηκεύτηκαν.");
    });
  }

  return (
    <div className="max-w-xl space-y-6 rounded-xl border border-border bg-white p-6">
      <label className="block text-sm">
        <span className="font-medium text-charcoal">Email υποστήριξης</span>
        <input
          type="email"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-charcoal">Featured cities (χωρισμένες με κόμμα)</span>
        <input
          type="text"
          value={cities}
          onChange={(e) => setCities(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Αθήνα, Θεσσαλονίκη, Χανιά"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-charcoal">Homepage popular chips (κόμμα)</span>
        <input
          type="text"
          value={chips}
          onChange={(e) => setChips(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Βραχυχρόνια, Μηνιαία, Μακροχρόνια"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-charcoal">Max αγγελίες (δωρεάν πακέτο)</span>
          <input
            type="number"
            min={0}
            value={maxFree}
            onChange={(e) => setMaxFree(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-charcoal">Max αγγελίες (πακέτο προβολής)</span>
          <input
            type="number"
            min={0}
            value={maxPremium}
            onChange={(e) => setMaxPremium(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={maintenance}
          onChange={(e) => setMaintenance(e.target.checked)}
        />
        <span className="font-medium text-charcoal">Maintenance banner ενεργό</span>
      </label>

      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Αποθήκευση
      </button>

      {message && <p className="text-sm text-teal">{message}</p>}
    </div>
  );
}
