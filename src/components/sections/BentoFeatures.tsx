"use client";

import { motion } from "framer-motion";
import { Shield, Globe, Clock, CalendarRange, MessageCircle } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Ευέλικτοι τύποι διαμονής",
    desc: "Βραχυχρόνια ή μηνιαία/μεσοπρόθεσμη — ανάλογα με αυτό που ψάχνεις.",
  },
  {
    icon: Shield,
    title: "Ελεγμένες αγγελίες",
    desc: "Οι αγγελίες μπορούν να ελέγχονται πριν δημοσιευτούν για βασικά στοιχεία και ΑΜΑ/ΕΣΛ/ΜΑΓ όπου απαιτείται.",
  },
  {
    icon: Globe,
    title: "Πανελλαδική κάλυψη",
    desc: "Αναζήτησε ακίνητα σε πόλεις, νησιά και δημοφιλείς προορισμούς σε όλη την Ελλάδα.",
  },
  {
    icon: CalendarRange,
    title: "Διαθεσιμότητα ενημερωτικά",
    desc: "Δες δηλωμένες περιόδους και επικοινώνησε με τον αγγελιοδότη για επιβεβαίωση.",
  },
];

export function BentoFeatures() {
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
            Γιατί Midora;
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
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
                <feature.icon className="h-5 w-5 text-gold" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-lg font-semibold text-charcoal">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.desc}</p>
            </motion.div>
          ))}
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
              Απευθείας επικοινωνία
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted sm:text-base">
              Στείλε ενδιαφέρον και συνεννοήσου απευθείας με τον αγγελιοδότη — χωρίς
              περιττά βήματα.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
