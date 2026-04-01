"use client";

import Link from "next/link";
import { AlertCircle, Database, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import {
  type DatabaseSource,
  databaseSourcesQueryKey,
  resyncDatabaseSource,
} from "@/lib/queries/database-sources";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Saved source";
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "Saved source";
  }

  return `Tested ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

export function DatabaseSourcePicker({
  isOpen,
  sources,
  isLoading,
  isRefreshing,
  error,
  onClose,
  onRetry,
  onSelect,
}: {
  isOpen: boolean;
  sources: DatabaseSource[] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (source: DatabaseSource) => void;
}) {
  const queryClient = useQueryClient();

  const resyncMutation = useMutation({
    mutationFn: resyncDatabaseSource,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: databaseSourcesQueryKey });
    },
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/35 px-6 py-10 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-outline-variant/30 bg-surface-container-lowest shadow-[0_35px_90px_-24px_rgba(27,28,28,0.28)]">
        <div className="flex items-start justify-between gap-6 border-b border-outline-variant/15 px-8 py-6">
          <div className="space-y-2">
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              New Chat
            </p>
            <div>
              <h3 className="font-headline text-3xl italic text-primary">
                Choose a database source
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface/65">
                Start this conversation against one of your saved connections. Only
                Vanna-ready sources can power a new chat.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-outline-variant/20 p-2 text-on-surface/60 transition-colors hover:bg-surface-container-low hover:text-primary"
            aria-label="Close database source picker"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-8 py-6">
          {isLoading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-outline-variant/20 bg-surface-container-low">
              <LoaderCircle size={24} className="animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold text-on-surface">Loading your sources</p>
                <p className="mt-1 text-sm text-on-surface/60">
                  Pulling the latest saved database connections from the backend.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-[28px] border border-rose-200/70 bg-rose-50/70 px-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertCircle size={22} />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-rose-900">Unable to load database sources</p>
                <p className="text-sm leading-relaxed text-rose-800/80">
                  {error.message}
                </p>
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-full bg-rose-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : !sources?.length ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-outline-variant/20 bg-surface-container-low px-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-primary">
                <Database size={22} />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-on-surface">No database sources found</p>
                <p className="text-sm leading-relaxed text-on-surface/60">
                  Add a saved connection first, then come back here to start a chat.
                </p>
              </div>
              <Link
                href="/onboarding/database"
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90"
              >
                Add Source
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-on-surface/50">
                <span>
                  {sources.length} saved {sources.length === 1 ? "source" : "sources"}
                </span>
                {isRefreshing ? (
                  <span className="inline-flex items-center gap-2 font-medium text-primary">
                    <LoaderCircle size={14} className="animate-spin" />
                    Refreshing
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3">
                {sources.map((source) => {
                  const isResyncing =
                    resyncMutation.isPending && resyncMutation.variables === source.id;
                  const canSelect = source.canStartChat;
                  const canResync = source.status !== "SYNCING" && !isResyncing;

                  return (
                    <div
                      key={source.id}
                      role={canSelect ? "button" : undefined}
                      tabIndex={canSelect ? 0 : undefined}
                      onClick={canSelect ? () => onSelect(source) : undefined}
                      onKeyDown={
                        canSelect
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") onSelect(source);
                            }
                          : undefined
                      }
                      className={`w-full rounded-[24px] border px-5 py-4 text-left transition-all ${
                        canSelect
                          ? "cursor-pointer border-outline-variant/20 bg-white hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_40px_-24px_rgba(112,87,49,0.45)]"
                          : "border-outline-variant/15 bg-surface-container-low opacity-70"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-container/60 text-primary">
                            <DatabaseLogo provider={source.provider} className="h-6 w-6" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="font-semibold text-on-surface">{source.label}</p>
                              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface/40">
                                {source.provider}
                              </span>
                            </div>
                            <p className="text-sm text-on-surface/55">
                              {formatTimestamp(source.lastTestedAt)}
                            </p>
                            {!source.canStartChat && !source.lastError ? (
                              <p className="text-sm leading-relaxed text-on-surface/60">
                                This source is still syncing its schema into the Python
                                agent.
                              </p>
                            ) : null}
                            {source.lastError ? (
                              <p className="text-sm leading-relaxed text-rose-700/85">
                                {source.lastError}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 flex-col items-end gap-2">
                          <DatabaseSourceStatusBadge status={source.status} />
                          <button
                            type="button"
                            disabled={!canResync}
                            onClick={(e) => {
                              e.stopPropagation();
                              resyncMutation.mutate(source.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface/60 transition-colors hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Re-sync schema with the Python agent"
                          >
                            <RefreshCw
                              size={11}
                              className={isResyncing ? "animate-spin" : undefined}
                            />
                            {isResyncing ? "Syncing…" : "Re-sync"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
