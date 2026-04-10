import type { Metadata } from "next"
import DocsIndex from "@/content/docs/index.mdx"

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Learn how to connect your database, set up an LLM, and start talking to your data with Kakaw AI.",
}

export default function DocsPage() {
  return <DocsIndex />
}
