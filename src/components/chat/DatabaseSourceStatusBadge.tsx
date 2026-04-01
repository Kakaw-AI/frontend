"use client";

import { cn } from "@/lib/utils";
import type { DatabaseSourceStatus } from "@/lib/queries/database-sources";
import type { LlmConnectionStatus } from "@/lib/queries/llm-connections";

const STATUS_CONFIG: Record<
  DatabaseSourceStatus | LlmConnectionStatus,
  {
    label: string;
    dotClassName: string;
    className: string;
  }
> = {
  SUCCESS: {
    label: "Connected",
    dotClassName: "bg-emerald-500",
    className:
      "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
  },
  READY: {
    label: "Ready",
    dotClassName: "bg-emerald-500",
    className:
      "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
  },
  PENDING: {
    label: "Pending",
    dotClassName: "bg-amber-500",
    className:
      "border-amber-200/80 bg-amber-50/80 text-amber-800",
  },
  SYNCING: {
    label: "Syncing",
    dotClassName: "bg-sky-500",
    className:
      "border-sky-200/80 bg-sky-50/80 text-sky-800",
  },
  FAILED: {
    label: "Failed",
    dotClassName: "bg-rose-500",
    className:
      "border-rose-200/80 bg-rose-50/80 text-rose-800",
  },
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
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.2em]",
        config.className,
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", config.dotClassName)} />
      {config.label}
    </span>
  );
}
