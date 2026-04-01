import { mutationOptions, queryOptions } from "@tanstack/react-query";

export type OnboardingState = {
  isFirstConnection?: boolean;
  hasDatabaseSource?: boolean;
  connectionCount?: number;
  hasLlmConnection?: boolean;
  llmConnectionCount?: number;
};

export type SaveDatabaseSourceInput =
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
    const data = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message;

    throw new Error(message ?? "Unable to save your database source.");
  }

  return response;
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
