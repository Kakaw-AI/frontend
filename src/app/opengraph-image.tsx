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

const PLUM = "#2a1039";
const YELLOW = "#ffd23f";
const PINK = "#e0356b";

export default async function Image() {
  const fontData = await readFile(
    join(process.cwd(), "public/fonts/Gabarito-ExtraBold.ttf"),
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
          background: "#fbf6ea",
          color: PLUM,
          padding: 72,
          fontFamily: "Gabarito",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 44 }}>
          Kakaw
          <div
            style={{
              display: "flex",
              width: 18,
              height: 18,
              borderRadius: 9,
              background: PINK,
              marginLeft: 6,
              marginTop: 14,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            fontSize: 104,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          <div style={{ display: "flex" }}>Ask your database.</div>
          <div
            style={{
              display: "flex",
              background: YELLOW,
              border: `4px solid ${PLUM}`,
              borderRadius: 24,
              padding: "0 20px 8px",
              marginTop: 12,
              boxShadow: `8px 8px 0 ${PLUM}`,
            }}
          >
            Get the answer.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 30 }}>kakaw.gitnasr.com</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Gabarito", data: fontData, style: "normal", weight: 800 }],
    },
  );
}
