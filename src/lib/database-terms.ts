import type { DatabaseProvider } from "@/components/onboarding/DatabaseLogo";

const NAMES: Record<DatabaseProvider, string> = {
  postgresql: "PostgreSQL",
  mongodb: "MongoDB",
  sqlite: "SQLite",
  mysql: "MySQL",
  bigquery: "BigQuery",
  snowflake: "Snowflake",
};

/** What a database type is called, and what it calls its own parts. */
export function databaseTerms(provider: DatabaseProvider) {
  const documents = provider === "mongodb";
  return {
    name: NAMES[provider],
    tables: documents ? "collections" : "tables",
    columns: documents ? "fields" : "columns",
    rows: documents ? "documents" : "rows",
  };
}
