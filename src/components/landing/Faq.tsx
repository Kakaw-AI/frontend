import Link from "next/link";

// Real questions people ask before connecting a database. Every answer must
// match the user docs; each links the page that backs it. Plain <details>,
// so the answers are in the served HTML.
const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "Can Kakaw change or delete my data?",
    a: (
      <>
        No. Every PostgreSQL query runs in a read-only transaction and SQLite files are opened read-only. Anything that
        isn&apos;t a single SELECT is rejected first, and each query stops after 30 seconds and 200 rows. See{" "}
        <Link href="/docs/privacy-and-security">Privacy and security</Link>.
      </>
    ),
  },
  {
    q: "Which databases does it work with?",
    a: (
      <>
        <Link href="/postgresql">PostgreSQL</Link>, connected by URL, and <Link href="/sqlite">SQLite</Link> files up to
        25 MB. MySQL and Snowflake are not supported yet.
      </>
    ),
  },
  {
    q: "Which AI models can I use?",
    a: (
      <>
        Your own key for OpenAI, Anthropic Claude, Google Gemini or OpenRouter, any OpenAI-compatible endpoint, or{" "}
        <Link href="/local-models">your own Ollama or LM Studio server</Link>.
      </>
    ),
  },
  {
    q: "What does the model see?",
    a: (
      <>
        Your question, the conversation so far, your schema with a few sample values, and the rows each query returns,
        which it needs to write the answer. Your provider&apos;s privacy terms apply to what it receives.
      </>
    ),
  },
  {
    q: "Is it free?",
    a: <>Yes. You bring your own model and pay your provider directly, or nothing at all with a model you run.</>,
  },
  {
    q: "Do I need to know SQL?",
    a: (
      <>
        No. You can read the SQL behind every answer if you want to check it, but you never have to write it. See{" "}
        <Link href="/examples">real examples</Link>.
      </>
    ),
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="max-w-3xl mx-auto px-5 sm:px-8 py-16 md:py-24">
      <h2 id="faq-title" className="font-headline text-3xl sm:text-4xl text-on-surface mb-8">
        Questions before you connect
      </h2>
      <div className="divide-y divide-border border-y border-border">
        {faqs.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="cursor-pointer list-none font-headline text-lg text-on-surface flex justify-between gap-4">
              {f.q}
              <span aria-hidden className="text-on-surface-variant transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-on-surface-variant leading-relaxed [&_a]:underline [&_a]:underline-offset-4">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
