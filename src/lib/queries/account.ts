import { apiFetch } from "@/lib/api";
import { readApiErrorResponse } from "@/lib/api-error";

/**
 * Permanently deletes the signed-in account and everything it owns:
 * conversations, data sources and their stored credentials, uploaded files and
 * saved LLM keys. The session ends with it.
 */
export async function deleteAccount(): Promise<void> {
  const response = await apiFetch("/api/me", { method: "DELETE" });

  if (!response.ok) {
    const error = await readApiErrorResponse(
      response,
      "Unable to delete your account.",
    );
    throw new Error(error.message);
  }
}

export type ModelUsage = {
  model: string;
  runs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type AccountUsage = {
  memberSince: string;
  counts: {
    conversations: number;
    questions: number;
    databases: number;
    uploads: number;
    apiKeys: number;
  };
  tokens: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    last30Days: number;
    runs: number;
  };
  /** Sorted by total tokens, largest first. */
  models: ModelUsage[];
};

export const accountUsageQueryKey = ["account", "usage"] as const;

export async function fetchAccountUsage(): Promise<AccountUsage> {
  const response = await apiFetch("/api/me/usage");
  if (!response.ok) {
    const error = await readApiErrorResponse(response, "Unable to load your usage.");
    throw new Error(error.message);
  }
  return (await response.json()) as AccountUsage;
}
