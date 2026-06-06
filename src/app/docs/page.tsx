import type { Metadata } from "next"
import DocsIndex from "@/content/docs/index.mdx"
import { JsonLd } from "@/components/seo/JsonLd"
import { breadcrumbSchema, techArticleSchema } from "@/lib/schema"

const DOCS_TITLE = "Documentation"
const DOCS_DESCRIPTION =
  "Learn how to connect your database, set up an LLM, and start talking to your data with Kakaw AI."

export const metadata: Metadata = {
  title: DOCS_TITLE,
  description: DOCS_DESCRIPTION,
  alternates: { canonical: "/docs" },
}

export default function DocsPage() {
  return (
    <>
      <JsonLd
        data={[
          techArticleSchema({
            title: DOCS_TITLE,
            description: DOCS_DESCRIPTION,
            path: "/docs",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Docs", path: "/docs" },
          ]),
        ]}
      />
      <DocsIndex />
    </>
  )
}
