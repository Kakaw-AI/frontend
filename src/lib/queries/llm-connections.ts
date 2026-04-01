import { mutationOptions, queryOptions } from "@tanstack/react-query";

export type LlmProvider =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "google"
  | "github-copilot";

export type LlmConnectionStatus = "PENDING" | "SUCCESS" | "FAILED";

export type LlmConnectionResponse = {
  id: string;
  provider: LlmProvider;
  status: LlmConnectionStatus;
  displayName: string;
  defaultModel: string;
  apiKeyLastFour: string | null;
  usesLinkedAccount: boolean;
  linkedProviderId: string | null;
  lastError: string | null;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LlmConnection = {
  id: string;
  provider: LlmProvider;
  label: string;
  defaultModel: string;
  status: LlmConnectionStatus;
  canStartChat: boolean;
  usesLinkedAccount: boolean;
  linkedProviderId: string | null;
  apiKeyLastFour: string | null;
  lastError: string | null;
  lastTestedAt: string | null;
  createdAt: string;
};

export type SaveLlmConnectionInput = {
  provider: LlmProvider;
  defaultModel: string;
  displayName?: string;
  apiKey?: string;
  baseUrl?: string;
};

export const LLM_PROVIDER_OPTIONS: Array<{
  value: LlmProvider;
  label: string;
  helper: string;
  defaultModel: string;
}> = [
  {
    value: "openai",
    label: "OpenAI",
    helper: "Bring your OpenAI API key and default model.",
    defaultModel: "gpt-4o",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    helper: "Bring your Anthropic API key and Claude model.",
    defaultModel: "claude-3-7-sonnet-latest",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    helper: "Use your OpenRouter key with any model slug you prefer.",
    defaultModel: "openai/gpt-4o-mini",
  },
  {
    value: "google",
    label: "Google",
    helper: "Connect Gemini through your Google AI Studio key.",
    defaultModel: "gemini-2.5-pro",
  },
  {
    value: "github-copilot",
    label: "GitHub Copilot",
    helper: "Uses your linked GitHub account. Requires an active Copilot subscription.",
    defaultModel: "claude-sonnet-4-6",
  },
];

export const llmConnectionsQueryKey = ["llm-connections"] as const;

export function toLlmConnection(
  connection: LlmConnectionResponse,
): LlmConnection {
  return {
    id: connection.id,
    provider: connection.provider,
    label: connection.displayName,
    defaultModel: connection.defaultModel,
    status: connection.status,
    canStartChat: connection.status === "SUCCESS",
    usesLinkedAccount: connection.usesLinkedAccount,
    linkedProviderId: connection.linkedProviderId,
    apiKeyLastFour: connection.apiKeyLastFour,
    lastError: connection.lastError,
    lastTestedAt: connection.lastTestedAt,
    createdAt: connection.createdAt,
  };
}

async function readErrorMessage(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | null;
  const message = Array.isArray(data?.message)
    ? data.message.join(", ")
    : data?.message;

  return message ?? fallback;
}

async function fetchLlmConnections(): Promise<LlmConnection[]> {
  const response = await fetch("/api/me/llm-connections", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to load LLM connections."));
  }

  const data = (await response.json()) as LlmConnectionResponse[];
  return data.map(toLlmConnection);
}

async function saveLlmConnection(input: SaveLlmConnectionInput) {
  const response = await fetch("/api/llm-connections", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to save your LLM connection."));
  }

  const data = (await response.json()) as LlmConnectionResponse;
  return toLlmConnection(data);
}

export async function linkGithubAccount(callbackURL: string) {
  const response = await fetch("/api/auth/link-social", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      provider: "github",
      callbackURL,
      errorCallbackURL: callbackURL,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to link your GitHub account."));
  }

  const data = (await response.json().catch(() => null)) as
    | { url?: string; redirect?: boolean }
    | null;

  if (!data?.url) {
    throw new Error("GitHub linking did not return an authorization URL.");
  }

  window.location.assign(data.url);
}

export function llmConnectionsQueryOptions() {
  return queryOptions({
    queryKey: llmConnectionsQueryKey,
    queryFn: fetchLlmConnections,
    retry: false,
  });
}

export function saveLlmConnectionMutationOptions() {
  return mutationOptions({
    mutationFn: saveLlmConnection,
  });
}
