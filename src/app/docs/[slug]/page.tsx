import type { Metadata } from "next"
import { notFound } from "next/navigation"

const validSlugs = ["getting-started", "connect-database", "setup-llm", "using-chat"]

const slugMeta: Record<string, { title: string; description: string }> = {
  "getting-started": {
    title: "Getting Started",
    description: "Get from zero to your first database insight with Kakaw AI in under 5 minutes.",
  },
  "connect-database": {
    title: "Connect a Database",
    description: "Learn how to connect Postgres, MySQL, Snowflake, or SQLite to Kakaw AI. Your credentials are encrypted and never stored.",
  },
  "setup-llm": {
    title: "Set Up Your LLM",
    description: "Configure your LLM provider (Anthropic, OpenAI, Google, or local models) in Kakaw AI. BYOK — your API key never touches our servers.",
  },
  "using-chat": {
    title: "Using the Chat",
    description: "Learn how to ask questions, refine queries, and get the most out of the Kakaw AI chat interface.",
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const meta = slugMeta[slug]
  if (!meta) return {}
  return {
    title: meta.title,
    description: meta.description,
  }
}

export function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }))
}

export const dynamicParams = false

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!validSlugs.includes(slug)) notFound()

  const { default: Doc } = await import(`@/content/docs/${slug}.mdx`)
  return <Doc />
}
