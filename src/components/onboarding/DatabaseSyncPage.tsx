"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import {
  onboardingStateQueryKey,
  onboardingStateQueryOptions,
} from "@/lib/queries/onboarding";
import { resyncDatabaseSource } from "@/lib/queries/database-sources";

function formatRelativeTime(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function DatabaseSyncPage() {
  const router = useRouter();
  const onboardingStateQuery = useQuery({
    ...onboardingStateQueryOptions(),
    refetchInterval(query) {
      const state = query.state.data;
      return state?.blockingSync?.status === "SYNCING" ? 2000 : false;
    },
  });

  const blockingSync = onboardingStateQuery.data?.blockingSync ?? null;
  const retryMutation = useMutation({
    mutationFn: resyncDatabaseSource,
    onSuccess: async () => {
      await onboardingStateQuery.refetch();
    },
  });

  useEffect(() => {
    if (onboardingStateQuery.data?.hasDatabaseSource) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    if (!blockingSync && onboardingStateQuery.data && !onboardingStateQuery.data.hasDatabaseSource) {
      router.replace("/onboarding/database");
      router.refresh();
    }
  }, [blockingSync, onboardingStateQuery.data, router]);

  const statusCopy = useMemo(() => {
    if (!blockingSync) {
      return {
        title: "Checking sync status",
        body: "We’re looking up the current sync state for your database connection.",
      };
    }

    if (blockingSync.status === "FAILED") {
      return {
        title: "Sync needs attention",
        body:
          "We verified the connection, but Kakaw could not finish indexing the schema for chat yet.",
      };
    }

    return {
      title: "Syncing your database",
      body:
        "Stay on this screen while Kakaw indexes your schema and sample context. We’ll send you to the dashboard as soon as the database is ready.",
    };
  }, [blockingSync]);

  return (
    <main className="flex flex-1 items-center justify-center bg-surface px-8 py-16">
      <div className="w-full max-w-3xl rounded-[32px] border border-outline-variant/20 bg-surface-container-lowest p-10 shadow-[0_35px_90px_-24px_rgba(27,28,28,0.22)]">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/75">
              Database Setup
            </p>
            <h1 className="font-headline text-4xl italic text-primary">
              {statusCopy.title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-on-surface/70">
              {statusCopy.body}
            </p>
          </div>

          <div className="rounded-[24px] border border-outline-variant/15 bg-surface p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-on-surface">
                  {blockingSync?.label ?? "Selected database"}
                </p>
                <p className="text-sm text-on-surface/60">
                  {blockingSync?.status === "FAILED"
                    ? "The sync stopped before the database became ready for chat."
                    : "Kakaw is currently preparing this source for chat."}
                </p>
                {blockingSync?.syncRequestedAt ? (
                  <p className="text-xs uppercase tracking-[0.18em] text-on-surface/40">
                    Sync requested {formatRelativeTime(blockingSync.syncRequestedAt)}
                  </p>
                ) : null}
              </div>
              <DatabaseSourceStatusBadge status={blockingSync?.status ?? "SYNCING"} />
            </div>

            {blockingSync?.status === "FAILED" && blockingSync.lastError ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{blockingSync.lastError}</p>
                </div>
              </div>
            ) : null}

            {blockingSync?.status !== "FAILED" ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-3 text-sm text-on-surface/65">
                <LoaderCircle size={18} className="animate-spin text-primary" />
                <span>Indexing tables, columns, and sample data for more reliable answers.</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {blockingSync?.status === "FAILED" ? (
              <button
                type="button"
                onClick={() => {
                  if (blockingSync?.id) {
                    retryMutation.mutate(blockingSync.id);
                  }
                }}
                disabled={retryMutation.isPending || !blockingSync?.id}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} className={retryMutation.isPending ? "animate-spin" : undefined} />
                {retryMutation.isPending ? "Retrying sync..." : "Retry sync"}
              </button>
            ) : null}

            <Link
              href="/onboarding/database"
              className="inline-flex items-center rounded-full border border-outline-variant/20 px-5 py-2.5 text-sm font-medium text-on-surface/70 transition-colors hover:border-primary/25 hover:text-primary"
            >
              Back to database setup
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
