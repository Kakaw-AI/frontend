"use client";

import { useState } from "react";
import type { ConversationMessage } from "@/lib/queries/conversations";

export function SqlArtifactView({
  artifact,
}: {
  artifact: ConversationMessage["artifacts"][number];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const payload = artifact.payload as { sql?: string };
  const sql = payload.sql?.trim();

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
        {isExpanded ? "Hide SQL" : "Show SQL"}
      </button>

      {isExpanded ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-container">
          <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-on-surface">
            <code>{sql}</code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}
