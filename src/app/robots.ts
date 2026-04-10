import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/docs", "/privacy", "/terms"],
        disallow: ["/dashboard", "/chat", "/onboarding", "/api/"],
      },
    ],
    sitemap: "https://kakaw.ai/sitemap.xml",
  };
}
