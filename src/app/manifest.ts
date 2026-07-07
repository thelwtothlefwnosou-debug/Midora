import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Midora — Αγγελίες ακινήτων",
    short_name: "Midora",
    description:
      "Αναζήτηση και δημοσίευση αγγελιών για βραχυχρόνια και μηνιαία μίσθωση στην Ελλάδα.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b8956f",
    lang: "el",
    icons: [
      {
        src: "/brand/midora-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
