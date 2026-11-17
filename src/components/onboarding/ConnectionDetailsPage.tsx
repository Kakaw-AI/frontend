"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, FileArchive, LoaderCircle, Lock, Upload } from "lucide-react";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import { useConnectionDetailsState } from "@/components/onboarding/useConnectionDetailsState";
import {
  onboardingStateQueryKey,
  saveDatabaseSourceMutationOptions,
} from "@/lib/queries/onboarding";

const SQLITE_EXTENSIONS = [".db", ".sqlite", ".sqlite3"];

export function ConnectionDetailsPage({ initialProvider }: { initialProvider: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { provider, connString, sqliteFile, name, setConnString, setSqliteFile, setName } =
    useConnectionDetailsState(initialProvider);
  const [isDragging, setIsDragging] = useState(false);
  const isSqlite = provider === "sqlite";
  const providerLabel = isSqlite ? "SQLite" : "PostgreSQL";

  const connectDatabase = useMutation({
    ...saveDatabaseSourceMutationOptions(),
    onSuccess: (source) => {
      queryClient.setQueryData(onboardingStateQueryKey, {
        isFirstConnection: false,
        hasDatabaseSource: source.status === "READY",
        blockingSync:
          source.status === "READY"
            ? null
            : {
                id: source.id,
                label:
                  source.name?.trim() ||
                  (source.provider === "sqlite"
                    ? source.sqliteOriginalFilename?.trim() || "SQLite upload"
                    : "PostgreSQL connection"),
                provider: source.provider,
                status: source.status,
                lastError: source.lastError,
                lastTestedAt: source.lastTestedAt,
                lastSyncedAt: source.lastSyncedAt,
                syncRequestedAt: source.syncRequestedAt,
                createdAt: source.createdAt,
                updatedAt: source.updatedAt,
              },
      });
      router.replace(source.status === "READY" ? "/chat" : `/onboarding/sync?sourceId=${encodeURIComponent(source.id)}`);
      router.refresh();
    },
  });

  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      if (!connectDatabase.isPending) connectDatabase.reset();
      setter(value);
    };
  }
  const editFile = edit(setSqliteFile);

  function pickFile(file: File | undefined) {
    if (!file) return;
    editFile(file);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim() || undefined;
    connectDatabase.mutate(
      isSqlite
        ? { provider: "sqlite", file: sqliteFile ?? undefined, name: trimmedName }
        : { provider, connectionString: connString, name: trimmedName },
    );
  }

  const canSubmit = !connectDatabase.isPending && (isSqlite ? sqliteFile !== null : Boolean(connString.trim()));
  const errorMessage = connectDatabase.isError
    ? connectDatabase.error instanceof Error
      ? connectDatabase.error.message
      : `Unable to save your ${providerLabel} connection.`
    : null;

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-container">
          <DatabaseLogo provider={provider} className="h-7 w-7" />
        </span>
        <h1 className="font-headline text-3xl text-on-surface sm:text-4xl">Connect {providerLabel}</h1>
      </div>
      <p className="mt-3 text-on-surface-variant">
        {isSqlite
          ? "Upload your database file. Kakaw checks it, then reads the schema."
          : "Kakaw tests the connection before it saves anything."}
      </p>

      <form onSubmit={handleSubmit} className="pod-card mt-8 space-y-6 rounded-lg p-5 md:p-6" aria-describedby={errorMessage ? "connect-error" : undefined}>
        {isSqlite ? (
          <div>
            <label htmlFor="sqlite-file" className="text-sm font-bold text-on-surface">Database file</label>
            <label
              htmlFor="sqlite-file"
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                pickFile(event.dataTransfer.files[0]);
              }}
              className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors has-[:focus-visible]:border-border ${
                isDragging ? "border-border bg-accent" : "border-primary/30 bg-surface-container-low hover:border-border hover:bg-surface-container"
              }`}
            >
              {sqliteFile ? (
                <>
                  <FileArchive size={24} className="text-primary" aria-hidden />
                  <span className="font-bold text-on-surface">{sqliteFile.name}</span>
                  <span className="text-xs text-on-surface-variant">
                    {(sqliteFile.size / 1024 / 1024).toFixed(2)} MB · click or drop to replace
                  </span>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-primary" aria-hidden />
                  <span className="font-bold text-on-surface">Drop a file here, or click to choose</span>
                  <span className="text-xs text-on-surface-variant">{SQLITE_EXTENSIONS.join(", ")}</span>
                </>
              )}
              <input
                id="sqlite-file"
                name="file"
                type="file"
                accept={SQLITE_EXTENSIONS.join(",")}
                className="sr-only"
                onChange={(event) => pickFile(event.target.files?.[0])}
              />
            </label>
            <p className="mt-2 text-xs text-on-surface-variant">
              Kakaw keeps a copy of this file to run your queries. Upload a copy you&apos;re fine storing.
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="connection-string" className="text-sm font-bold text-on-surface">Connection URL</label>
            <textarea
              id="connection-string"
              name="connectionString"
              rows={3}
              required
              value={connString}
              onChange={(event) => edit(setConnString)(event.target.value)}
              placeholder="postgresql://user:password@host:5432/database"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="connection-string-help"
              className="pod-input mt-2 resize-y font-mono text-sm"
            />
            <p id="connection-string-help" className="mt-2 text-xs text-on-surface-variant">
              Copy it from your provider&apos;s dashboard. The database must accept connections from the internet;
              local and private addresses won&apos;t work.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="connection-name" className="text-sm font-bold text-on-surface">
            Name <span className="font-normal text-on-surface-variant">(optional)</span>
          </label>
          <input
            id="connection-name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => edit(setName)(event.target.value)}
            placeholder={isSqlite ? "e.g. Sales export" : "e.g. Analytics replica"}
            autoComplete="off"
            className="pod-input mt-2"
          />
        </div>

        <div role="alert" aria-live="assertive">
          {errorMessage ? (
            <p id="connect-error" className="pod-alert">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-primary/10 pt-5">
          <Link href="/onboarding/database" className="pod-btn-ghost">
            <ArrowLeft size={16} aria-hidden />
            Back
          </Link>
          <button type="submit" disabled={!canSubmit} className="pod-btn">
            {connectDatabase.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
            {connectDatabase.isPending
              ? isSqlite
                ? "Uploading…"
                : "Testing connection…"
              : isSqlite
                ? "Upload and connect"
                : "Test and connect"}
          </button>
        </div>
      </form>

      <p className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
        <Lock size={14} aria-hidden />
        Credentials are encrypted at rest. <Link href={`/docs#${provider}`} target="_blank" rel="noopener noreferrer" className="font-bold text-on-surface underline underline-offset-2">Setup guide</Link>
      </p>
    </>
  );
}
