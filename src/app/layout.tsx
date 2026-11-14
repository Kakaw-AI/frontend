import type { Metadata } from "next";
import { DM_Sans, Gabarito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteGraph } from "@/lib/schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

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
      className={`light h-full antialiased ${gabarito.variable} ${dmSans.variable}`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <JsonLd data={siteGraph()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
