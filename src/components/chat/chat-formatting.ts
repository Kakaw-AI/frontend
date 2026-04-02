export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "paragraph"; text: string };

const STREAM_STATUS_PATTERNS = [
  /Processing your request(?:\.{3}|…)/gi,
  /Response complete/gi,
  /^\[chart\]$/gim,
  /TOOLCALL>[\s\S]*$/gi,
  /<TOOLCALL[\s\S]*$/gi,
  /TOOLCALL\[[\s\S]*$/gi,
  /ALL>$/gi,
];

export function formatConversationTitle(title: string): string {
  if (/^\d{4}-\d{2}-\d{2}T/.test(title)) {
    const date = new Date(title);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
    }
  }
  return title;
}

export function formatConversationTime(value: string | null) {
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

export function sanitizeAssistantMessageContent(content: string) {
  let sanitized = content;

  for (const pattern of STREAM_STATUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  return sanitized.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function parseMarkdownBlocks(content: string): MarkdownBlock[] {
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

export function isNumericColumn(
  rows: Array<Record<string, unknown>>,
  column: string,
): boolean {
  const nonNull = rows.filter((row) => row[column] != null && row[column] !== "");
  if (nonNull.length === 0) return false;
  return nonNull.every((row) => !isNaN(Number(row[column])));
}

export function formatArtifactCellValue(value: unknown): string {
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

export function sanitizeDownloadFilename(
  value: string,
  fallback: string,
  extension: string,
): string {
  const stem = value
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${stem || fallback}.${extension}`;
}

export function downloadTextArtifact(
  filename: string,
  content: string,
  mimeType: string,
) {
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

export function buildCsvContent(
  columns: string[],
  rows: Array<Record<string, unknown>>,
): string {
  const lines = [columns.map((column) => escapeCsvField(column)).join(",")];

  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsvField(row[column])).join(","));
  }

  return lines.join("\n");
}
