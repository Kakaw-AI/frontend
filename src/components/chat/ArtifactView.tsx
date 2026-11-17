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
}: {
  artifact: ConversationMessage["artifacts"][number];
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

    return <TableArtifact columns={columns} allRows={allRows} rowCount={payload.rowCount} />;
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
