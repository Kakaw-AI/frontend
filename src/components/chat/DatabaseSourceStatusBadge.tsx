"use client";

import { cn } from "@/lib/utils";
import type { DatabaseSourceStatus } from "@/lib/queries/database-sources";
import type { LlmConnectionStatus } from "@/lib/queries/llm-connections";

// Pod palette: yellow = good, lilac = in progress, pink = broken.
const STATUS_CONFIG: Record<DatabaseSourceStatus | LlmConnectionStatus, { label: string; className: string }> = {
  SUCCESS: { label: "Connected", className: "bg-accent text-primary" },
  READY: { label: "Ready", className: "bg-accent text-primary" },
  PENDING: { label: "Pending", className: "bg-surface-container text-on-surface" },
  SYNCING: { label: "Indexing", className: "bg-surface-container text-on-surface" },
  FAILED: { label: "Failed", className: "bg-secondary-container text-on-secondary-container" },
};

export function DatabaseSourceStatusBadge({
  status,
  className,
}: {
  status: DatabaseSourceStatus | LlmConnectionStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border-2 border-primary px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em]",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
