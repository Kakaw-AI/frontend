import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { readApiErrorResponse } from "@/lib/api-error";
import {
  type DatabaseConnectionResponse,
  type DatabaseSource,
  toDatabaseSource,
} from "@/lib/queries/database-sources";
import {
  type LlmConnection,
  type LlmConnectionResponse,
  toLlmConnection,
} from "@/lib/queries/llm-connections";

type ChatOptionsResponse = {
  databaseSources: DatabaseConnectionResponse[];
  llmConnections: LlmConnectionResponse[];
};

export type ChatOptions = {
  databaseSources: DatabaseSource[];
  llmConnections: LlmConnection[];
};

export const chatOptionsQueryKey = ["me", "chat-options"] as const;

async function fetchChatOptions(): Promise<ChatOptions> {
  const response = await apiFetch("/api/me/chat-options", {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await readApiErrorResponse(response, "Unable to load chat options.");
    throw new Error(error.message);
  }

  const data = (await response.json()) as ChatOptionsResponse;

  return {
    databaseSources: data.databaseSources.map(toDatabaseSource),
    llmConnections: data.llmConnections.map(toLlmConnection),
  };
}

export function chatOptionsQueryOptions() {
  return queryOptions({
    queryKey: chatOptionsQueryKey,
    queryFn: fetchChatOptions,
    retry: false,
  });
}
