import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { normalizeApiErrorPayload, readApiErrorResponse } from "@/lib/api-error";
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
  // Whether the failure is transient (rate limit / timeout / upstream 5xx).
  // Only populated from a live stream's message_failed event; absent after a
  // page reload, in which case the UI falls back to a neutral retry affordance.
  errorRetryable?: boolean | null;
  analyticsOutcome?:
    | "failed"
    | "no_rows"
    | "narrowed"
    | "chart_rendered"
    | "completed_text"
    | null;
  visualizationOutcome?: Record<string, unknown> | null;
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

type ConversationResponse = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  databaseSourceId: string;
  llmConnectionId: string | null;
  llmModelOverride: string | null;
  databaseSource: DatabaseConnectionResponse;
  llmConnection: LlmConnectionResponse | null;
  runtime: ConversationRuntime;
};

type ConversationDetailsResponse = ConversationResponse & {
  messages: ConversationMessage[];
};

export type ConversationRuntime = {
  effectiveModel: string | null;
  isMissing: boolean;
  isActive: boolean;
  isAvailableForChat: boolean;
  warning: string | null;
};

export type ConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  databaseSourceId: string;
  llmConnectionId: string | null;
  llmModelOverride: string | null;
  databaseSource: DatabaseSource;
  llmConnection: LlmConnection | null;
  runtime: ConversationRuntime;
};

export type ConversationDetails = ConversationSummary & {
  messages: ConversationMessage[];
};

type CreateConversationInput = {
  databaseSourceId: string;
  llmConnectionId: string;
  title?: string;
};

type UpdateConversationRuntimeInput = {
  llmConnectionId: string;
  llmModelOverride: string | null;
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
    llmModelOverride: conversation.llmModelOverride,
    databaseSource: toDatabaseSource(conversation.databaseSource),
    llmConnection: conversation.llmConnection
      ? toLlmConnection(conversation.llmConnection)
      : null,
    runtime: conversation.runtime,
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
  const error = await readApiErrorResponse(response, fallback);
  return error.message;
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

async function updateConversationRuntime(
  conversationId: string,
  input: UpdateConversationRuntimeInput,
): Promise<ConversationDetails> {
  const response = await fetch(`/api/chat/conversations/${conversationId}/runtime`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Unable to update conversation runtime."),
    );
  }

  const data = (await response.json()) as ConversationDetailsResponse;
  return toConversationDetails(data);
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

  await consumeChatStream(response, onEvent);
}

export async function retryConversationMessage(
  conversationId: string,
  messageId: string,
  onEvent: (event: Record<string, unknown>) => void,
) {
  const response = await fetch(
    `/api/chat/conversations/${conversationId}/messages/${messageId}/retry`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    },
  );

  await consumeChatStream(response, onEvent);
}

async function consumeChatStream(
  response: Response,
  onEvent: (event: Record<string, unknown>) => void,
) {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to stream chat response."));
  }

  if (!response.body) {
    throw new Error("Chat stream did not return a response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawTerminalEvent = false;

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

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(line) as Record<string, unknown>;
      } catch {
        throw new Error("Chat stream returned invalid event data.");
      }
      if (
        parsed.type === "message_completed" ||
        parsed.type === "message_failed"
      ) {
        sawTerminalEvent = true;
      }
      onEvent(parsed);
    }
  }

  const lastLine = buffer.trim();
  if (lastLine) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(lastLine) as Record<string, unknown>;
    } catch {
      throw new Error("Chat stream returned invalid event data.");
    }
    if (
      parsed.type === "message_completed" ||
      parsed.type === "message_failed"
    ) {
      sawTerminalEvent = true;
    }
    onEvent(parsed);
  }

  if (!sawTerminalEvent) {
    const error = normalizeApiErrorPayload(
      null,
      "Chat stream disconnected before the assistant finished responding.",
    );
    throw new Error(error.message);
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
    // A refetch while a response is streaming would replace the live optimistic
    // messages (held only in the client cache until persisted) with a stale
    // server snapshot — wiping streamed content when the tab regains focus.
    // Updates are driven explicitly via invalidate after each send/retry.
    refetchOnWindowFocus: false,
  });
}

export function createConversationMutationOptions() {
  return mutationOptions({
    mutationFn: createConversation,
  });
}

async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`/api/chat/conversations/${conversationId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to delete conversation."));
  }
}

export function deleteConversationMutationOptions() {
  return mutationOptions({
    mutationFn: deleteConversation,
  });
}

export function updateConversationRuntimeMutationOptions() {
  return mutationOptions({
    mutationFn: ({
      conversationId,
      input,
    }: {
      conversationId: string;
      input: UpdateConversationRuntimeInput;
    }) => updateConversationRuntime(conversationId, input),
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
    lastSyncedAt: conversation.databaseSource.lastSyncedAt,
    syncRequestedAt: conversation.databaseSource.syncRequestedAt,
    createdAt: conversation.databaseSource.createdAt,
    updatedAt: conversation.updatedAt,
  });

  return `${sourceLabel} · ${
    conversation.runtime.effectiveModel ?? "Unavailable LLM runtime"
  }`;
}
