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
    }
  | {
      provider: "postgresql";
      connectionString: string;
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

async function saveDatabaseSource(input: SaveDatabaseSourceInput) {
  const formData = new FormData();
  formData.append("provider", input.provider);

  if (input.provider === "sqlite") {
    if (!input.file) {
      throw new Error("Upload a SQLite database file before continuing.");
    }

    formData.append("file", input.file);
  } else {
    const connectionString = input.connectionString.trim();

    if (!connectionString) {
      throw new Error("Enter a connection string before continuing.");
    }

    formData.append("connectionString", connectionString);
  }

  const response = await fetch("/api/database-sources", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await readApiErrorResponse(
      response,
      "Unable to save your database source.",
    );
    throw new Error(error.message);
  }

  return (await response.json()) as {
    id: string;
    provider: "postgresql" | "sqlite";
    status: "PENDING" | "SYNCING" | "READY" | "FAILED";
    sqliteOriginalFilename: string | null;
    lastError: string | null;
    lastTestedAt: string | null;
    lastSyncedAt: string | null;
    syncRequestedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
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
