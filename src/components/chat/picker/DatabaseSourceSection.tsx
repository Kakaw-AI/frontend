"use client";

import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import type { DatabaseSource } from "@/lib/queries/database-sources";
import { AlertCircle, LoaderCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatTimestamp } from "./picker-utils";

export function DatabaseSourceSection({
  databaseSources,
  deletingSourceId,
  actionError,
  onDelete,
}: {
  databaseSources: DatabaseSource[] | undefined;
  deletingSourceId: string | null;
  actionError: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <section aria-labelledby="databases-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id="databases-title" className="pod-label">Databases</h3>
        <Link href="/onboarding/database" className="pod-btn-ghost py-1.5 text-xs">
          <Plus size={14} aria-hidden />
          Add database
        </Link>
      </div>

      {actionError ? (
        <p className="pod-alert" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {actionError}
        </p>
      ) : null}

      {!databaseSources?.length ? (
        <p className="rounded-2xl border border-dashed border-primary/30 px-4 py-6 text-center text-sm text-on-surface-variant">
          No databases yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {databaseSources.map((source) => (
            <li key={source.id} className="pod-card flex items-start gap-3 rounded-2xl p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-container">
                <DatabaseLogo provider={source.provider} className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-bold text-on-surface">{source.label}</p>
                  <DatabaseSourceStatusBadge status={source.status} />
                </div>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {source.provider} · checked {formatTimestamp(source.lastTestedAt, "recently")}
                </p>
                {source.lastError ? <p className="mt-1 text-xs text-secondary">{source.lastError}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => onDelete(source.id)}
                disabled={deletingSourceId === source.id}
                className="pod-btn-danger"
                aria-label={`Delete ${source.label}`}
              >
                {deletingSourceId === source.id ? <LoaderCircle size={12} className="animate-spin" aria-hidden /> : <Trash2 size={12} aria-hidden />}
                <span className="hidden sm:inline">Delete</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
