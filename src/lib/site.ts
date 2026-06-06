/**
 * Single source of truth for the site's public origin and brand name.
 *
 * Everything SEO-facing (metadataBase, canonical URLs, sitemap, robots,
 * Open Graph, JSON-LD, llms.txt) derives from SITE_URL so the deployment
 * domain can never drift across files again. Override per environment with
 * NEXT_PUBLIC_SITE_URL (e.g. a preview deployment); the fallback is the
 * production domain.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kakaw.gitnasr.com";

export const SITE_NAME = "Kakaw AI";

/** Contact address surfaced in legal pages and structured data. */
export const CONTACT_EMAIL = "dev@gitnasr.com";
