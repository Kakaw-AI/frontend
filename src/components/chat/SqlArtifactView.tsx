"use client";

import { useEffect, useState } from "react";
import type { DatabaseProvider } from "@/components/onboarding/DatabaseLogo";
import type { ConversationMessage } from "@/lib/queries/conversations";
import { CopyButton } from "./CopyButton";

export function SqlArtifactView({
  artifact,
  provider,
}: {
  artifact: ConversationMessage["artifacts"][number];
  provider: DatabaseProvider;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const payload = artifact.payload as { sql?: string };
  const sql = payload.sql?.trim();
  // MongoDB sources run a JSON aggregation pipeline, not SQL. Older answers
  // on the same source were SQL, so those still show as SQL.
  const pipeline = sql && provider === "mongodb" ? prettyJson(sql) : null;
  const formatted = useFormattedSql(isExpanded && !pipeline ? sql : undefined);
  const label = pipeline ? "query" : "SQL";
  const shown = pipeline ?? formatted ?? sql;

  if (!sql) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="rounded-[8px] border border-primary/20 px-3 py-1 font-mono text-xs font-medium text-on-surface-variant transition-colors hover:border-border hover:text-on-surface"
      >
        {isExpanded ? `Hide ${label}` : `Show ${label}`}
      </button>

      {isExpanded ? (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-container">
          <CopyButton
            text={shown ?? ""}
            className="absolute right-1.5 top-1.5"
          />
          <pre className="overflow-x-auto py-3 pl-4 pr-11 font-mono text-[13px] leading-relaxed text-on-surface">
            <code>{shown}</code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function prettyJson(text: string): string | null {
  if (!text.startsWith("{")) return null;
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return null;
  }
}

/**
 * Models often return the query on one line. Break it into clauses for reading.
 * The formatter is loaded only when a SQL block is opened, and SQL that already
 * has line breaks is left as the model wrote it.
 */
function useFormattedSql(sql: string | undefined) {
  const [formatted, setFormatted] = useState<{
    source: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!sql || sql.includes("\n") || formatted?.source === sql) return;
    let cancelled = false;
    import("sql-formatter")
      .then(({ format }) => {
        // The artifact doesn't say which database it ran on. Postgres first
        // (it accepts `::` casts), then SQLite; if neither parses, the SQL
        // stays as written.
        for (const language of ["postgresql", "sqlite"] as const) {
          try {
            const text = format(sql, { language });
            if (!cancelled) setFormatted({ source: sql, text });
            return;
          } catch {
            // try the next dialect
          }
        }
      })
      .catch(() => {
        // Formatter failed to load: keep showing the SQL as written.
      });
    return () => {
      cancelled = true;
    };
  }, [sql, formatted?.source]);

  return formatted && formatted.source === sql ? formatted.text : undefined;
}
