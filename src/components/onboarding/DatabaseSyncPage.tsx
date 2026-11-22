"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, LoaderCircle, RefreshCw } from "lucide-react";
import { TextShimmer } from "@/components/amicro/text-shimmer";
import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import { formatTimestamp } from "@/components/chat/picker/picker-utils";
import { chatOptionsQueryOptions } from "@/lib/queries/chat-options";
import { onboardingStateQueryOptions } from "@/lib/queries/onboarding";
import { resyncDatabaseSource, type DatabaseSourceStatus } from "@/lib/queries/database-sources";

const pollWhileIndexing = (status: DatabaseSourceStatus | undefined) =>
  status === "PENDING" || status === "SYNCING" ? 2000 : false;

/**
 * Shows indexing progress for one source. With `sourceId` (set right after a
 * connect or upload) it follows that source even when the user already has
 * other ready databases; without it, it follows the first-connection blockingSync.
 */
export function DatabaseSyncPage({ sourceId }: { sourceId: string | null }) {
  const router = useRouter();
  const onboardingStateQuery = useQuery({
    ...onboardingStateQueryOptions(),
    enabled: !sourceId,
    refetchInterval: (query) => pollWhileIndexing(query.state.data?.blockingSync?.status),
  });
  const sourcesQuery = useQuery({
    ...chatOptionsQueryOptions(),
    enabled: Boolean(sourceId),
    refetchInterval: (query) =>
      pollWhileIndexing(query.state.data?.databaseSources.find((s) => s.id === sourceId)?.status),
  });

  const blockingSync = sourceId
    ? (sourcesQuery.data?.databaseSources.find((s) => s.id === sourceId) ?? null)
    : (onboardingStateQuery.data?.blockingSync ?? null);
  const isFailed = blockingSync?.status === "FAILED";
  const retryMutation = useMutation({
    mutationFn: resyncDatabaseSource,
    onSuccess: async () => {
      await (sourceId ? sourcesQuery.refetch() : onboardingStateQuery.refetch());
    },
  });

  useEffect(() => {
    // Cached data from before this source existed must not count as "not found".
    const loaded = sourceId ? sourcesQuery.isFetchedAfterMount : Boolean(onboardingStateQuery.data);
    if (!loaded) return;
    const done = sourceId
      ? blockingSync?.status === "READY"
      : onboardingStateQuery.data?.hasDatabaseSource;
    if (done) {
      router.replace("/chat");
      router.refresh();
    } else if (!blockingSync) {
      router.replace("/onboarding/database");
      router.refresh();
    }
  }, [blockingSync, sourceId, sourcesQuery.isFetchedAfterMount, onboardingStateQuery.data, router]);

  return (
    <>
      <h1 className="font-headline text-3xl text-on-surface sm:text-4xl">
        {isFailed ? "Indexing stopped" : "Reading your schema"}
      </h1>
      <p className="mt-3 text-on-surface-variant">
        {isFailed
          ? "The connection works, but Kakaw couldn't finish reading the schema."
          : "Kakaw is indexing your tables, columns and sample rows. You'll go to chat as soon as it's done."}
      </p>

      <section
        className="pod-card mt-8 space-y-4 rounded-lg p-5 md:p-6"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-bold text-on-surface">
              {blockingSync?.label ?? "Your database"}
            </p>
            {blockingSync?.syncRequestedAt ? (
              <p className="mt-1 text-xs text-on-surface-variant">
                Started{" "}
                {formatTimestamp(blockingSync.syncRequestedAt, "just now")}
              </p>
            ) : null}
          </div>
          <DatabaseSourceStatusBadge
            status={blockingSync?.status ?? "SYNCING"}
          />
        </div>

        {isFailed ? (
          blockingSync?.lastError ? (
            <p className="pod-alert" role="alert">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
              {blockingSync.lastError}
            </p>
          ) : null
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-surface-container px-4 py-3 text-sm text-on-surface">
            <LoaderCircle
              size={16}
              className="animate-spin motion-reduce:animate-none"
              aria-hidden
            />
            <TextShimmer>This usually takes under a minute.</TextShimmer>
          </p>
        )}

        {retryMutation.isError ? (
          <p className="pod-alert" role="alert">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {retryMutation.error instanceof Error
              ? retryMutation.error.message
              : "Unable to restart indexing."}
          </p>
        ) : null}
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/onboarding/database" className="pod-btn-ghost">
          <ArrowLeft size={16} aria-hidden />
          Use a different database
        </Link>
        {isFailed ? (
          <button
            type="button"
            onClick={() =>
              blockingSync && retryMutation.mutate(blockingSync.id)
            }
            disabled={retryMutation.isPending}
            className="pod-btn"
          >
            <RefreshCw
              size={16}
              className={retryMutation.isPending ? "animate-spin" : undefined}
              aria-hidden
            />
            {retryMutation.isPending ? "Retrying…" : "Try again"}
          </button>
        ) : null}
      </div>
    </>
  );
}
