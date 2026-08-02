import type {
  ConversationDetails,
  ConversationMessage,
  TokenUsage,
} from "@/lib/queries/conversations";
import { sanitizeAssistantMessageContent } from "@/components/chat/chat-formatting";
import { shouldCollapseCompletedSteps } from "@/components/chat/step-log-state";
import { normalizeApiErrorPayload } from "@/lib/api-error";

function readAnalyticsOutcome(
  value: unknown,
): ConversationMessage["analyticsOutcome"] {
  return value === "failed" ||
    value === "no_rows" ||
    value === "narrowed" ||
    value === "chart_rendered" ||
    value === "completed_text"
    ? value
    : null;
}

export function createOptimisticUserMessage(content: string): ConversationMessage {
  const now = new Date().toISOString();

  return {
    id: `user-${now}`,
    role: "user",
    status: "COMPLETED",
    content,
    error: null,
    createdAt: now,
    updatedAt: now,
    artifacts: [],
    tokenUsage: null,
    suggestions: [],
  };
}

/**
 * Resolves which message a stream event applies to. Events that carry a
 * `messageId` (message_started/completed/failed, suggestions) target that exact
 * message — this is what makes retrying an *older* failed message land on the
 * right bubble. Content events without an id (delta, agent_step, sql/chart)
 * target the single message that is currently STREAMING, falling back to the
 * last assistant message.
 */
function resolveTargetIndex(
  messages: ConversationMessage[],
  data: Record<string, unknown>,
): number {
  if (typeof data.messageId === "string") {
    const byId = messages.findIndex((message) => message.id === data.messageId);
    if (byId !== -1) {
      return byId;
    }
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "assistant" && messages[i].status === "STREAMING") {
      return i;
    }
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "assistant") {
      return i;
    }
  }

  return -1;
}

export function applyStreamEvent(
  conversation: ConversationDetails | undefined,
  event: Record<string, unknown>,
): ConversationDetails | undefined {
  if (!conversation) {
    return conversation;
  }

  const type = typeof event.type === "string" ? event.type : "";
  const data =
    event.data && typeof event.data === "object"
      ? (event.data as Record<string, unknown>)
      : {};

  if (type === "message_started") {
    const messageId =
      typeof data.messageId === "string" ? data.messageId : `assistant-${Date.now()}`;
    const exists = conversation.messages.some((message) => message.id === messageId);
    if (exists) {
      return conversation;
    }

    const now = new Date().toISOString();
    return {
      ...conversation,
      messages: [
        ...conversation.messages,
        {
          id: messageId,
          role: "assistant",
          status: "STREAMING",
          content: "",
          error: null,
          createdAt: now,
          updatedAt: now,
          artifacts: [],
          steps: [],
          stepsCollapsed: false,
          stepsStartedAt: null,
          stepsElapsedMs: null,
          tokenUsage: null,
          suggestions: [],
        },
      ],
    };
  }

  const targetIndex = resolveTargetIndex(conversation.messages, data);

  if (targetIndex === -1) {
    return conversation;
  }

  const updatedMessages = [...conversation.messages];
  const target = updatedMessages[targetIndex];

  switch (type) {
    case "trace_persisted": {
      const traceId = typeof data.traceId === "string" ? data.traceId : null;
      if (!traceId) return conversation;
      updatedMessages[targetIndex] = { ...target, traceId };
      return { ...conversation, messages: updatedMessages };
    }
    case "agent_step": {
      const text = typeof data.text === "string" ? data.text : "";
      if (!text) return conversation;
      const prev = target.steps ?? [];
      const updated = prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, done: true } : s,
      );
      updated.push({ seq: prev.length, text, done: false });
      updatedMessages[targetIndex] = {
        ...target,
        steps: updated,
        stepsStartedAt: target.stepsStartedAt ?? Date.now(),
      };
      return { ...conversation, messages: updatedMessages };
    }
    case "message_delta": {
      const delta = typeof data.delta === "string" ? data.delta : "";
      updatedMessages[targetIndex] = {
        ...target,
        status: "STREAMING",
        content: sanitizeAssistantMessageContent(`${target.content}${delta}`),
        updatedAt: new Date().toISOString(),
      };
      return { ...conversation, messages: updatedMessages };
    }
    case "sql_generated": {
      updatedMessages[targetIndex] = {
        ...target,
        artifacts: [
          ...target.artifacts,
          {
            id: `artifact-sql-${target.artifacts.length}`,
            type: "SQL",
            payload: data,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      return { ...conversation, messages: updatedMessages };
    }
    case "sql_result": {
      updatedMessages[targetIndex] = {
        ...target,
        artifacts: [
          ...target.artifacts,
          {
            id: `artifact-table-${target.artifacts.length}`,
            type: "TABLE",
            payload: data,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      return { ...conversation, messages: updatedMessages };
    }
    case "chart_generated": {
      updatedMessages[targetIndex] = {
        ...target,
        artifacts: [
          ...target.artifacts,
          {
            id: `artifact-chart-${target.artifacts.length}`,
            type: "CHART",
            payload: data,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      return { ...conversation, messages: updatedMessages };
    }
    case "message_completed": {
      const content =
        typeof data.content === "string"
          ? sanitizeAssistantMessageContent(data.content)
          : sanitizeAssistantMessageContent(target.content);
      const prevSteps = target.steps ?? [];
      updatedMessages[targetIndex] = {
        ...target,
        status: "COMPLETED",
        content,
        analyticsOutcome: readAnalyticsOutcome(data.analyticsOutcome),
        updatedAt: new Date().toISOString(),
        steps: prevSteps.map((s) => ({ ...s, done: true })),
        stepsCollapsed: shouldCollapseCompletedSteps("COMPLETED"),
        stepsElapsedMs: target.stepsStartedAt
          ? Date.now() - target.stepsStartedAt
          : null,
        visualizationOutcome:
          data.visualizationOutcome && typeof data.visualizationOutcome === "object"
            ? (data.visualizationOutcome as Record<string, unknown>)
            : null,
        tokenUsage:
          data.tokenUsage && typeof data.tokenUsage === "object"
            ? (data.tokenUsage as TokenUsage)
            : null,
      };
      return { ...conversation, messages: updatedMessages };
    }
    case "message_failed": {
      const normalized = normalizeApiErrorPayload(
        data.errorInfo ?? data.error,
        "Agent execution failed.",
      );
      const error = normalized.message;
      const prevSteps = target.steps ?? [];
      updatedMessages[targetIndex] = {
        ...target,
        status: "FAILED",
        error,
        errorRetryable: normalized.retryable ?? null,
        analyticsOutcome: "failed",
        updatedAt: new Date().toISOString(),
        steps: prevSteps.map((s) => ({ ...s, done: true })),
        stepsCollapsed: shouldCollapseCompletedSteps("FAILED"),
        stepsElapsedMs: target.stepsStartedAt
          ? Date.now() - target.stepsStartedAt
          : null,
      };
      return { ...conversation, messages: updatedMessages };
    }
    case "suggestions_generated": {
      const suggestionsData = data.suggestions;
      if (!Array.isArray(suggestionsData)) return conversation;
      const suggestions = suggestionsData.filter((s): s is string => typeof s === "string");
      updatedMessages[targetIndex] = {
        ...target,
        suggestions,
      };
      return { ...conversation, messages: updatedMessages };
    }
    default:
      return conversation;
  }
}

/**
 * Optimistically resets a failed assistant message back to a fresh streaming
 * state before a retry stream begins, so the same bubble is reused (clearing the
 * error, content, artifacts and step log) rather than appending a new message.
 */
export function applyRetryReset(
  conversation: ConversationDetails | undefined,
  messageId: string,
): ConversationDetails | undefined {
  if (!conversation) {
    return conversation;
  }

  const index = conversation.messages.findIndex((message) => message.id === messageId);
  if (index === -1) {
    return conversation;
  }

  const messages = [...conversation.messages];
  messages[index] = {
    ...messages[index],
    status: "STREAMING",
    content: "",
    error: null,
    errorRetryable: null,
    analyticsOutcome: null,
    visualizationOutcome: null,
    artifacts: [],
    suggestions: [],
    tokenUsage: null,
    steps: [],
    stepsCollapsed: false,
    stepsStartedAt: null,
    stepsElapsedMs: null,
    updatedAt: new Date().toISOString(),
  };

  return { ...conversation, messages };
}
