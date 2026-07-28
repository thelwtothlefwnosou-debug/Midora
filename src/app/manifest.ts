import type { MetadataRoute } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("Site");
  const locale = await getLocale();

  return {
    name: t("manifestName"),
    short_name: "Midora",
    description: t("manifestDescription"),
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b8956f",
    lang: locale,
    icons: [
      {
        src: "/brand/midora-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
