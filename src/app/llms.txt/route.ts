import { SITE_URL } from "@/lib/site";

// Static plain-text guide for AI crawlers (ChatGPT, Perplexity, etc.).
// See https://llmstxt.org/ for the convention.
export const dynamic = "force-static";

export function GET() {
  const body = `# Kakaw AI

> Kakaw AI lets non-technical teams query any database using plain English. No SQL needed — connect a database, ask a question, and get answers as tables and charts in seconds. It is a Bring-Your-Own-Key (BYOK) tool: your LLM API key goes directly from your browser to your chosen provider and is never stored on Kakaw's servers, and Kakaw reads only your database schema, never your row data.

## Capabilities
- Natural-language to SQL over relational databases
- Supported databases: PostgreSQL, MySQL, Snowflake, SQLite
- Supported LLM providers: Anthropic, OpenAI, Google (Gemini), Ollama, LM Studio
- Generates transparent SQL plus charts and tables from results

## Documentation
- [Documentation home](${SITE_URL}/docs): Overview of guides and how Kakaw works
- [Getting Started](${SITE_URL}/docs/getting-started): Zero to first insight in under 5 minutes
- [Connect a Database](${SITE_URL}/docs/connect-database): Connect Postgres, MySQL, Snowflake, or SQLite
- [Set Up Your LLM](${SITE_URL}/docs/setup-llm): Configure your BYOK LLM provider
- [Using the Chat](${SITE_URL}/docs/using-chat): Ask questions and refine queries

## Key pages
- [Home](${SITE_URL}/): Product overview and pricing
- [Sign In](${SITE_URL}/login): Google or GitHub sign-in
- [Privacy Policy](${SITE_URL}/privacy)
- [Terms of Service](${SITE_URL}/terms)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
