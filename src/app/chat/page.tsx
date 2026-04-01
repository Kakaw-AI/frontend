"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bird,
  CheckCircle2,
  Database,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { ChatConnectionPicker } from "@/components/chat/ChatConnectionPicker";
import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import { PlotlyChartArtifact } from "@/components/chat/PlotlyChartArtifact";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import { authClient } from "@/lib/auth-client";
import {
  chatOptionsQueryKey,
  chatOptionsQueryOptions,
  type ChatOptions,
} from "@/lib/queries/chat-options";
import {
  conversationDetailsQueryKey,
  conversationDetailsQueryOptions,
  conversationsQueryKey,
  conversationsQueryOptions,
  createConversationMutationOptions,
  streamConversationMessage,
  type ConversationDetails,
  type ConversationMessage,
  type ConversationSummary,
} from "@/lib/queries/conversations";
import {
  linkGithubAccount,
  saveLlmConnectionMutationOptions,
  type SaveLlmConnectionInput,
} from "@/lib/queries/llm-connections";

function formatConversationTime(value: string | null) {
  if (!value) {
    return "New";
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function createOptimisticUserMessage(content: string): ConversationMessage {
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
  };
}

const STREAM_STATUS_PATTERNS = [
  /Processing your request(?:\.{3}|…)/gi,
  /Response complete/gi,
  /^\[chart\]$/gim,
  /TOOLCALL>[\s\S]*$/gi,
  /<TOOLCALL[\s\S]*$/gi,
  /TOOLCALL\[[\s\S]*$/gi,
  /ALL>$/gi,
];

function sanitizeAssistantMessageContent(content: string) {
  let sanitized = content;

  for (const pattern of STREAM_STATUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  return sanitized.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function renderInlineMarkdown(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-strong-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded bg-surface-container-lowest px-1.5 py-0.5 font-mono text-[0.92em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
  });
}

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "paragraph"; text: string };

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let currentList: { type: "unordered-list" | "ordered-list"; items: string[] } | null = null;

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join("\n").trim(),
    });
    paragraphLines = [];
  }

  function flushList() {
    if (!currentList || currentList.items.length === 0) {
      currentList = null;
      return;
    }

    blocks.push(currentList);
    currentList = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "unordered-list") {
        flushList();
        currentList = { type: "unordered-list", items: [] };
      }
      currentList.items.push(unorderedMatch[1].trim());
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ordered-list") {
        flushList();
        currentList = { type: "ordered-list", items: [] };
      }
      currentList.items.push(orderedMatch[1].trim());
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function MarkdownMessage({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, blockIndex) => {
        if (block.type === "heading") {
          const className =
            block.level === 1
              ? "text-xl font-semibold tracking-[-0.02em]"
              : block.level === 2
                ? "text-lg font-semibold tracking-[-0.02em]"
                : "text-base font-semibold";

          return (
            <p key={`block-${blockIndex}`} className={className}>
              {renderInlineMarkdown(block.text, `block-${blockIndex}`)}
            </p>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={`block-${blockIndex}`} className="list-disc space-y-1.5 pl-5">
              {block.items.map((item, lineIndex) => (
                <li key={`block-${blockIndex}-item-${lineIndex}`}>
                  {renderInlineMarkdown(item, `block-${blockIndex}-item-${lineIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={`block-${blockIndex}`} className="list-decimal space-y-1.5 pl-5">
              {block.items.map((item, lineIndex) => (
                <li key={`block-${blockIndex}-item-${lineIndex}`}>
                  {renderInlineMarkdown(item, `block-${blockIndex}-item-${lineIndex}`)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`block-${blockIndex}`} className="whitespace-pre-wrap">
            {renderInlineMarkdown(block.text, `block-${blockIndex}`)}
          </p>
        );
      })}
    </div>
  );
}

function applyStreamEvent(
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
        },
      ],
    };
  }

  const lastAssistantIndex = [...conversation.messages]
    .reverse()
    .findIndex((message) => message.role === "assistant");
  const targetIndex =
    lastAssistantIndex === -1
      ? -1
      : conversation.messages.length - 1 - lastAssistantIndex;

  if (targetIndex === -1) {
    return conversation;
  }

  const updatedMessages = [...conversation.messages];
  const target = updatedMessages[targetIndex];

  switch (type) {
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
        updatedAt: new Date().toISOString(),
        steps: prevSteps.map((s) => ({ ...s, done: true })),
        stepsCollapsed: true,
        stepsElapsedMs: target.stepsStartedAt
          ? Date.now() - target.stepsStartedAt
          : null,
      };
      return { ...conversation, messages: updatedMessages };
    }
    case "message_failed": {
      const error =
        typeof data.error === "string" ? data.error : "Agent execution failed.";
      const prevSteps = target.steps ?? [];
      updatedMessages[targetIndex] = {
        ...target,
        status: "FAILED",
        error,
        updatedAt: new Date().toISOString(),
        steps: prevSteps.map((s) => ({ ...s, done: true })),
        stepsCollapsed: true,
        stepsElapsedMs: target.stepsStartedAt
          ? Date.now() - target.stepsStartedAt
          : null,
      };
      return { ...conversation, messages: updatedMessages };
    }
    default:
      return conversation;
  }
}

function StepLog({ message }: { message: ConversationMessage }) {
  const steps = message.steps ?? [];
  const collapsed = message.stepsCollapsed ?? false;
  const elapsedMs = message.stepsElapsedMs ?? null;
  const [expanded, setExpanded] = useState(false);

  if (collapsed) {
    const elapsedLabel =
      elapsedMs !== null ? ` · ${(elapsedMs / 1000).toFixed(1)}s` : "";
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-on-surface/40 transition hover:text-on-surface/65"
        >
          <CheckCircle2 size={12} className="text-green-500" />
          <span>
            {steps.length} step{steps.length !== 1 ? "s" : ""}
            {elapsedLabel}
          </span>
          <span className="text-[10px]">{expanded ? "▴" : "▾"}</span>
        </button>
        {expanded ? (
          <div className="mt-2 space-y-1">
            {steps.map((step) => (
              <div
                key={step.seq}
                className="flex items-center gap-2 text-xs text-on-surface/35"
              >
                <CheckCircle2 size={11} className="shrink-0 text-green-500" />
                <span>{step.text}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-on-surface/55">
        <LoaderCircle size={16} className="animate-spin" />
        <span>Processing...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step) => (
        <div key={step.seq} className="flex items-center gap-2 text-sm text-on-surface/55">
          {step.done ? (
            <CheckCircle2 size={14} className="shrink-0 text-green-500" />
          ) : (
            <LoaderCircle size={14} className="shrink-0 animate-spin" />
          )}
          <span className={step.done ? "text-on-surface/35" : ""}>
            {step.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function SqlArtifactView({
  artifact,
}: {
  artifact: ConversationMessage["artifacts"][number];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const payload = artifact.payload as { sql?: string };
  const sql = payload.sql?.trim();

  if (!sql) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="text-left text-xs font-medium text-on-surface/40 transition hover:text-on-surface/65"
      >
        {isExpanded ? "Hide SQL executed" : "Show SQL executed"}
      </button>

      {isExpanded ? (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest">
          <pre className="overflow-x-auto px-4 py-4 text-xs leading-relaxed text-on-surface/80">
            <code>{sql}</code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function isNumericColumn(rows: Array<Record<string, unknown>>, column: string): boolean {
  const nonNull = rows.filter((row) => row[column] != null && row[column] !== "");
  if (nonNull.length === 0) return false;
  return nonNull.every((row) => !isNaN(Number(row[column])));
}

function formatArtifactCellValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function escapeCsvField(value: unknown): string {
  const normalized = formatArtifactCellValue(value).replace(/\r\n/g, "\n");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function sanitizeDownloadFilename(value: string, fallback: string, extension: string): string {
  const stem = value
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${stem || fallback}.${extension}`;
}

function downloadTextArtifact(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function buildCsvContent(
  columns: string[],
  rows: Array<Record<string, unknown>>,
): string {
  const lines = [columns.map((column) => escapeCsvField(column)).join(",")];

  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsvField(row[column])).join(","));
  }

  return lines.join("\n");
}

function TableArtifact({
  columns,
  allRows,
  rowCount,
}: {
  columns: string[];
  allRows: Array<Record<string, unknown>>;
  rowCount?: number;
}) {
  const PAGE_SIZE = 100;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const numericColumns = useMemo(
    () => new Set(columns.filter((col) => isNumericColumn(allRows, col))),
    [columns, allRows],
  );

  const sortedRows = useMemo(() => {
    if (!sortColumn) return allRows;
    return [...allRows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum);
      let cmp: number;
      if (isNumeric) {
        cmp = aNum - bNum;
      } else {
        cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [allRows, sortColumn, sortDirection]);

  const visibleRows = sortedRows.slice(0, visibleCount);

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const totalRows = rowCount ?? allRows.length;
  const showingRowsLabel = `${visibleRows.length} of ${totalRows}`;

  function handleDownloadCsv() {
    if (columns.length === 0) {
      return;
    }

    downloadTextArtifact(
      sanitizeDownloadFilename("query-results", "query-results", "csv"),
      buildCsvContent(columns, sortedRows),
      "text/csv;charset=utf-8",
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/10 px-4 py-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/45">
            Query Result{typeof totalRows === "number" ? ` · ${totalRows} rows` : ""}
          </p>
          <p className="mt-1 text-[11px] text-on-surface/45">
            Showing {showingRowsLabel} rows. Scroll horizontally for wide results.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={columns.length === 0}
          className="rounded-full border border-outline-variant/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface/60 transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
        >
          Download CSV
        </button>
      </div>
      <div className="max-h-[34rem] overflow-auto">
        <table
          className="w-max min-w-full border-separate border-spacing-0 text-left"
          style={{ fontSize: "12.5px" }}
        >
          <thead className="sticky top-0 z-10 bg-surface-container-low shadow-[0_1px_0_rgba(0,0,0,0.06)]">
            <tr>
              {columns.map((column) => {
                const isActive = sortColumn === column;
                return (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className={`cursor-pointer select-none whitespace-nowrap border-b border-outline-variant/10 px-4 py-3 font-semibold text-on-surface/55 transition-colors hover:text-on-surface/80 ${numericColumns.has(column) ? "text-right" : "text-left"}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {column}
                      <span
                        className="text-[10px]"
                        style={{ color: isActive ? "#705731" : undefined }}
                      >
                        {isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {visibleRows.map((row, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"}
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className={`max-w-72 min-w-32 border-b border-outline-variant/10 px-4 py-3 align-top text-on-surface/75 ${numericColumns.has(column) ? "text-right font-medium tabular-nums" : "whitespace-pre-wrap break-words"}`}
                  >
                    {formatArtifactCellValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibleCount < sortedRows.length ? (
        <div className="border-t border-outline-variant/10 px-4 py-3 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="rounded-md border border-outline-variant/15 px-4 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/30"
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ArtifactView({ artifact }: { artifact: ConversationMessage["artifacts"][number] }) {
  if (artifact.type === "SQL") {
    return <SqlArtifactView artifact={artifact} />;
  }

  if (artifact.type === "TABLE") {
    const payload = artifact.payload as {
      columns?: string[];
      rows?: Array<Record<string, unknown>>;
      rowCount?: number;
    };
    const columns = payload.columns ?? [];
    const allRows = payload.rows ?? [];

    return <TableArtifact columns={columns} allRows={allRows} rowCount={payload.rowCount} />;
  }

  if (artifact.type === "ERROR") {
    const payload = artifact.payload as { error?: string };
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        {payload.error ?? "Unexpected runtime error."}
      </div>
    );
  }

  if (artifact.type === "CHART") {
    const payload = artifact.payload as {
      chartType?: string;
      title?: string;
      spec?: Record<string, unknown>;
      config?: Record<string, unknown>;
    };

    if (!payload.spec || typeof payload.spec !== "object") {
      return null;
    }

    return (
      <PlotlyChartArtifact
        chartType={payload.chartType}
        title={payload.title}
        spec={payload.spec}
        config={payload.config}
      />
    );
  }

  return null;
}

function MessageCard({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";
  const displayContent =
    message.role === "assistant"
      ? sanitizeAssistantMessageContent(message.content)
      : message.content;

  return (
    <div className={isUser ? "ml-auto max-w-3xl" : "mr-auto max-w-4xl"}>
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
        {message.steps !== undefined ? (
          <StepLog message={message} />
        ) : null}
        {displayContent ? (
          <MarkdownMessage content={displayContent} />
        ) : null}
        {message.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {message.error}
          </div>
        ) : null}
        {message.artifacts.map((artifact) => (
          <ArtifactView key={artifact.id} artifact={artifact} />
        ))}
      </div>
      <p className="mt-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
        {formatConversationTime(message.createdAt)}
      </p>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isConnectionPickerOpen, setIsConnectionPickerOpen] = useState(false);
  const [pickerStartsInAddLlmMode, setPickerStartsInAddLlmMode] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLinkingGithub, setIsLinkingGithub] = useState(false);
  const [githubLinkError, setGithubLinkError] = useState<Error | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const session = authClient.useSession();
  const user = session.data?.user;
  const chatOptionsQuery = useQuery(chatOptionsQueryOptions());
  const conversationsQuery = useQuery(conversationsQueryOptions());
  const activeConversationQuery = useQuery(
    conversationDetailsQueryOptions(activeConversationId ?? ""),
  );

  const createConversationMutation = useMutation({
    ...createConversationMutationOptions(),
    onSuccess(conversation) {
      queryClient.setQueryData<ConversationSummary[] | undefined>(
        conversationsQueryKey,
        (current) => [conversation, ...(current ?? [])],
      );
      setActiveConversationId(conversation.id);
      setIsConnectionPickerOpen(false);
    },
  });

  const createLlmConnectionMutation = useMutation({
    ...saveLlmConnectionMutationOptions(),
    onSuccess(connection) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) =>
          current
            ? {
                ...current,
                llmConnections: [connection, ...current.llmConnections],
              }
            : current,
      );
    },
  });

  useEffect(() => {
    if (!activeConversationId && conversationsQuery.data?.length) {
      setActiveConversationId(conversationsQuery.data[0].id);
    }
  }, [activeConversationId, conversationsQuery.data]);

  const activeConversation = activeConversationQuery.data;
  const githubLinked = chatOptionsQuery.data?.githubLinked ?? false;
  const hasStreamingAssistantMessage = Boolean(
    activeConversation?.messages.some(
      (message) => message.role === "assistant" && message.status === "STREAMING",
    ),
  );
  const isComposerLocked = isSending || hasStreamingAssistantMessage;

  const selectedSource = useMemo(
    () => activeConversation?.databaseSource ?? null,
    [activeConversation],
  );

  const selectedLlmConnection = useMemo(
    () => activeConversation?.llmConnection ?? null,
    [activeConversation],
  );

  function handleOpenConnectionPicker() {
    setComposerError(null);
    setGithubLinkError(null);
    setPickerStartsInAddLlmMode(false);
    setIsConnectionPickerOpen(true);
    void chatOptionsQuery.refetch();
  }

  function handleOpenAddLlmPicker() {
    setComposerError(null);
    setGithubLinkError(null);
    setPickerStartsInAddLlmMode(true);
    setIsConnectionPickerOpen(true);
    void chatOptionsQuery.refetch();
  }

  async function handleCreateConversation(selection: {
    source: { id: string };
    llmConnection: { id: string };
  }) {
    await createConversationMutation.mutateAsync({
      databaseSourceId: selection.source.id,
      llmConnectionId: selection.llmConnection.id,
    });
  }

  async function handleCreateLlmConnection(input: SaveLlmConnectionInput) {
    setGithubLinkError(null);
    await createLlmConnectionMutation.mutateAsync(input);
    await chatOptionsQuery.refetch();
  }

  async function handleLinkGithub() {
    setGithubLinkError(null);
    setIsLinkingGithub(true);

    try {
      const callbackURL =
        typeof window === "undefined" ? "/chat" : `${window.location.origin}/chat`;
      await linkGithubAccount(callbackURL);
    } catch (error) {
      setGithubLinkError(
        error instanceof Error
          ? error
          : new Error("Unable to link your GitHub account."),
      );
    } finally {
      setIsLinkingGithub(false);
    }
  }

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleSendMessage() {
    const content = input.trim();
    if (!content || !activeConversationId || isComposerLocked) {
      return;
    }

    if (!selectedSource?.canStartChat) {
      setComposerError("The selected database is still syncing with the Python agent.");
      return;
    }

    setComposerError(null);
    setIsSending(true);
    setInput("");

    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversationId),
      (current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, createOptimisticUserMessage(content)],
            }
          : current,
    );

    try {
      await streamConversationMessage(activeConversationId, content, (event) => {
        queryClient.setQueryData<ConversationDetails | undefined>(
          conversationDetailsQueryKey(activeConversationId),
          (current) => applyStreamEvent(current, event),
        );
      });
    } catch (error) {
      setComposerError(
        error instanceof Error ? error.message : "Unable to stream chat response.",
      );
    } finally {
      setIsSending(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: conversationDetailsQueryKey(activeConversationId),
        }),
        queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
      ]);
    }
  }

  return (
    <>
      <ChatConnectionPicker
        isOpen={isConnectionPickerOpen}
        startInAddLlmMode={pickerStartsInAddLlmMode}
        databaseSources={chatOptionsQuery.data?.databaseSources}
        llmConnections={chatOptionsQuery.data?.llmConnections}
        githubLinked={githubLinked}
        isLoading={chatOptionsQuery.isLoading}
        isRefreshing={chatOptionsQuery.isFetching && Boolean(chatOptionsQuery.data)}
        error={chatOptionsQuery.error instanceof Error ? chatOptionsQuery.error : null}
        activeSourceId={selectedSource?.id ?? null}
        activeLlmConnectionId={selectedLlmConnection?.id ?? null}
        isCreatingLlmConnection={createLlmConnectionMutation.isPending}
        createLlmError={
          createLlmConnectionMutation.error instanceof Error
            ? createLlmConnectionMutation.error
            : null
        }
        isLinkingGithub={isLinkingGithub}
        linkGithubError={githubLinkError}
        onClose={() => {
          setIsConnectionPickerOpen(false);
          setPickerStartsInAddLlmMode(false);
        }}
        onRetry={() => {
          void chatOptionsQuery.refetch();
        }}
        onLinkGithub={() => {
          void handleLinkGithub();
        }}
        onCreateLlmConnection={handleCreateLlmConnection}
        onConfirmSelection={(selection) => {
          void handleCreateConversation(selection);
        }}
      />

      <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface">
        <aside className="flex h-full w-80 shrink-0 flex-col gap-5 border-r border-outline-variant/15 bg-surface-container-low p-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
              <Bird size={18} />
            </div>
            <div>
              <h1 className="font-headline text-xl font-bold italic text-primary">
                Kakaw AI
              </h1>
              <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface/45">
                Your AI data analyst
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenConnectionPicker}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            New Chat
          </button>

          <div className="grid gap-2">
            <Link
              href="/onboarding/database"
              className="flex items-center justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface/75 transition-colors hover:border-primary/25 hover:text-primary"
            >
              <span className="inline-flex items-center gap-3">
                <Database size={16} />
                Add Database
              </span>
              <Plus size={14} />
            </Link>

            <button
              type="button"
              onClick={handleOpenAddLlmPicker}
              className="flex items-center justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface/75 transition-colors hover:border-primary/25 hover:text-primary"
            >
              <span className="inline-flex items-center gap-3">
                <Sparkles size={16} />
                Connect LLM
              </span>
              <Plus size={14} />
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/35" />
            <input
              className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-lowest py-2 pr-4 pl-10 text-sm placeholder:text-on-surface/30"
              placeholder="Search conversations"
              type="text"
              readOnly
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface/35">
              Conversations
            </p>

            <div className="space-y-2">
              {conversationsQuery.data?.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={
                    activeConversationId === conversation.id
                      ? "w-full rounded-2xl border border-primary/20 bg-white px-4 py-3 text-left shadow-sm"
                      : "w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-left"
                  }
                >
                  <p className="truncate text-sm font-semibold text-on-surface">
                    {conversation.title}
                  </p>
                  <p className="mt-1 text-xs text-on-surface/55">
                    {conversation.databaseSource.label} · {conversation.llmConnection.defaultModel}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
                    {formatConversationTime(conversation.lastMessageAt)}
                  </p>
                </button>
              ))}

              {!conversationsQuery.data?.length ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-lowest px-4 py-5 text-sm text-on-surface/60">
                  No conversations yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 border-t border-outline-variant/15 pt-4">
            <div className="space-y-2">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface/35">
                Active Runtime
              </p>

              <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container/60">
                  {selectedSource ? (
                    <DatabaseLogo provider={selectedSource.provider} className="h-5 w-5" />
                  ) : (
                    <Database size={16} className="text-on-surface/40" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
                    Database
                  </p>
                  <p className="truncate text-sm font-medium">
                    {selectedSource?.label ?? "No conversation selected"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container/60">
                  {selectedLlmConnection ? (
                    <LlmProviderLogo provider={selectedLlmConnection.provider} className="h-5 w-5" />
                  ) : (
                    <Sparkles size={16} className="text-on-surface/40" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
                    LLM
                  </p>
                  <p className="truncate text-sm font-medium">
                    {selectedLlmConnection
                      ? `${selectedLlmConnection.label} · ${selectedLlmConnection.defaultModel}`
                      : "No conversation selected"}
                  </p>
                </div>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface/70"
              >
                <LogOut size={14} />
                {isSigningOut ? "Signing Out" : "Log Out"}
              </button>
            ) : null}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-surface-container-lowest">
          <header className="flex items-center justify-between border-b border-outline-variant/15 px-8 py-5">
            <div>
              <h2 className="font-headline text-2xl italic text-primary">
                {activeConversation?.title ?? "Select or create a conversation"}
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-on-surface/35">
                Your conversation history
              </p>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            {activeConversationQuery.isLoading ? (
              <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low px-6 py-8 text-sm text-on-surface/60">
                Loading conversation...
              </div>
            ) : activeConversation ? (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface/35">
                      Data Source
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <DatabaseLogo provider={activeConversation.databaseSource.provider} className="h-6 w-6" />
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {activeConversation.databaseSource.label}
                        </p>
                        <p className="text-xs text-on-surface/55">
                          {activeConversation.databaseSource.provider}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface/35">
                      Model Runtime
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <LlmProviderLogo provider={activeConversation.llmConnection.provider} className="h-6 w-6" />
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {activeConversation.llmConnection.label}
                        </p>
                        <p className="text-xs text-on-surface/55">
                          {activeConversation.llmConnection.defaultModel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {activeConversation.messages.map((message) => (
                    <MessageCard key={message.id} message={message} />
                  ))}

                  {!activeConversation.messages.length ? (
                    <div className="rounded-3xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface/60">
                      Ask a question to get started.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface/60">
                Select a conversation or create a new one.
              </div>
            )}
          </section>

          <footer className="border-t border-outline-variant/15 px-8 py-6">
            {composerError ? (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                <AlertTriangle size={16} />
                {composerError}
              </div>
            ) : null}

            <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low p-4">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={!activeConversation || isComposerLocked}
                className="h-28 w-full resize-none border-none bg-transparent text-[15px] placeholder:text-on-surface/30 focus:ring-0"
                placeholder={
                  activeConversation
                    ? `Ask ${activeConversation.llmConnection.label} about ${activeConversation.databaseSource.label}...`
                    : "Create a conversation first to start querying the selected database."
                }
              />
              <div className="mt-3 flex items-center justify-between border-t border-outline-variant/10 pt-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface/35">
                  {isComposerLocked ? "Responding…" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void handleSendMessage();
                  }}
                  disabled={!activeConversation || !input.trim() || isComposerLocked}
                  className="flex items-center justify-center rounded-2xl bg-primary p-3 text-on-primary shadow-sm shadow-primary/20 disabled:opacity-50"
                >
                  <SendHorizontal size={18} />
                </button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
