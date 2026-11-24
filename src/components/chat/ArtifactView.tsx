"use client";

import dynamic from "next/dynamic";
import { SqlArtifactView } from "@/components/chat/SqlArtifactView";
import { TableArtifact } from "@/components/chat/TableArtifact";
import { normalizeApiErrorPayload } from "@/lib/api-error";
import type { ConversationMessage } from "@/lib/queries/conversations";

// d3 and the chart renderer are only needed once a conversation actually
// produces a chart, so they stay out of the initial /chat bundle.
const D3ChartArtifact = dynamic(
  () =>
    import("@/components/chat/D3ChartArtifact").then(
      (mod) => mod.D3ChartArtifact,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50" />
    ),
  },
);

export function ArtifactView({
  artifact,
  collapsed = false,
}: {
  artifact: ConversationMessage["artifacts"][number];
  /** A table that repeats an earlier answer's rows starts folded. */
  collapsed?: boolean;
}) {
  if (artifact.type === "SQL") {
    return <SqlArtifactView artifact={artifact} />;
  }

  if (artifact.type === "TABLE") {
    const payload = artifact.payload as {
      columns?: string[];
      rows?: Array<Record<string, unknown>>;
      rowCount?: number;
    };
    const columns = payload.columns ?? [];
    const allRows = payload.rows ?? [];

    return <TableArtifact columns={columns} allRows={allRows} rowCount={payload.rowCount} startCollapsed={collapsed} />;
  }

  if (artifact.type === "ERROR") {
    const payload = artifact.payload as {
      error?: string;
      errorInfo?: Record<string, unknown>;
    };
    const message = normalizeApiErrorPayload(
      payload.errorInfo ?? payload.error,
      "Unexpected runtime error.",
    ).message;

    return (
      <div className="rounded-lg border border-secondary/30 bg-secondary-container px-3 py-2 text-sm text-on-secondary-container">
        Error: {message}
      </div>
    );
  }

  if (artifact.type === "TEXT") {
    const payload = artifact.payload as { kind?: string; sources?: unknown };
    if (payload.kind === "web_sources" && Array.isArray(payload.sources)) {
      return <WebSources sources={payload.sources} />;
    }
    return null;
  }

  if (artifact.type === "CHART") {
    const payload = artifact.payload as {
      chartType?: string;
      title?: string;
      spec?: Record<string, unknown>;
    };

    if (!payload.spec || typeof payload.spec !== "object") {
      return null;
    }

    return (
      <D3ChartArtifact
        chartType={payload.chartType}
        title={payload.title}
        spec={payload.spec}
      />
    );
  }

  return null;
}

/** The pages a web-assisted answer cites, numbered to match its [n] markers. */
function WebSources({ sources }: { sources: unknown[] }) {
  // Only http(s) links from the agent are rendered; anything else is dropped.
  const items = sources.flatMap((source) => {
    const { title, url } = (source ?? {}) as { title?: unknown; url?: unknown };
    if (typeof url !== "string" || !/^https?:\/\//.test(url)) return [];
    let host = url;
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return [];
    }
    return [{ url, host, title: typeof title === "string" && title.trim() ? title.trim() : host }];
  });
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface-container-lowest px-3 py-2.5">
      <p className="pod-label">Web sources</p>
      <ol className="mt-1.5 space-y-1">
        {items.map((item, index) => (
          <li key={item.url} className="flex min-w-0 items-baseline gap-2 text-sm">
            <span className="shrink-0 font-mono text-xs text-on-surface-variant">[{index + 1}]</span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              dir="auto"
              className="min-w-0 truncate text-on-surface underline decoration-border underline-offset-2 transition-colors hover:decoration-on-surface"
            >
              {item.title}
            </a>
            <span className="shrink-0 text-xs text-on-surface-variant">{item.host}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
