import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

// Public pages that each answer one search: a database, a way to run the
// model, real examples. Every claim must match the user docs; link the doc
// page that backs it.

type Block = { heading: string; body: React.ReactNode };

export type LandingPage = {
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  image?: { src: string; width: number; height: number; alt: string };
  blocks: Block[];
  cta: { label: string; href: string };
  docs: { label: string; href: string };
};

const code = "block overflow-x-auto rounded-lg bg-surface-container p-4 font-mono text-sm text-on-surface";
const a = "underline underline-offset-4 decoration-primary/40 hover:decoration-primary";

export const LANDING: Record<"postgresql" | "mongodb" | "sqlite" | "localModels", LandingPage> = {
  postgresql: {
    path: "/postgresql",
    eyebrow: "PostgreSQL",
    title: "Ask Your PostgreSQL Database in Plain English",
    description:
      "Connect PostgreSQL with a connection URL and ask questions in plain English. Kakaw writes read-only SQL, runs it in a read-only transaction and answers with a table and a chart.",
    h1: "Ask your PostgreSQL database in plain English",
    intro:
      "Paste a connection URL, let Kakaw read the schema, then type your question. Kakaw writes one read-only SELECT, runs it, checks that the result answers the question, and replies with a short summary, the table and a chart. The SQL is one click away.",
    image: {
      src: "/screens/connect-database.png",
      width: 1536,
      height: 1346,
      alt: "Kakaw's database picker: PostgreSQL or MongoDB by connection URL, or SQLite by file upload",
    },
    blocks: [
      {
        heading: "Works with the Postgres you already have",
        body: (
          <>
            <p>
              Any PostgreSQL database that accepts connections from the internet works. Supabase, Neon, Railway,
              Amazon RDS and similar hosts all show a connection URL; add options such as{" "}
              <code className="font-mono">?sslmode=require</code> at the end.
            </p>
            <code className={code}>postgresql://user:password@host:5432/database</code>
            <p>
              Kakaw connects from its own servers, so <code className="font-mono">localhost</code> and private
              network addresses are refused.
            </p>
          </>
        ),
      },
      {
        heading: "Read-only by design",
        body: (
          <>
            <p>
              Every query runs inside a read-only transaction, and anything that isn&apos;t a single SELECT is
              rejected before it reaches your database. Each query stops after 30 seconds and returns at most 200
              rows. Columns named like passwords, tokens or keys come back as <code className="font-mono">[redacted]</code>.
            </p>
            <p>A read-only user is still the safest choice, and it limits Kakaw to the tables you grant:</p>
            <code className={`${code} whitespace-pre`}>
              {`CREATE ROLE kakaw_reader LOGIN PASSWORD 'choose-a-password';
GRANT CONNECT ON DATABASE your_db TO kakaw_reader;
GRANT USAGE ON SCHEMA public TO kakaw_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO kakaw_reader;`}
            </code>
          </>
        ),
      },
      {
        heading: "It reads your schema first",
        body: (
          <p>
            When you connect, Kakaw reads your tables, columns, keys and a few sample values, so questions can use
            your words instead of table names. Each answered question is remembered with the SQL that answered it, and
            the next similar question starts from there. That memory belongs to one database of one account.
          </p>
        ),
      },
      {
        heading: "What is stored and sent",
        body: (
          <p>
            The connection URL is stored encrypted (AES-256-GCM). Kakaw keeps the schema and a few sample rows, not a
            copy of your tables. To write the answer, your question, the schema and the result rows go to the model
            provider you chose. The full list is in{" "}
            <Link className={a} href="/docs/privacy-and-security">
              Privacy and security
            </Link>
            .
          </p>
        ),
      },
    ],
    cta: { label: "Connect PostgreSQL", href: "/login" },
    docs: { label: "PostgreSQL setup guide", href: "/docs/data/postgres" },
  },
  mongodb: {
    path: "/mongodb",
    eyebrow: "MongoDB",
    title: "Ask Your MongoDB Database in Plain English",
    description:
      "Connect MongoDB with its connection string and ask questions in plain English. Kakaw writes SQL, translates it to a read-only aggregation pipeline and answers with a table and a chart.",
    h1: "Ask your MongoDB database in plain English",
    intro:
      "Paste a connection string that names the database, let Kakaw read your collections, then ask. Kakaw writes the query as SQL, translates it to an aggregation pipeline, runs it and answers with a short summary, the table and a chart.",
    image: {
      src: "/screens/connect-database.png",
      width: 1536,
      height: 1346,
      alt: "Kakaw's database picker with the MongoDB option: paste a mongodb+srv:// URL that names the database",
    },
    blocks: [
      {
        heading: "Atlas or your own cluster",
        body: (
          <>
            <p>
              In MongoDB Atlas, choose Connect, then Drivers, and copy the string. Add the database name after the host:
              Kakaw reads one database per connection. Standard <code className="font-mono">mongodb://</code> strings
              with several hosts work too.
            </p>
            <code className={code}>mongodb+srv://user:password@cluster0.example.mongodb.net/shop</code>
            <p>
              The database must accept connections from the internet, so add Kakaw to the project&apos;s Network Access
              list in Atlas. <code className="font-mono">localhost</code> and private network addresses are refused.
            </p>
          </>
        ),
      },
      {
        heading: "Collections become tables",
        body: (
          <p>
            Collections have no fixed columns, so Kakaw works them out from up to 100 sampled documents each. Every
            field becomes a column with its most common type, nested fields become dot paths such as{" "}
            <code className="font-mono">address.city</code>, and arrays can still be unwound to count or group their
            items. The SQL you see under an answer is what Kakaw translated into the pipeline.
          </p>
        ),
      },
      {
        heading: "Read-only in Kakaw's own code",
        body: (
          <>
            <p>
              MongoDB has no read-only transaction, so Kakaw only ever runs aggregation queries and refuses any stage
              that writes (<code className="font-mono">$out</code>, <code className="font-mono">$merge</code>) or runs
              JavaScript. A user with only the <code className="font-mono">read</code> role makes that certain:
            </p>
            <code className={`${code} whitespace-pre`}>{`db.getSiblingDB("shop").createUser({
  user: "kakaw_reader",
  pwd: "choose-a-password",
  roles: [{ role: "read", db: "shop" }],
});`}</code>
          </>
        ),
      },
      {
        heading: "What is stored and sent",
        body: (
          <p>
            The connection string is stored encrypted. Kakaw keeps the inferred schema and a few sample values, not a
            copy of your collections. To write the answer, your question, the schema and the result rows go to the
            model provider you chose. The full list is in{" "}
            <Link className={a} href="/docs/privacy-and-security">
              Privacy and security
            </Link>
            .
          </p>
        ),
      },
    ],
    cta: { label: "Connect MongoDB", href: "/login" },
    docs: { label: "MongoDB setup guide", href: "/docs/data/mongodb" },
  },
  sqlite: {
    path: "/sqlite",
    eyebrow: "SQLite",
    title: "Ask Questions About a SQLite File in Plain English",
    description:
      "Upload a .db, .sqlite or .sqlite3 file up to 25 MB and ask about it in plain English. Kakaw writes the SQL, runs it on the file opened read-only and answers with a table and a chart.",
    h1: "Ask questions about a SQLite file in plain English",
    intro:
      "Drop a SQLite file, wait a moment while Kakaw reads its schema, and ask. You get a short answer, the result table, a chart when the data suits one, and the SQL that produced it.",
    image: {
      src: "/screens/connect-database.png",
      width: 1536,
      height: 1346,
      alt: "Kakaw's database picker with the SQLite option: upload a .db, .sqlite or .sqlite3 file",
    },
    blocks: [
      {
        heading: "Upload and ask",
        body: (
          <p>
            Kakaw takes <code className="font-mono">.db</code>, <code className="font-mono">.sqlite</code> and{" "}
            <code className="font-mono">.sqlite3</code> files up to 25 MB. The file goes straight from your browser to
            Kakaw&apos;s storage, then Kakaw reads its tables, columns and sample values so your questions can use
            plain words.
          </p>
        ),
      },
      {
        heading: "Opened read-only, one query at a time",
        body: (
          <p>
            Queries open the file read-only, in a separate process that is stopped if a query runs longer than 30
            seconds, and return at most 200 rows. Anything that isn&apos;t a single SELECT is rejected first.
          </p>
        ),
      },
      {
        heading: "A snapshot you control",
        body: (
          <p>
            To run your queries, Kakaw stores a copy of the uploaded file, so upload a copy you are fine storing and
            leave out tables you don&apos;t want to ask about. The file is a snapshot: for newer data, upload the new
            file as another database. Deleting the database in Kakaw deletes the stored file.
          </p>
        ),
      },
      {
        heading: "Good for files you already have",
        body: (
          <p>
            An export from another tool, the database behind a desktop or mobile app, a dataset you downloaded: if it
            is a SQLite file, you can ask it questions without opening a SQL client.
          </p>
        ),
      },
    ],
    cta: { label: "Upload a SQLite file", href: "/login" },
    docs: { label: "SQLite guide", href: "/docs/data/sqlite" },
  },
  localModels: {
    path: "/local-models",
    eyebrow: "Local models",
    title: "Ask Your Database With Your Own Ollama or LM Studio Model",
    description:
      "Point Kakaw at your own Ollama or LM Studio server and ask your database questions with a model you run. Questions and results go to your server, not to an AI company.",
    h1: "Ask your database with a model you run yourself",
    intro:
      "Kakaw works with Ollama and LM Studio through their OpenAI-compatible API. Your questions, schema and results go to your own server instead of a hosted AI provider, and you pay nothing per question.",
    blocks: [
      {
        heading: "Give Kakaw a public address",
        body: (
          <>
            <p>
              Kakaw calls your model from its own servers, not from your browser, so{" "}
              <code className="font-mono">localhost</code> and private network addresses are refused. Expose the
              server through a tunnel or a reverse proxy with HTTPS, and use that address with{" "}
              <code className="font-mono">/v1</code> at the end:
            </p>
            <code className={`${code} whitespace-pre`}>{`https://ollama.example.com/v1
https://lmstudio.example.com/v1`}</code>
            <p>An API key is optional; add one if your proxy checks it. Kakaw then lists the models the server has.</p>
          </>
        ),
      },
      {
        heading: "What goes where",
        body: (
          <p>
            To answer, Kakaw sends your model the question, the conversation so far, your schema with its sample
            values and the result rows. With a local model, that goes to your server and to no AI company. Kakaw
            itself still stores your chats and schema as described in{" "}
            <Link className={a} href="/docs/privacy-and-security">
              Privacy and security
            </Link>
            .
          </p>
        ),
      },
      {
        heading: "Speed and quality, honestly",
        body: (
          <p>
            Local models are often much slower than hosted ones, so Kakaw gives each call up to 10 minutes instead of
            90 seconds, and one question makes several calls. Turning Think off, using a smaller model or a machine
            with a GPU all help. Writing correct SQL across many tables is hard for small models: if answers are
            often wrong, try a larger model or a hosted one on the same database and compare.
          </p>
        ),
      },
      {
        heading: "Or use a hosted model",
        body: (
          <p>
            The same chat works with your own key for OpenAI, Anthropic Claude, Google Gemini, OpenRouter or any
            OpenAI-compatible endpoint. You pay the provider directly; Kakaw is free.
          </p>
        ),
      },
    ],
    cta: { label: "Add your model", href: "/login" },
    docs: { label: "Local models guide", href: "/docs/models/local-models" },
  },
};

export const LANDING_PATHS = [...Object.values(LANDING).map((p) => p.path), "/examples"];

export const landingMetadata = (p: LandingPage): Metadata =>
  pageMetadata({ title: p.title, description: p.description, path: p.path });

/** The shared frame for a landing page: header, body blocks, call to action. */
export function LandingShell({
  eyebrow,
  h1,
  intro,
  path,
  children,
}: {
  eyebrow: string;
  h1: string;
  intro: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: eyebrow, path }])} />
      <Navbar />
      <main className="pt-24 min-h-screen bg-surface">
        <article className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant font-semibold">
            {eyebrow}
          </span>
          <h1 className="font-headline text-4xl sm:text-5xl mt-3 mb-5 text-on-surface leading-tight">{h1}</h1>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-12">{intro}</p>
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}

export function LandingPageView({ page }: { page: LandingPage }) {
  return (
    <LandingShell eyebrow={page.eyebrow} h1={page.h1} intro={page.intro} path={page.path}>
      {page.image && (
        <Image
          src={page.image.src}
          width={page.image.width}
          height={page.image.height}
          alt={page.image.alt}
          sizes="(min-width: 768px) 720px, 100vw"
          className="mb-14 w-full h-auto rounded-xl border border-border"
          priority
        />
      )}
      <div className="space-y-12">
        {page.blocks.map((block) => (
          <section key={block.heading}>
            <h2 className="font-headline text-2xl text-on-surface mb-4">{block.heading}</h2>
            <div className="space-y-4 text-on-surface-variant leading-relaxed">{block.body}</div>
          </section>
        ))}
      </div>
      <div className="mt-16 flex flex-wrap gap-4">
        <Link href={page.cta.href} className="pod-btn px-8 py-4 text-base">
          {page.cta.label}
        </Link>
        <Link href={page.docs.href} className="pod-btn-ghost px-8 py-4 text-base">
          {page.docs.label}
        </Link>
      </div>
      <nav aria-label="More about Kakaw" className="mt-16 border-t border-border pt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {[...Object.values(LANDING).filter((p) => p.path !== page.path), { path: "/examples", eyebrow: "Examples" }].map(
          (p) => (
            <Link key={p.path} href={p.path} className={a}>
              {p.eyebrow}
            </Link>
          )
        )}
      </nav>
    </LandingShell>
  );
}
