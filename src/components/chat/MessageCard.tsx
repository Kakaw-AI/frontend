import { FadeUp } from "@/components/amicro/fade-up";
import { ArtifactView } from "@/components/chat/ArtifactView";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import { StepLog } from "@/components/chat/StepLog";
import {
  formatConversationTime,
  getVisibleArtifacts,
  getVisibleAssistantContent,
  isNumericColumn,
} from "@/components/chat/chat-formatting";
import type { DatabaseProvider } from "@/components/onboarding/DatabaseLogo";
import type { ConversationMessage } from "@/lib/queries/conversations";
import { AlertTriangle, ChartColumn, Globe, RefreshCw } from "lucide-react";
import { memo, useMemo, useState } from "react";

/** Short on purpose: the agent reads it as "chart the previous result". */
const VISUALIZE_PROMPT = "Visualize that result";

/** A table with at least two rows and a number column, and no chart yet. */
function canBeCharted(message: ConversationMessage): boolean {
  if (message.role !== "assistant" || message.status !== "COMPLETED" || message.error) return false;
  if (message.artifacts.some((artifact) => artifact.type === "CHART")) return false;
  return message.artifacts.some((artifact) => {
    if (artifact.type !== "TABLE") return false;
    const { columns = [], rows = [] } = artifact.payload as {
      columns?: string[];
      rows?: Array<Record<string, unknown>>;
    };
    return rows.length >= 2 && columns.some((column) => isNumericColumn(rows, column));
  });
}

function VisualizeButton({ isBusy, onClick }: { isBusy: boolean; onClick: () => void }) {
  const [requested, setRequested] = useState(false);
  return (
    <button
      type="button"
      disabled={requested || isBusy}
      onClick={() => {
        setRequested(true);
        onClick();
      }}
      className="kk-link"
    >
      <ChartColumn size={13} className="kk-link-icon kk-link-icon-chart" aria-hidden />
      <span className="kk-link-text">{requested ? "Visualization requested" : "Make visualization"}</span>
    </button>
  );
}

// Memoized because the answer now streams: without this, every token re-renders
// every message in the conversation, including their charts and tables.
export const MessageCard = memo(function MessageCard({
  message,
  isLastAssistantMessage,
  isBusy,
  provider,
  collapsedTableIds = "",
  isLatestAnswer = false,
  onSuggestionClick,
  onRetry,
  onVisualize,
}: {
  message: ConversationMessage;
  isLastAssistantMessage: boolean;
  isBusy: boolean;
  /** The database the conversation runs on: decides how a query is shown. */
  provider: DatabaseProvider;
  /** Comma-separated ids of tables that repeat an earlier answer's rows. */
  collapsedTableIds?: string;
  /** The newest completed answer; "Visualize that result" refers to it. */
  isLatestAnswer?: boolean;
  onSuggestionClick: (text: string) => void;
  onRetry: (messageId: string) => void;
  onVisualize: (text: string) => void;
}) {
  const isUser = message.role === "user";
  const usedWebSearch = useMemo(
    () =>
      message.artifacts.some(
        (artifact) =>
          artifact.type === "TEXT" &&
          (artifact.payload as { kind?: string }).kind === "web_sources",
      ),
    [message.artifacts],
  );
  const displayContent = useMemo(
    () =>
      message.role === "assistant"
        ? getVisibleAssistantContent(message)
        : message.content,
    [message],
  );
  // Allocates and sorts a new array; without memoization it ran on every render
  // of every message.
  const visibleArtifacts = useMemo(
    () => getVisibleArtifacts(message),
    [message],
  );
  const showVisualize = useMemo(
    () => isLatestAnswer && canBeCharted(message),
    [isLatestAnswer, message],
  );
  const visualizeButton = showVisualize ? (
    <VisualizeButton isBusy={isBusy} onClick={() => onVisualize(VISUALIZE_PROMPT)} />
  ) : null;
  const firstSqlId = visibleArtifacts.find((artifact) => artifact.type === "SQL")?.id;

  return (
    <FadeUp
      yOffset={8}
      duration={0.35}
      className={
        isUser
          ? "ml-auto w-fit max-w-full md:max-w-xl"
          : "mr-auto w-full max-w-full"
      }
    >
      {/* The user's question is a soft bubble; Kakaw's answer sits on the page
          so its charts and tables are the only boxes, never boxes in a box. */}
      <div
        className={
          isUser
            ? "rounded-2xl rounded-br-sm bg-accent px-3.5 py-2 text-on-surface"
            : "space-y-3 text-on-surface"
        }
      >
        {/* A reply loaded from the server mid-stream has no steps yet; still show the spinner. */}
        {(message.steps != null || message.status === "STREAMING") &&
        !message.error ? (
          <StepLog message={message} />
        ) : null}
        {displayContent ? <MarkdownMessage content={displayContent} /> : null}
        {message.error ? (
          <div className="space-y-2 rounded-lg border border-secondary/30 bg-secondary-container px-3 py-2 text-sm text-on-secondary-container">
            <div className="flex items-start gap-2 wrap-break-word">
              <AlertTriangle size={14} className="mt-1 shrink-0" />
              <span>Error: {message.error}</span>
            </div>
            {message.role === "assistant" ? (
              <div className="flex items-center gap-2 pl-6">
                <button
                  type="button"
                  onClick={() => onRetry(message.id)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-secondary/40 bg-surface-container-lowest px-2 py-0.5 text-xs font-medium transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
                {message.errorRetryable ? (
                  <span className="text-xs opacity-80">
                    Temporary issue, retrying may help.
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {visibleArtifacts.map((artifact) => (
          <ArtifactView
            key={artifact.id}
            artifact={artifact}
            provider={provider}
            collapsed={collapsedTableIds.split(",").includes(artifact.id)}
            sqlActions={artifact.id === firstSqlId ? visualizeButton : null}
          />
        ))}
        {/* No query artifact to sit beside: the button gets its own row. */}
        {visualizeButton && !firstSqlId ? <div>{visualizeButton}</div> : null}
      </div>

      {!isUser &&
      isLastAssistantMessage &&
      message.status === "COMPLETED" &&
      message.suggestions?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {message.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-md border border-border bg-surface-container-lowest px-2.5 py-1 text-xs text-on-surface transition-colors hover:bg-accent"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <p
        className={`mt-1 flex flex-wrap items-center gap-x-1 text-[11px] text-on-surface-variant ${isUser ? "justify-end px-1" : ""}`}
      >
        <span>{formatConversationTime(message.createdAt)}</span>
        {!isUser && message.status === "COMPLETED" && message.tokenUsage ? (
          <span>· {message.tokenUsage.totalTokens.toLocaleString()} tokens</span>
        ) : null}
        {!isUser && usedWebSearch ? (
          <span className="kk-web-badge">
            <span aria-hidden>·</span>
            <Globe size={11} className="kk-web-badge-icon" aria-hidden />
            <span className="kk-web-badge-text">Used Web Search</span>
          </span>
        ) : null}
      </p>
    </FadeUp>
  );
});
