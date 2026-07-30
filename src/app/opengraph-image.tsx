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

export default async function Image() {
  // mascot-og.png is a 440px downscale of mascot.png. The full-size original is
  // 2.9 MB, which base64-encodes to a ~3.9 MB string on every OG render; this
  // renders at 220x220 so the 2x variant is all it can use.
  const [fontData, mascotData] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/Newsreader-Italic.ttf")),
    readFile(join(process.cwd(), "public/mascot-og.png"), "base64"),
  ]).catch((err: Error) => {
    throw new Error(`OG image asset missing: ${err.message}`);
  });

  const mascotSrc = `data:image/png;base64,${mascotData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #705731 0%, #291800 100%)",
          alignItems: "center",
          padding: "0 80px",
        }}
      >
        {/* ── Left panel ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 60,
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              fontFamily: "sans-serif",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#e3c193",
              marginBottom: 20,
            }}
          >
            KAKAW AI
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              fontFamily: "Newsreader",
              fontSize: 72,
              fontStyle: "italic",
              fontWeight: 400,
              color: "#fffaf8",
              lineHeight: 1.15,
              marginBottom: 24,
            }}
          >
            Talk to your database like a friend.
          </div>

          {/* Body copy */}
          <div
            style={{
              display: "flex",
              fontFamily: "sans-serif",
              fontSize: 22,
              color: "rgba(255, 250, 248, 0.65)",
              lineHeight: 1.5,
              marginBottom: 40,
            }}
          >
            No SQL needed. Ask in plain English, get answers in seconds.
          </div>

          {/* Wordmark row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 40,
                height: 2,
                background: "#e3c193",
                borderRadius: 1,
              }}
            />
            <div
              style={{
                display: "flex",
                fontFamily: "Newsreader",
                fontStyle: "italic",
                fontSize: 26,
                fontWeight: 400,
                color: "#e3c193",
              }}
            >
              kakaw.gitnasr.com
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div
          style={{
            width: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Orbit bubble 1 */}
          <div
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(227, 193, 147, 0.10)",
              top: -30,
              right: -30,
            }}
          />
          {/* Orbit bubble 2 */}
          <div
            style={{
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(227, 193, 147, 0.07)",
              bottom: -20,
              left: -20,
            }}
          />

          {/* Mascot circle */}
          <div
            style={{
              display: "flex",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={mascotSrc}
              width={220}
              height={220}
              style={{ objectFit: "contain" }}
            />
          </div>

          {/* Pill badge */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: 20,
              right: -10,
              background: "rgba(255, 255, 255, 0.10)",
              border: "1px solid rgba(255, 255, 255, 0.20)",
              borderRadius: 999,
              padding: "8px 18px",
              fontFamily: "sans-serif",
              fontSize: 14,
              color: "rgba(255, 250, 248, 0.85)",
            }}
          >
            No SQL required
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Newsreader",
          data: fontData,
          style: "italic",
          weight: 400,
        },
      ],
    }
  );
}
