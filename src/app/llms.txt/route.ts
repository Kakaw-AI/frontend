import { SITE_URL } from "@/lib/site";
import { docsLlms } from "@/lib/source";

// The guide for AI assistants and crawlers (https://llmstxt.org): what Kakaw
// is, then an index of the docs with a Markdown link per page. Every claim in
// the intro must match the docs; the docs index is generated from them.
export const revalidate = false;

const INTRO = `# Kakaw AI

> Kakaw AI lets people ask questions about their own database in plain English and get answers as text, tables and charts. It writes read-only SQL, runs it, checks the result and explains it. You bring your own model: an OpenAI-compatible endpoint (OpenAI, OpenRouter, Ollama, LM Studio), Google Gemini or Anthropic Claude.

- Databases: PostgreSQL and MongoDB (connection URL) and SQLite (file upload, up to 25 MB). MySQL, BigQuery and Snowflake are not supported yet.
- Queries are read-only and limited to 200 rows and 30 seconds.
- API keys and connection strings are stored encrypted (AES-256-GCM) on Kakaw's servers; only the last four characters of a key are ever shown.
- For a PostgreSQL or MongoDB database, Kakaw stores the schema plus a few sample rows and values. An uploaded SQLite file is stored whole, so queries can run on it. Query results are sent to the model provider you chose to write the answer, and saved with the chat.
- When a question needs facts outside the database, Kakaw can search the web and cites its sources.

Full docs as one file: ${SITE_URL}/llms-full.txt

## Key pages
- [Home](${SITE_URL}/): Product overview and pricing
- [PostgreSQL](${SITE_URL}/postgresql): Ask a PostgreSQL database in plain English
- [SQLite](${SITE_URL}/sqlite): Ask questions about an uploaded SQLite file
- [Local models](${SITE_URL}/local-models): Use your own Ollama or LM Studio server
- [Examples](${SITE_URL}/examples): Real questions with Kakaw's answers, tables, charts and SQL
- [Sign in](${SITE_URL}/login): Google or GitHub sign-in
- [Privacy Policy](${SITE_URL}/privacy)
- [Terms of Service](${SITE_URL}/terms)
`;

export async function GET() {
  // The generated index is relative to the site; agents need absolute links.
  const index = (await docsLlms.index()).replace(/\]\(\//g, `](${SITE_URL}/`);
  return new Response(`${INTRO}\n${index}`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
