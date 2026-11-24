import type { MetadataRoute } from "next";
import { SITE_URL as BASE_URL } from "@/lib/site";
import { source } from "@/lib/source";
import { LANDING_PATHS } from "@/components/landing/pages";

// No lastModified, changeFrequency or priority: a build date on every URL is
// a false "changed" signal, and search engines ignore the other two. Sign-in
// is left out on purpose; it is reachable but has nothing to rank for.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", ...LANDING_PATHS, ...source.getPages().map((page) => page.url), "/privacy", "/terms"];
  return paths.map((path) => ({ url: path === "/" ? BASE_URL : `${BASE_URL}${path}` }));
}
