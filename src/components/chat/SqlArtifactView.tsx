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
        className="text-left text-xs font-medium text-on-surface/40 transition hover:text-on-surface/65"
      >
        {isExpanded ? "Hide SQL executed" : "Show SQL executed"}
      </button>

      {isExpanded ? (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest">
          <pre className="overflow-x-auto px-4 py-4 text-xs leading-relaxed text-on-surface/80">
            <code>{sql}</code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}
