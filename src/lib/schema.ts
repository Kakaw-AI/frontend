import { SITE_NAME, SITE_URL } from "./site";

const DESCRIPTION =
  "Kakaw AI lets non-technical teams query any database using plain English. No SQL needed — connect your database, ask questions, get answers instantly.";

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
