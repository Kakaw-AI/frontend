// src/app/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Kakaw AI — Talk to Your Database Like You Talk to a Friend";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Kakaw brand: cream, cocoa and pod gold.
const PAPER = "#f6eee2";
const INK = "#2a1810";
const POD = "#e8a317";

export default async function Image() {
  const fontData = await readFile(
    join(process.cwd(), "public/fonts/BricolageGrotesque-ExtraBold.woff"),
  ).catch((err: Error) => {
    throw new Error(`OG image asset missing: ${err.message}`);
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: 72,
          fontFamily: "Bricolage Grotesque",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            fontSize: 44,
            letterSpacing: "-0.03em",
          }}
        >
          Kakaw
          <svg width="21" height="28" viewBox="0 0 24 32" style={{ marginLeft: 5, marginBottom: 2 }}>
            <path d="M12 0C20 5 20 27 12 32C4 27 4 5 12 0Z" fill={POD} />
            <path d="M12 0V32" stroke={PAPER} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            fontSize: 104,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          <div style={{ display: "flex" }}>Ask your database.</div>
          <div
            style={{
              display: "flex",
              background: POD,
              color: INK,
              borderRadius: 12,
              padding: "0 20px 8px",
              marginTop: 12,
            }}
          >
            Get the answer.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 30 }}>kakaw.nasr.work</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage Grotesque", data: fontData, style: "normal", weight: 800 },
      ],
    },
  );
}
