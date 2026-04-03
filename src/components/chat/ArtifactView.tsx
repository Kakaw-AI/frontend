import { D3ChartArtifact } from "@/components/chat/D3ChartArtifact";
import { SqlArtifactView } from "@/components/chat/SqlArtifactView";
import { TableArtifact } from "@/components/chat/TableArtifact";
import { normalizeApiErrorPayload } from "@/lib/api-error";
import type { ConversationMessage } from "@/lib/queries/conversations";

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
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        {message}
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
