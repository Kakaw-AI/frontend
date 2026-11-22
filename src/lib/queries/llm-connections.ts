import { mutationOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
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
  /** Reuse the key saved on this connection; the key itself never comes to the browser. */
  reuseKeyFromConnectionId?: string;
};

export type ListProviderModelsInput = Omit<SaveLlmConnectionInput, "defaultModel" | "displayName">;

/** The chat models the provider offers for this key, newest first where known. */
export async function listProviderModels(input: ListProviderModelsInput, signal?: AbortSignal): Promise<string[]> {
  const response = await apiFetch("/api/llm-connections/models", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to load the model list."));
  }
  const data = (await response.json()) as { models?: unknown };
  return Array.isArray(data.models) ? data.models.filter((model): model is string => typeof model === "string") : [];
}

export type LlmProviderFamily = "openai" | "google" | "anthropic";

/** OpenRouter, Ollama and LM Studio all speak the OpenAI API. */
export function providerFamily(provider: LlmProvider): LlmProviderFamily {
  return provider === "google" || provider === "anthropic" ? provider : "openai";
}

/** The three choices in the "add a model" picker. */
export const LLM_PROVIDER_FAMILIES: Array<{
  value: LlmProviderFamily;
  label: string;
  helper: string;
}> = [
  {
    value: "openai",
    label: "OpenAI-compatible",
    helper: "ChatGPT, OpenRouter, Ollama, LM Studio, or any endpoint that speaks the OpenAI API.",
  },
  {
    value: "google",
    label: "Google",
    helper: "Gemini through your Google AI Studio key.",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    helper: "Claude through your Anthropic API key.",
  },
];

/**
 * Each stored provider. The agent treats them differently (Ollama and LM Studio
 * get local-model timeouts, OpenRouter its own base URL), so the picker still
 * records which OpenAI-compatible service it is.
 */
export const LLM_PROVIDER_OPTIONS: Array<{
  value: LlmProvider;
  label: string;
  defaultModel: string;
}> = [
  // Each lab's balanced current model (checked 2026-11-22): fast enough for the
  // several calls a turn makes, strong enough for SQL.
  { value: "openai", label: "OpenAI", defaultModel: "gpt-6.2-sol" },
  { value: "openrouter", label: "OpenRouter", defaultModel: "openai/gpt-6.2-sol" },
  { value: "ollama", label: "Ollama", defaultModel: "gpt-oss:20b" },
  { value: "lm-studio", label: "LM Studio", defaultModel: "local-model" },
  { value: "google", label: "Google", defaultModel: "gemini-4-hydrogen" },
  { value: "anthropic", label: "Anthropic", defaultModel: "claude-sonnet-5-5" },
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

async function saveLlmConnection(input: SaveLlmConnectionInput) {
  const response = await apiFetch("/api/llm-connections", {
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
  const response = await apiFetch(`/api/llm-connections/${connectionId}/activate`, {
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
  const response = await apiFetch(`/api/llm-connections/${connectionId}/deactivate`, {
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
  const response = await apiFetch(`/api/llm-connections/${connectionId}`, {
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
