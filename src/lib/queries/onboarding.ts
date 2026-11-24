import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
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
    provider: "postgresql" | "mongodb" | "sqlite";
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
      /** Upload progress, 0 to 1. */
      onProgress?: (fraction: number) => void;
    }
  | {
      provider: "postgresql" | "mongodb";
      connectionString: string;
      name?: string;
    };

export const onboardingStateQueryKey = ["me", "onboarding-state"] as const;

async function fetchOnboardingState(): Promise<OnboardingState> {
  const response = await apiFetch("/api/me/onboarding-state", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load onboarding state.");
  }

  return (await response.json()) as OnboardingState;
}

type DatabaseSourceRecord = {
  id: string;
  provider: "postgresql" | "mongodb" | "sqlite";
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
  const response = await apiFetch("/api/database-sources", {
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

async function uploadSqliteToStorage(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const contentType = file.type || "application/octet-stream";

  // 1) Ask our backend for a short-lived presigned PUT URL.
  const presignResponse = await apiFetch("/api/database-sources/uploads/presign", {
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
  // XHR, not fetch: fetch has no upload progress events.
  const uploaded = await new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("content-type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });

  if (!uploaded) {
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

    const objectKey = await uploadSqliteToStorage(input.file, input.onProgress);
    input.onProgress?.(1);

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
    provider: input.provider,
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
