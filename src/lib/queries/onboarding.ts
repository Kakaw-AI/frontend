import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { readApiErrorResponse } from "@/lib/api-error";

type OnboardingState = {
  isFirstConnection?: boolean;
  hasDatabaseSource?: boolean;
  connectionCount?: number;
  hasLlmConnection?: boolean;
  llmConnectionCount?: number;
  blockingSync?: {
    id: string;
    label: string;
    provider: "postgresql" | "sqlite";
    status: "PENDING" | "SYNCING" | "READY" | "FAILED";
    lastError: string | null;
    lastTestedAt: string | null;
    lastSyncedAt: string | null;
    syncRequestedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

type SaveDatabaseSourceInput =
  | {
      provider: "sqlite";
      file?: File;
      name?: string;
    }
  | {
      provider: "postgresql";
      connectionString: string;
      name?: string;
    };

export const onboardingStateQueryKey = ["me", "onboarding-state"] as const;

async function fetchOnboardingState(): Promise<OnboardingState> {
  const response = await fetch("/api/me/onboarding-state", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load onboarding state.");
  }

  return (await response.json()) as OnboardingState;
}

type DatabaseSourceRecord = {
  id: string;
  provider: "postgresql" | "sqlite";
  name: string | null;
  status: "PENDING" | "SYNCING" | "READY" | "FAILED";
  sqliteOriginalFilename: string | null;
  lastError: string | null;
  lastTestedAt: string | null;
  lastSyncedAt: string | null;
  syncRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

async function registerDatabaseSource(
  body: Record<string, unknown>,
): Promise<DatabaseSourceRecord> {
  const response = await fetch("/api/database-sources", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await readApiErrorResponse(
      response,
      "Unable to save your database source.",
    );
    throw new Error(error.message);
  }

  return (await response.json()) as DatabaseSourceRecord;
}

async function uploadSqliteToStorage(file: File): Promise<string> {
  const contentType = file.type || "application/octet-stream";

  // 1) Ask our backend for a short-lived presigned PUT URL.
  const presignResponse = await fetch("/api/database-sources/uploads/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename: file.name, size: file.size, contentType }),
  });

  if (!presignResponse.ok) {
    const error = await readApiErrorResponse(
      presignResponse,
      "Unable to prepare the upload.",
    );
    throw new Error(error.message);
  }

  const { uploadUrl, objectKey } = (await presignResponse.json()) as {
    uploadUrl: string;
    objectKey: string;
  };

  // 2) Upload the file directly to R2 — it never passes through our server.
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload the database file to storage.");
  }

  return objectKey;
}

async function saveDatabaseSource(input: SaveDatabaseSourceInput) {
  const name = input.name?.trim() || undefined;

  if (input.provider === "sqlite") {
    if (!input.file) {
      throw new Error("Upload a SQLite database file before continuing.");
    }

    const objectKey = await uploadSqliteToStorage(input.file);

    return registerDatabaseSource({
      provider: "sqlite",
      objectKey,
      originalFilename: input.file.name,
      name,
    });
  }

  const connectionString = input.connectionString.trim();
  if (!connectionString) {
    throw new Error("Enter a connection string before continuing.");
  }

  return registerDatabaseSource({
    provider: "postgresql",
    connectionString,
    name,
  });
}

export function onboardingStateQueryOptions() {
  return queryOptions({
    queryKey: onboardingStateQueryKey,
    queryFn: fetchOnboardingState,
    retry: false,
  });
}

export function saveDatabaseSourceMutationOptions() {
  return mutationOptions({
    mutationFn: saveDatabaseSource,
  });
}
