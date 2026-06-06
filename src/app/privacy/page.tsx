import type { Metadata } from "next"
import { Navbar } from "@/components/landing/Navbar"
import { CONTACT_EMAIL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Kakaw AI is built on a simple principle: your data is yours. Read exactly what we collect, why, and how we protect it.",
  alternates: { canonical: "/privacy" },
}
import { Footer } from "@/components/landing/Footer"

const sections = [
  {
    title: "Overview",
    content: `Kakaw AI is a Bring-Your-Own-Key (BYOK) application. We do not host LLM models or store your database content. Kakaw reads only your database schema (table names, column names, relationships) to generate SQL queries — never your actual row data. Your API keys are transmitted directly from your browser to your chosen LLM provider and are never sent to or stored on Kakaw's servers.`,
  },
  {
    title: "What We Collect",
    content: `We collect the minimum necessary to provide the service:

• Account information: your email address and a hashed password, stored via Better Auth for authentication purposes.
• Usage metadata: which features you use, when you log in, and general usage patterns. This data is used to improve the product and is never sold to third parties.
• Database connection metadata: your connection parameters (host, port, database name, username) are stored encrypted so you don't need to re-enter them. Passwords are encrypted at rest.`,
  },
  {
    title: "What We Don't Collect",
    content: `• Your database rows or any data contained in your database tables.
• Your API keys. These are held in your browser session only and sent directly to the LLM provider.
• The content of your LLM conversations beyond what is necessary to maintain conversation context in your active session.
• Any information from your database beyond the schema structure required to generate SQL queries.`,
  },
  {
    title: "Data Storage",
    content: `Authentication data (email, hashed password, session tokens) is stored locally via Better Auth using SQLite. Session data is stored in secure HTTP-only cookies. We do not use third-party analytics services that store personal data. No personal data is transferred to third parties for marketing purposes.`,
  },
  {
    title: "Third-Party LLM Providers",
    content: `When you use Kakaw, your questions and schema context are sent to the LLM provider you configured (Anthropic, OpenAI, Google, or a local model via Ollama/LM Studio). The handling of that data is governed by the privacy policy of your chosen provider. We recommend reviewing their policies:

• Anthropic: anthropic.com/privacy
• OpenAI: openai.com/privacy
• Google: policies.google.com/privacy

Local models (Ollama, LM Studio) process data entirely on your machine — no data leaves your device.`,
  },
  {
    title: "Your Rights",
    content: `You may request deletion of your account and associated data at any time by contacting us. Upon deletion, your email, hashed password, database connection metadata, and session data will be permanently removed.`,
  },
  {
    title: "Contact",
    content: `Questions about this privacy policy? Reach us at ${CONTACT_EMAIL}.

Last updated: April 2026`,
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-surface">
        <div className="max-w-3xl mx-auto px-8 py-16">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Legal
          </span>
          <h1 className="font-headline text-5xl italic mt-3 mb-4 text-on-surface leading-tight">
            Privacy Policy
          </h1>
          <p className="text-on-surface-variant mb-16 text-lg">
            We built Kakaw on a simple principle: your data is yours. Here&apos;s exactly what we collect and why.
          </p>

          <div className="space-y-12">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-headline text-2xl italic text-on-surface mb-4">
                  {section.title}
                </h2>
                <div className="text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
