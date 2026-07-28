"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

function AnimatedCounter({
  value,
  suffix = "",
  locale,
}: {
  value: number;
  suffix?: string;
  locale: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  const numberLocale = locale.startsWith("el") ? "el-GR" : "en-US";

  return (
    <span ref={ref}>
      {count.toLocaleString(numberLocale)}
      {suffix}
    </span>
  );
}

const STAT_CONFIG = [
  { suffix: "+", label: "stats1Label" },
  { suffix: "+", label: "stats2Label" },
  { suffixKey: "stats3Suffix" as const, label: "stats3Label" },
  { suffix: "%", label: "stats4Label" },
] as const;

const DEFAULT_STAT_VALUES = [65, 35, 1, 100] as const;

export function Stats({ listingCount = 65 }: { listingCount?: number }) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const values = [listingCount, ...DEFAULT_STAT_VALUES.slice(1)];

  return (
    <section className="relative border-y border-border py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 lg:grid-cols-4">
        {STAT_CONFIG.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <p className="font-display text-4xl font-bold text-gold sm:text-5xl">
              <AnimatedCounter
                value={values[i]}
                suffix={"suffixKey" in stat ? t(stat.suffixKey) : stat.suffix}
                locale={locale}
              />
            </p>
            <p className="mt-2 text-sm text-muted">{t(stat.label)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
