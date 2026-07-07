import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/listings", "/rentals/", "/owners", "/about", "/help", "/faq"],
        disallow: [
          "/dashboard",
          "/admin",
          "/api/",
          "/auth/",
          "/checkout",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
