import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Kakaw AI — Talk to Your Database Like You Talk to a Friend",
  description:
    "Kakaw AI helps non-technical users get insights from their databases in seconds. No SQL knowledge needed.",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
