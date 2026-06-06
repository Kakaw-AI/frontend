import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteGraph } from "@/lib/schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";

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
      className="light h-full antialiased"
      style={
        {
          "--font-inter":
            'Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
          "--font-newsreader":
            '"Newsreader", "Iowan Old Style", "Palatino Linotype", Georgia, serif',
        } as CSSProperties
      }
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <JsonLd data={siteGraph()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
