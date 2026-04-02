import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  resolveDatabaseSourceLabel,
  type DatabaseConnectionResponse,
  type DatabaseSource,
  toDatabaseSource,
} from "@/lib/queries/database-sources";
import {
  type LlmConnection,
  type LlmConnectionResponse,
  toLlmConnection,
} from "@/lib/queries/llm-connections";

export type MessageArtifactType = "TEXT" | "SQL" | "TABLE" | "CHART" | "ERROR";
export type MessageStatus = "PENDING" | "STREAMING" | "COMPLETED" | "FAILED";
export type MessageRole = "user" | "assistant" | "system";

export type MessageArtifact = {
  id: string;
  type: MessageArtifactType;
  payload: unknown;
  createdAt: string;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ConversationMessage = {
  id: string;
  role: MessageRole;
  status: MessageStatus;
  content: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  artifacts: MessageArtifact[];
  tokenUsage: TokenUsage | null;
  suggestions: string[];
  steps?: Array<{ seq: number; text: string; done: boolean }>;
  stepsCollapsed?: boolean;
  stepsStartedAt?: number | null;
  stepsElapsedMs?: number | null;
};

export type ConversationResponse = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  databaseSourceId: string;
  llmConnectionId: string;
  databaseSource: DatabaseConnectionResponse;
  llmConnection: LlmConnectionResponse;
};

export type ConversationDetailsResponse = ConversationResponse & {
  messages: ConversationMessage[];
};

export type ConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  databaseSourceId: string;
  llmConnectionId: string;
  databaseSource: DatabaseSource;
  llmConnection: LlmConnection;
};

export type ConversationDetails = ConversationSummary & {
  messages: ConversationMessage[];
};

export type CreateConversationInput = {
  databaseSourceId: string;
  llmConnectionId: string;
  title?: string;
};

export const conversationsQueryKey = ["chat", "conversations"] as const;

export function conversationDetailsQueryKey(conversationId: string) {
  return ["chat", "conversations", conversationId] as const;
}

function toConversationSummary(
  conversation: ConversationResponse,
): ConversationSummary {
  return {
    id: conversation.id,
    title: conversation.title,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    databaseSourceId: conversation.databaseSourceId,
    llmConnectionId: conversation.llmConnectionId,
    databaseSource: toDatabaseSource(conversation.databaseSource),
    llmConnection: toLlmConnection(conversation.llmConnection),
  };
}

function toConversationDetails(
  conversation: ConversationDetailsResponse,
): ConversationDetails {
  return {
    ...toConversationSummary(conversation),
    messages: conversation.messages,
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

async function fetchConversations(): Promise<ConversationSummary[]> {
  const response = await fetch("/api/chat/conversations", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to load conversations."));
  }

  const data = (await response.json()) as ConversationResponse[];
  return data.map(toConversationSummary);
}

async function fetchConversation(conversationId: string): Promise<ConversationDetails> {
  const response = await fetch(`/api/chat/conversations/${conversationId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to load conversation."));
  }

  const data = (await response.json()) as ConversationDetailsResponse;
  return toConversationDetails(data);
}

async function createConversation(
  input: CreateConversationInput,
): Promise<ConversationSummary> {
  const response = await fetch("/api/chat/conversations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to create conversation."));
  }

  const data = (await response.json()) as ConversationResponse;
  return toConversationSummary(data);
}

export async function streamConversationMessage(
  conversationId: string,
  content: string,
  onEvent: (event: Record<string, unknown>) => void,
) {
  const response = await fetch(`/api/chat/conversations/${conversationId}/messages/stream`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to stream chat response."));
  }

  if (!response.body) {
    throw new Error("Chat stream did not return a response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex === -1) {
        break;
      }

      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) {
        continue;
      }

      const parsed = JSON.parse(line) as Record<string, unknown>;
      onEvent(parsed);
    }
  }

  const lastLine = buffer.trim();
  if (lastLine) {
    onEvent(JSON.parse(lastLine) as Record<string, unknown>);
  }
}

export function conversationsQueryOptions() {
  return queryOptions({
    queryKey: conversationsQueryKey,
    queryFn: fetchConversations,
    retry: false,
  });
}

export function conversationDetailsQueryOptions(conversationId: string) {
  return queryOptions({
    queryKey: conversationDetailsQueryKey(conversationId),
    queryFn: () => fetchConversation(conversationId),
    enabled: Boolean(conversationId),
    retry: false,
  });
}

export function createConversationMutationOptions() {
  return mutationOptions({
    mutationFn: createConversation,
  });
}

export function describeConversationRuntime(conversation: ConversationSummary) {
  const sourceLabel = resolveDatabaseSourceLabel({
    id: conversation.databaseSource.id,
    provider: conversation.databaseSource.provider,
    status: conversation.databaseSource.status,
    sqliteOriginalFilename:
      conversation.databaseSource.provider === "sqlite"
        ? conversation.databaseSource.label
        : null,
    lastError: conversation.databaseSource.lastError,
    lastTestedAt: conversation.databaseSource.lastTestedAt,
    createdAt: conversation.databaseSource.createdAt,
    updatedAt: conversation.updatedAt,
  });

  return `${sourceLabel} · ${conversation.llmConnection.defaultModel}`;
}
