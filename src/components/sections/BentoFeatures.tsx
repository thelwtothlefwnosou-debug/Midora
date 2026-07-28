"use client";

import { motion } from "framer-motion";
import { Shield, Globe, Clock, CalendarRange, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const FEATURE_ICONS = [Clock, Shield, Globe, CalendarRange] as const;

const BENTO_KEYS = [
  { title: "bento1Title", desc: "bento1Text" },
  { title: "bento2Title", desc: "bento2Text" },
  { title: "bento3Title", desc: "bento3Text" },
  { title: "bento4Title", desc: "bento4Text" },
] as const;

export function BentoFeatures() {
  const t = useTranslations("Home");

  return (
    <section className="bg-sand/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">
            {t("whyTitle")}
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENTO_KEYS.map((feature, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="card-3d rounded-2xl border border-border bg-white p-6 shadow-soft"
              >
                <div className="mb-4 inline-flex rounded-xl border border-border bg-sand/50 p-3">
                  <Icon className="h-5 w-5 text-gold" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-lg font-semibold text-charcoal">
                  {t(feature.title)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(feature.desc)}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          whileHover={{ y: -4 }}
          className="card-3d mt-6 flex flex-col gap-4 rounded-2xl border border-gold/20 bg-gradient-to-r from-white to-sand/30 p-6 shadow-soft sm:flex-row sm:items-center sm:gap-6 sm:p-8"
        >
          <div className="inline-flex shrink-0 rounded-xl border border-gold/20 bg-gold/10 p-3">
            <MessageCircle className="h-6 w-6 text-gold" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-charcoal">
              {t("why3Title")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted sm:text-base">
              {t("why3Text")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
