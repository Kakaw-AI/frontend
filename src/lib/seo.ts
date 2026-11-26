import type { Metadata } from "next";
import { SITE_NAME } from "./site";

/** The product in one sentence: used for the homepage, structured data and pages without their own. */
export const SITE_DESCRIPTION =
  "Ask your PostgreSQL, MongoDB or SQLite database questions in plain English. Kakaw writes a read-only query, runs it and answers with text, a table and a chart. Free, with your own AI model.";

// app/opengraph-image.tsx. A page that sets openGraph loses the file-based
// image of the root segment, so it is named here explicitly.
const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Kakaw AI: Ask your database. Get the answer." };

/**
 * Title, description, canonical and share tags for one public page.
 *
 * Next.js merges metadata shallowly, so a page that sets no `openGraph` would
 * share the root layout's title and URL. Every public page goes through here.
 */
export function pageMetadata(args: {
  title: string;
  description: string;
  path: string;
  /** Use the title as written, without the "| Kakaw AI" template. */
  absoluteTitle?: boolean;
}): Metadata {
  const shareTitle = args.absoluteTitle ? args.title : `${args.title} | ${SITE_NAME}`;
  return {
    title: args.absoluteTitle ? { absolute: args.title } : args.title,
    description: args.description,
    alternates: { canonical: args.path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: shareTitle,
      description: args.description,
      url: args.path,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: args.description,
      images: [SHARE_IMAGE.url],
    },
  };
}
