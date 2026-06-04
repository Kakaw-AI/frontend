"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  FileArchive,
  Lightbulb,
  PlugZap,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import { useConnectionDetailsState } from "@/components/onboarding/useConnectionDetailsState";
import {
  onboardingStateQueryKey,
  saveDatabaseSourceMutationOptions,
} from "@/lib/queries/onboarding";

const PROVIDER_LABELS: Record<string, string> = {
  postgresql: "PostgreSQL",
  sqlite: "SQLite",
  mysql: "MySQL",
  bigquery: "BigQuery",
  snowflake: "Snowflake",
  mongodb: "MongoDB",
  other: "Custom Source",
};

const PROVIDER_PLACEHOLDERS: Record<string, string> = {
  postgresql: "postgresql://user:password@host:5432/database",
};

export function ConnectionDetailsPage({
  initialProvider,
}: {
  initialProvider: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    provider,
    connString,
    sqliteFile,
    name,
    setConnString,
    setSqliteFile,
    setName,
  } = useConnectionDetailsState(initialProvider);
  const providerLabel = PROVIDER_LABELS[provider] ?? "Database";
  const connectionPlaceholder =
    PROVIDER_PLACEHOLDERS[provider] ??
    `${provider}://user:password@host:port/database`;
  const isSqlite = provider === "sqlite";
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
      if (source.status === "READY") {
        router.replace("/dashboard");
      } else {
        router.replace(`/onboarding/sync?sourceId=${encodeURIComponent(source.id)}`);
      }
      router.refresh();
    },
  });
  const isSubmitDisabled =
    connectDatabase.isPending ||
    (isSqlite ? sqliteFile === null : !connString.trim());

  async function handleConnect() {
    try {
      const trimmedName = name.trim() || undefined;
      if (isSqlite) {
        await connectDatabase.mutateAsync({
          provider: "sqlite",
          file: sqliteFile ?? undefined,
          name: trimmedName,
        });
        return;
      }

      await connectDatabase.mutateAsync({
        provider,
        connectionString: connString,
        name: trimmedName,
      });
    } catch {}
  }

  return (
    <div className="flex-1 p-12 max-w-5xl">
      <header className="mb-16">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-widest uppercase">
          Step 02
        </span>
        <h1 className="text-5xl font-headline italic text-on-surface mb-6">
          Connect {providerLabel}
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          We&apos;ll test and save your {providerLabel} connection so Kakaw can
          route you straight into the dashboard next time you sign in.
        </p>
      </header>

      <section className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-8 space-y-12">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_40px_60px_-15px_rgba(27,28,28,0.04)] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

            <div className="mb-6">
              <label
                htmlFor="connection-name"
                className="block text-sm font-label font-semibold text-on-surface uppercase tracking-wider"
              >
                Connection name <span className="text-on-surface-variant normal-case">(optional)</span>
              </label>
              <p className="mt-2 text-sm text-on-surface-variant">
                A friendly name to tell this connection apart from your others
                {isSqlite ? "" : ` (e.g. "Prod replica", "Analytics DB")`}.
              </p>
              <input
                id="connection-name"
                type="text"
                value={name}
                onChange={(event) => {
                  if (!connectDatabase.isPending) {
                    connectDatabase.reset();
                  }
                  setName(event.target.value);
                }}
                placeholder={isSqlite ? "My SQLite database" : "My PostgreSQL database"}
                className="mt-3 block w-full rounded-lg border-0 py-3 px-5 text-on-surface bg-surface-container-lowest text-sm shadow-sm ring-1 ring-inset ring-outline-variant/15 placeholder:text-outline/40 focus:ring-2 focus:ring-inset focus:ring-primary/40 transition-all duration-300"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor={isSqlite ? "sqlite-file" : "connection-string"}
                className="block text-sm font-label font-semibold text-on-surface uppercase tracking-wider"
              >
                {isSqlite ? "Drop your SQLite file" : "Paste your connection URL"}
              </label>
              <p className="mt-2 text-sm text-on-surface-variant">
                {isSqlite
                  ? "Grab a .db, .sqlite, or .sqlite3 file and drop it in — Kakaw will sniff it and verify before saving."
                  : "Copy it straight from your provider dashboard and drop it here. Kakaw will test it before saving anything."}
              </p>
            </div>

            <div className="relative">
              {isSqlite ? (
                <div className="space-y-4">
                  <label
                    htmlFor="sqlite-file"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-low px-6 py-10 text-center transition-colors hover:border-primary/40 hover:bg-surface-container"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-primary">
                      <Upload size={22} />
                    </div>
                    <p className="text-sm font-semibold text-on-surface">
                      Choose a SQLite file to upload
                    </p>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Accepted formats: <code>.db</code>, <code>.sqlite</code>,{" "}
                      <code>.sqlite3</code>
                    </p>
                    <input
                      id="sqlite-file"
                      type="file"
                      accept=".db,.sqlite,.sqlite3"
                      className="sr-only"
                      onChange={(event) => {
                        if (!connectDatabase.isPending) {
                          connectDatabase.reset();
                        }
                        setSqliteFile(event.target.files?.[0] ?? null);
                      }}
                    />
                  </label>

                  <div className="rounded-lg border border-outline-variant/15 bg-surface-container-low p-4">
                    {sqliteFile ? (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-primary">
                          <FileArchive size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {sqliteFile.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {(sqliteFile.size / 1024 / 1024).toFixed(2)} MB selected
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant">
                        No file selected yet.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <textarea
                  id="connection-string"
                  rows={5}
                  value={connString}
                  onChange={(event) => {
                    if (!connectDatabase.isPending) {
                      connectDatabase.reset();
                    }
                    setConnString(event.target.value);
                  }}
                  placeholder={connectionPlaceholder}
                  className="block w-full rounded-lg border-0 py-4 px-5 text-on-surface bg-surface-container-lowest font-mono text-sm shadow-sm ring-1 ring-inset ring-outline-variant/15 placeholder:text-outline/40 focus:ring-2 focus:ring-inset focus:ring-primary/40 transition-all duration-300 resize-none"
                />
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isSubmitDisabled}
                  className="text-primary font-label text-sm font-medium hover:underline flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                >
                  <Zap size={18} />
                  {connectDatabase.isPending
                    ? `Testing ${providerLabel}…`
                    : isSqlite
                      ? "Upload & Connect SQLite"
                      : "Connect PostgreSQL"}
                </button>
                <Link
                  href={`/onboarding/database?provider=${encodeURIComponent(provider)}`}
                  className="text-on-surface-variant px-8 py-3 rounded-lg font-label font-medium hover:bg-surface-container-low transition-all"
                >
                  Back
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-8 border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center py-16">
            {connectDatabase.isIdle && (
              <>
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                  <PlugZap size={22} className="text-on-surface-variant opacity-40" />
                </div>
                <p className="text-on-surface-variant font-label text-sm italic">
                  Connection status will appear here after we test your {providerLabel} source
                </p>
              </>
            )}
            {connectDatabase.isPending && (
              <p className="text-on-surface-variant font-label text-sm italic animate-pulse">
                Testing and saving your {providerLabel} connection…
              </p>
            )}
            {connectDatabase.isSuccess && (
              <>
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-4">
                  <CheckCircle size={22} className="text-primary" />
                </div>
                <p className="text-primary font-label text-sm font-semibold">
                  {providerLabel} connection saved
                </p>
              </>
            )}
            {connectDatabase.isError && (
              <>
                <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mb-4">
                  <AlertCircle size={22} className="text-error" />
                </div>
                <p className="text-error font-label text-sm font-semibold">
                  {connectDatabase.error instanceof Error
                    ? connectDatabase.error.message
                    : `Unable to save your ${providerLabel} connection.`}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <h3 className="font-headline text-xl italic text-primary">
              Need Help?
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Lightbulb size={22} className="text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-1">
                    {isSqlite ? "Upload Format" : "Standard Format"}
                  </p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {isSqlite ? (
                      <>
                        SQLite uploads must be a real database file with one of
                        the supported extensions. We’ll validate the file before
                        the connection is saved.
                      </>
                    ) : (
                      <>
                        Most {providerLabel} strings follow:{" "}
                        <code className="bg-surface-container px-1 py-0.5 rounded font-mono break-all">
                          protocol://user:password@host:port/db
                        </code>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Shield size={22} className="text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-1">
                    {isSqlite ? "Server Storage" : "IP Whitelisting"}
                  </p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {isSqlite
                      ? "Your uploaded SQLite file is stored on the server for now, so use a copy that’s safe to keep in the workspace."
                      : "Ensure you whitelist our static egress IPs in your firewall settings."}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-outline-variant/10">
              <Link
                href={`/docs#${provider}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-label text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all"
              >
                VIEW DOCUMENTATION
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/15 shadow-sm">
            <Shield size={14} className="text-primary shrink-0" />
            <span className="text-[11px] font-label font-semibold text-on-surface-variant uppercase tracking-widest">
              AES-256 Encryption at Rest
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
