import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeUp } from "@/components/amicro/fade-up";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";

const SUPPORTED = [
  {
    id: "postgresql",
    label: "PostgreSQL",
    description: "Paste a connection URL. Kakaw tests it before saving.",
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description: "Paste a mongodb+srv:// URL that names the database.",
  },
  {
    id: "sqlite",
    label: "SQLite",
    description: "Upload a .db, .sqlite or .sqlite3 file.",
  },
] as const;

const COMING_SOON = ["mysql", "bigquery", "snowflake"] as const;
const COMING_SOON_LABELS: Record<(typeof COMING_SOON)[number], string> = {
  mysql: "MySQL",
  bigquery: "BigQuery",
  snowflake: "Snowflake",
};

export function ChooseDatabasePage() {
  return (
    <>
      <h1 className="font-headline text-3xl text-on-surface sm:text-4xl">
        Which database do you use?
      </h1>
      <p className="mt-3 text-on-surface-variant">
        Kakaw reads your schema, then answers questions about your data in plain
        English.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {SUPPORTED.map((db, i) => (
          <FadeUp
            key={db.id}
            delay={0.1 + i * 0.08}
            className="list-item list-none"
          >
            <Link
              href={`/onboarding/connection?provider=${db.id}`}
              className="group pod-card flex h-full flex-col gap-4 rounded-lg p-5 transition-all"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-container">
                <DatabaseLogo provider={db.id} className="h-7 w-7" />
              </span>
              <span>
                <span className="flex items-center gap-2 text-lg font-bold text-on-surface">
                  {db.label}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
                <span className="mt-1 block text-sm text-on-surface-variant">
                  {db.description}
                </span>
              </span>
            </Link>
          </FadeUp>
        ))}
      </ul>

      <div className="mt-8">
        <p className="pod-label">Coming soon</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {COMING_SOON.map((id) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-[8px] border border-dashed border-primary/25 px-3 py-1.5 text-sm text-on-surface-variant"
            >
              <DatabaseLogo
                provider={id}
                className="h-4 w-4 opacity-60 grayscale"
              />
              {COMING_SOON_LABELS[id]}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
