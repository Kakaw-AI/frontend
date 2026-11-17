import { ArtifactView } from "@/components/chat/ArtifactView";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import { StepLog } from "@/components/chat/StepLog";
import {
  formatConversationTime,
  getVisibleArtifacts,
  getVisibleAssistantContent,
} from "@/components/chat/chat-formatting";
import type { ConversationMessage } from "@/lib/queries/conversations";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { memo, useMemo } from "react";

// Memoized because the answer now streams: without this, every token re-renders
// every message in the conversation, including their charts and tables.
export const MessageCard = memo(function MessageCard({
  message,
  isLastAssistantMessage,
  isBusy,
  onSuggestionClick,
  onRetry,
}: {
  message: ConversationMessage;
  isLastAssistantMessage: boolean;
  isBusy: boolean;
  onSuggestionClick: (text: string) => void;
  onRetry: (messageId: string) => void;
}) {
  const isUser = message.role === "user";
  const displayContent = useMemo(
    () =>
      message.role === "assistant"
        ? getVisibleAssistantContent(message)
        : message.content,
    [message],
  );
  // Allocates and sorts a new array; without memoization it ran on every render
  // of every message.
  const visibleArtifacts = useMemo(() => getVisibleArtifacts(message), [message]);

  return (
    <div className={isUser ? "ml-auto w-fit max-w-full md:max-w-2xl" : "mr-auto w-full max-w-full md:max-w-4xl"}>
      {/* The user's question is a bubble; Kakaw's answer sits on the page
          so its charts and tables are the only boxes, never boxes in a box. */}
      <div
        className={
          isUser
            ? "rounded-lg rounded-br-md bg-primary px-5 py-3 font-medium text-on-primary"
            : "space-y-4 text-on-surface"
        }
      >
        {/* A reply loaded from the server mid-stream has no steps yet; still show the spinner. */}
        {(message.steps != null || message.status === "STREAMING") && !message.error ? <StepLog message={message} /> : null}
        {displayContent ? <MarkdownMessage content={displayContent} /> : null}
        {message.error ? (
          <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <div className="flex items-start gap-2 wrap-break-word">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />
              <span>{message.error}</span>
            </div>
            {message.role === "assistant" ? (
              <div className="flex items-center gap-2 pl-6">
                <button
                  type="button"
                  onClick={() => onRetry(message.id)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white/60 px-3 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
                {message.errorRetryable ? (
                  <span className="text-xs text-rose-500/80">
                    Temporary issue — retrying may help.
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {visibleArtifacts.map((artifact) => (
          <ArtifactView key={artifact.id} artifact={artifact} />
        ))}
      </div>
      {!isUser && message.status === "COMPLETED" && message.tokenUsage ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-on-surface-variant">
          <span className="font-mono">↳</span>
          {message.tokenUsage.totalTokens.toLocaleString()} tokens
        </p>
      ) : null}

      {!isUser &&
      isLastAssistantMessage &&
      message.status === "COMPLETED" &&
      message.suggestions?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-[8px] border border-border bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface transition-colors hover:bg-accent"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <p className={`mt-1.5 text-xs text-on-surface-variant ${isUser ? "px-2 text-right" : ""}`}>
        {formatConversationTime(message.createdAt)}
      </p>
    </div>
  );
});
