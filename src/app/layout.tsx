import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bricolage_Grotesque, Figtree, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ConfirmDialogHost } from "@/components/ui/confirm-dialog";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteGraph } from "@/lib/schema";
import { SITE_DESCRIPTION } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Arabic is drawn by the "Kakaw Arabic" face in globals.css, first in every
// font stack and limited to Arabic code points.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-display",
});
const body = Figtree({ subsets: ["latin"], variable: "--font-body-src" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono-src",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // Pages set their own share title and URL through pageMetadata(); this is
  // only the fallback for routes that don't (the signed-in app).
  openGraph: { type: "website", siteName: SITE_NAME },
  twitter: { card: "summary_large_image" },
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
      className={`light h-full antialiased ${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <JsonLd data={siteGraph()} />
        <Providers>{children}</Providers>
        <ConfirmDialogHost />
        {/* Field Core Web Vitals (LCP, INP, CLS) from real visits. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
