import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteGraph } from "@/lib/schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Neither Latin face has Arabic letters. Next's metric-matched fallback (Arial)
// sits right behind each one and would draw Arabic in Arial's thin, serif-like
// Naskh, so it is turned off and IBM Plex Sans Arabic comes next instead.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-display",
  adjustFontFallback: false,
});
const body = Figtree({ subsets: ["latin"], variable: "--font-body-src", adjustFontFallback: false });
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-arabic",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono-src",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kakaw AI — Talk to Your Database Like You Talk to a Friend",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Kakaw AI helps non-technical users get insights from their databases in seconds. No SQL knowledge needed.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Kakaw AI — Talk to Your Database Like You Talk to a Friend",
    description:
      "Kakaw AI helps non-technical users get insights from their databases in seconds. No SQL knowledge needed.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Kakaw AI — Talk to Your Database Like You Talk to a Friend",
    description:
      "Kakaw AI helps non-technical users get insights from their databases in seconds. No SQL knowledge needed.",
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Kakaw AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`light h-full antialiased ${display.variable} ${body.variable} ${mono.variable} ${arabic.variable}`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <JsonLd data={siteGraph()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
