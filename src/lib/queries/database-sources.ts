import { readApiErrorResponse } from "@/lib/api-error";
import type { DatabaseProvider } from "@/components/onboarding/DatabaseLogo";

export type DatabaseSourceStatus = "PENDING" | "SYNCING" | "READY" | "FAILED";

export type DatabaseConnectionResponse = {
  id: string;
  provider: DatabaseProvider;
  name: string | null;
  status: DatabaseSourceStatus;
  sqliteOriginalFilename: string | null;
  lastError: string | null;
  lastTestedAt: string | null;
  lastSyncedAt: string | null;
  syncRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DatabaseSource = {
  id: string;
  provider: DatabaseProvider;
  label: string;
  status: DatabaseSourceStatus;
  canStartChat: boolean;
  createdAt: string;
  lastTestedAt: string | null;
  lastSyncedAt: string | null;
  syncRequestedAt: string | null;
  lastError: string | null;
};


function toTitleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolveDatabaseSourceLabel(source: DatabaseConnectionResponse) {
  const explicitName = source.name?.trim();
  if (explicitName) {
    return explicitName;
  }

  if (source.provider === "sqlite") {
    return source.sqliteOriginalFilename?.trim() || "SQLite upload";
  }

  if (source.provider === "postgresql") {
    return "PostgreSQL connection";
  }

  return `${toTitleCase(source.provider)} connection`;
}

export function toDatabaseSource(source: DatabaseConnectionResponse): DatabaseSource {
  return {
    id: source.id,
    provider: source.provider,
    label: resolveDatabaseSourceLabel(source),
    status: source.status,
    canStartChat: source.status === "READY",
    createdAt: source.createdAt,
    lastTestedAt: source.lastTestedAt,
    lastSyncedAt: source.lastSyncedAt,
    syncRequestedAt: source.syncRequestedAt,
    lastError: source.lastError,
  };
}

async function fetchDatabaseSources(): Promise<DatabaseSource[]> {
  const response = await fetch("/api/me/connections", {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await readApiErrorResponse(
      response,
      "Unable to load database sources.",
    );
    throw new Error(error.message);
  }

  const data = (await response.json()) as DatabaseConnectionResponse[];

  return data.map(toDatabaseSource);
}

export async function resyncDatabaseSource(id: string): Promise<void> {
  const response = await fetch(`/api/database-sources/${id}/refresh`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await readApiErrorResponse(response, "Failed to trigger re-sync.");
    throw new Error(error.message);
  }
}
