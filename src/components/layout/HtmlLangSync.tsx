"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

/** Keeps <html lang> in sync after client locale switches. */
export function HtmlLangSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
