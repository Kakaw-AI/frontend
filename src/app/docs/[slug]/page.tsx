import { notFound } from "next/navigation"

const validSlugs = ["getting-started", "connect-database", "setup-llm", "using-chat"]

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
