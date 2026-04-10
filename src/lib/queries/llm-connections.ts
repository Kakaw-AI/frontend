import { mutationOptions } from "@tanstack/react-query";
import { readApiErrorResponse } from "@/lib/api-error";

export type LlmProvider =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "google"
  | "ollama"
  | "lm-studio";

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
  isActive: boolean;
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
  isActive: boolean;
  lastError: string | null;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
    helper: "Bring your OpenAI API key and default model. Supports any OpenAI-compatible endpoint via custom base URL.",
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
    value: "ollama",
    label: "Ollama",
    helper: "Connect to a local or remote Ollama instance.",
    defaultModel: "llama3.1",
  },
  {
    value: "lm-studio",
    label: "LM Studio",
    helper: "Connect to a local or remote LM Studio instance.",
    defaultModel: "local-model",
  },
];

export function toLlmConnection(
  connection: LlmConnectionResponse,
): LlmConnection {
  return {
    id: connection.id,
    provider: connection.provider,
    label: connection.displayName,
    defaultModel: connection.defaultModel,
    status: connection.status,
    canStartChat: connection.isActive && connection.status === "SUCCESS",
    usesLinkedAccount: connection.usesLinkedAccount,
    linkedProviderId: connection.linkedProviderId,
    apiKeyLastFour: connection.apiKeyLastFour,
    isActive: connection.isActive,
    lastError: connection.lastError,
    lastTestedAt: connection.lastTestedAt,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
}

async function readErrorMessage(response: Response, fallback: string) {
  const error = await readApiErrorResponse(response, fallback);
  return error.message;
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

async function activateLlmConnection(connectionId: string) {
  const response = await fetch(`/api/llm-connections/${connectionId}/activate`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Unable to activate this LLM connection."),
    );
  }

  const data = (await response.json()) as LlmConnectionResponse;
  return toLlmConnection(data);
}

async function deactivateLlmConnection(connectionId: string) {
  const response = await fetch(`/api/llm-connections/${connectionId}/deactivate`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Unable to deactivate this LLM connection."),
    );
  }

  const data = (await response.json()) as LlmConnectionResponse;
  return toLlmConnection(data);
}

type DeleteLlmConnectionResult = {
  id: string;
};

async function deleteLlmConnection(
  connectionId: string,
): Promise<DeleteLlmConnectionResult> {
  const response = await fetch(`/api/llm-connections/${connectionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Unable to delete this LLM connection."),
    );
  }

  return (await response.json()) as DeleteLlmConnectionResult;
}

export function saveLlmConnectionMutationOptions() {
  return mutationOptions({
    mutationFn: saveLlmConnection,
  });
}

export function activateLlmConnectionMutationOptions() {
  return mutationOptions({
    mutationFn: activateLlmConnection,
  });
}

export function deactivateLlmConnectionMutationOptions() {
  return mutationOptions({
    mutationFn: deactivateLlmConnection,
  });
}

export function deleteLlmConnectionMutationOptions() {
  return mutationOptions({
    mutationFn: deleteLlmConnection,
  });
}
