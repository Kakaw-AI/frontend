import { queryOptions } from "@tanstack/react-query";
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
  githubLinked: boolean;
};

export type ChatOptions = {
  databaseSources: DatabaseSource[];
  llmConnections: LlmConnection[];
  githubLinked: boolean;
};

export const chatOptionsQueryKey = ["me", "chat-options"] as const;

async function fetchChatOptions(): Promise<ChatOptions> {
  const response = await fetch("/api/me/chat-options", {
    cache: "no-store",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message;

    throw new Error(message ?? "Unable to load chat options.");
  }

  const data = (await response.json()) as ChatOptionsResponse;

  return {
    databaseSources: data.databaseSources.map(toDatabaseSource),
    llmConnections: data.llmConnections.map(toLlmConnection),
    githubLinked: data.githubLinked,
  };
}

export function chatOptionsQueryOptions() {
  return queryOptions({
    queryKey: chatOptionsQueryKey,
    queryFn: fetchChatOptions,
    retry: false,
  });
}
