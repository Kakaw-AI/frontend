"use client";

import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import type { DatabaseSource } from "@/lib/queries/database-sources";
import { AlertCircle, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatTimestamp } from "./picker-utils";

export type SourceActionKind = "resync" | "delete";

export function DatabaseSourceSection({
  databaseSources,
  busySource,
  actionError,
  onAction,
}: {
  databaseSources: DatabaseSource[] | undefined;
  busySource: { id: string; action: SourceActionKind } | null;
  actionError: string | null;
  onAction: (action: SourceActionKind, id: string) => void;
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
              <div className="flex gap-2">
                {/* An uploaded SQLite file never changes, so only live databases can be re-read. */}
                {source.provider !== "sqlite" ? (
                  <button
                    type="button"
                    onClick={() => onAction("resync", source.id)}
                    disabled={busySource?.id === source.id || source.status === "PENDING" || source.status === "SYNCING"}
                    className="pod-btn-ghost px-3 py-1.5 text-xs"
                    aria-label={`Resync ${source.label}`}
                    title="Read the schema again after tables or columns change"
                  >
                    <RefreshCw
                      size={12}
                      className={busySource?.id === source.id && busySource.action === "resync" || source.status === "SYNCING" ? "animate-spin motion-reduce:animate-none" : undefined}
                      aria-hidden
                    />
                    <span className="hidden sm:inline">Resync</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onAction("delete", source.id)}
                  disabled={busySource?.id === source.id}
                  className="pod-btn-danger"
                  aria-label={`Delete ${source.label}`}
                >
                  {busySource?.id === source.id && busySource.action === "delete" ? <LoaderCircle size={12} className="animate-spin" aria-hidden /> : <Trash2 size={12} aria-hidden />}
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
