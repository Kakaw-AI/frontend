import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { Navbar } from "@/components/landing/Navbar"
import { CONTACT_EMAIL } from "@/lib/site"

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What Kakaw AI stores, what it sends to your model provider and others, and how to delete it.",
  path: "/privacy",
})
import { Footer } from "@/components/landing/Footer"

// Every statement here must match the code and docs/privacy-and-security.mdx.
const sections = [
  {
    title: "Overview",
    content: `Kakaw AI lets you ask your own database questions with your own AI model. To do that it stores your connection details, your database's structure with a few sample values, and your chats. It sends the model provider you chose what that model needs to answer, including query results. It does not copy your database, except a SQLite file you upload.`,
  },
  {
    title: "What We Store",
    content: `• Account: you sign in with Google or GitHub. We store your name, email address, profile picture and the sign-in tokens they return. Kakaw has no passwords of its own.
• Sessions: the IP address and browser of each sign-in.
• Connections: database connection strings and model API keys, encrypted with AES-256-GCM on our servers.
• Database structure: table or collection names, columns or fields, keys, row counts, sample values, and the values of short text columns such as categories or statuses.
• Uploaded SQLite files: stored whole, so queries can run on them.
• Chats: your questions, the answers, the queries, up to 200 result rows per answer, charts and web sources.
• Working records: the steps and queries of each answer, questions answered before with the query that worked, and token counts.`,
  },
  {
    title: "Logs and Backups",
    content: `Our server logs record each call to your model: your account id and up to the first 2,000 characters of each part of the prompt and of the reply. These can include your questions, parts of your database structure and values from query results. We use them to find faults.

The application database is backed up. Deleting something in the app removes it from the live database; it does not immediately remove it from logs or backups.`,
  },
  {
    title: "Who Receives Data",
    content: `• Your model provider (for example OpenAI, Anthropic, Google or OpenRouter, or your own Ollama or LM Studio server): your question, the conversation so far, your database structure with sample values, and query results. Our servers make these calls, also to a model you run yourself. The provider's own privacy terms apply.
• Web search: when an answer needs facts outside your database, Kakaw sends search queries to a search service we run, which passes them to public search engines.
• Hosting and storage: Vercel serves the website and measures page speed, Cloudflare carries traffic to our servers and stores uploaded files, and Backblaze holds database backups.
• Sign-in: Google or GitHub, whichever you choose.

We do not sell your data or share it for advertising.`,
  },
  {
    title: "In Your Browser",
    content: `A session cookie keeps you signed in, and text you have typed but not sent is kept in your browser's local storage.`,
  },
  {
    title: "Your Rights",
    content: `You can delete a chat, a database or your whole account at any time from inside the app. Deleting a database removes its connection details, uploaded file, stored structure and chats; token counts stay in your profile. Deleting your account removes your profile, sessions, chats, databases and saved API keys. You can also ask us to do this for you by contacting us.`,
  },
  {
    title: "Contact",
    content: `Questions about this privacy policy? Reach us at ${CONTACT_EMAIL}.

Last updated: November 2026`,
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
          <h1 className="font-headline text-5xl mt-3 mb-4 text-on-surface leading-tight">
            Privacy Policy
          </h1>
          <p className="text-on-surface-variant mb-16 text-lg">
            What Kakaw stores, what it sends elsewhere, and how to delete it.
          </p>

          <div className="space-y-12">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-headline text-2xl text-on-surface mb-4">
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
