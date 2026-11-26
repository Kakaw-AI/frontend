import { SITE_DESCRIPTION as DESCRIPTION } from "./seo";
import { SITE_NAME, SITE_URL } from "./site";

/** Organization + WebSite, rendered site-wide in the root layout. */
export function siteGraph(): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/apple-touch-icon.png`,
      description: DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  ];
}

/** SoftwareApplication for the homepage. */
export function softwareApplicationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/** The product film embedded on the homepage. */
export function videoObjectSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Kakaw AI in 35 seconds",
    description:
      "Connect a database, ask a question in plain English, see the read-only query Kakaw writes, and get the answer as a table and a bar chart.",
    thumbnailUrl: `${SITE_URL}/video/kakaw-demo-poster.jpg`,
    contentUrl: `${SITE_URL}/video/kakaw-demo.mp4`,
    uploadDate: "2026-11-24",
    duration: "PT35S",
  };
}

/** TechArticle for a documentation page. `path` is root-relative (e.g. /docs/getting-started). */
export function techArticleSchema(args: {
  title: string;
  description: string;
  path: string;
}): Record<string, unknown> {
  const url = `${SITE_URL}${args.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: args.title,
    description: args.description,
    url,
    mainEntityOfPage: url,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/** BreadcrumbList from an ordered list of crumbs. Each `path` is root-relative. */
export function breadcrumbSchema(
  crumbs: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}
