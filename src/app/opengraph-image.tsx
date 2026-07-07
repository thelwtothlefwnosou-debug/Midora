import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Midora — Αγγελίες ακινήτων στην Ελλάδα";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public/brand/midora-logo.png")
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #f7f0e6 0%, #ffffff 55%, #efe6d8 100%)",
          color: "#1a1a1a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={88} height={88} alt="" />
          <div style={{ fontSize: 42, fontWeight: 700, color: "#1a1a1a" }}>Midora</div>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
            fontFamily: "Georgia, serif",
          }}
        >
          Αγγελίες ακινήτων στην Ελλάδα
        </div>
        <div style={{ fontSize: 30, marginTop: 24, color: "#5c5c5c", maxWidth: 820 }}>
          Βραχυχρόνια & μηνιαία μίσθωση — αναζήτηση με χάρτη και φίλτρα
        </div>
      </div>
    ),
    size
  );
}
