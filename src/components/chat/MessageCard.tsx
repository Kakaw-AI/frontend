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

export function MessageCard({
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
  const displayContent =
    message.role === "assistant"
      ? getVisibleAssistantContent(message)
      : message.content;
  const visibleArtifacts = getVisibleArtifacts(message);

  return (
    <div className={isUser ? "ml-auto w-fit max-w-full md:max-w-3xl" : "mr-auto w-fit max-w-full md:max-w-4xl"}>
      <div
        className={
          isUser
            ? "rounded-3xl rounded-br-md bg-primary px-5 py-4 text-on-primary shadow-sm"
            : "space-y-4 rounded-3xl rounded-bl-md border border-outline-variant/15 bg-surface-container-low px-5 py-4 text-on-surface shadow-sm"
        }
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
          {isUser ? "You" : "Kakaw"}
        </p>
        {message.steps !== undefined &&  !message.error ? <StepLog message={message} /> : null}
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
        <p className="mt-1.5 flex items-center gap-1 px-1 text-[11px] text-on-surface/35">
          <span className="font-mono">↳</span>
          {message.tokenUsage.totalTokens.toLocaleString()} tokens
        </p>
      ) : null}

      {!isUser &&
      isLastAssistantMessage &&
      message.status === "COMPLETED" &&
      message.suggestions?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          {message.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs text-primary/80 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <p className="mt-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
        {formatConversationTime(message.createdAt)}
      </p>
    </div>
  );
}
