type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "paragraph"; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] };
import type { ConversationMessage } from "@/lib/queries/conversations";

const AGGREGATE_LABEL_PATTERNS: Array<{
  pattern: RegExp;
  format: (field: string) => string;
}> = [
  {
    pattern: /^count\s*\(\s*distinct\s+([a-z0-9_]+)\s*\)$/i,
    format: (field) => `${humanizeAggregateField(field)} Count`,
  },
  {
    pattern: /^count\s*\(\s*\*\s*\)$/i,
    format: () => "Count",
  },
  {
    pattern: /^count\s*\(\s*([a-z0-9_]+)\s*\)$/i,
    format: (field) => `${humanizeAggregateField(field)} Count`,
  },
  {
    pattern: /^sum\s*\(\s*([a-z0-9_]+)\s*\)$/i,
    format: (field) => `Total ${humanizeIdentifier(field)}`,
  },
  {
    pattern: /^avg\s*\(\s*([a-z0-9_]+)\s*\)$/i,
    format: (field) => `Average ${humanizeIdentifier(field)}`,
  },
  {
    pattern: /^min\s*\(\s*([a-z0-9_]+)\s*\)$/i,
    format: (field) => `Minimum ${humanizeIdentifier(field)}`,
  },
  {
    pattern: /^max\s*\(\s*([a-z0-9_]+)\s*\)$/i,
    format: (field) => `Maximum ${humanizeIdentifier(field)}`,
  },
];

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

function humanizeIdentifier(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanizeAggregateField(value: string) {
  return humanizeIdentifier(value).replace(/\s+Id$/i, "");
}

export function humanizeDataLabel(value: string) {
  const normalized = value.trim();
  for (const matcher of AGGREGATE_LABEL_PATTERNS) {
    const matched = normalized.match(matcher.pattern);
    if (matched) {
      return matcher.format(matched[1] ?? "");
    }
  }

  return humanizeIdentifier(normalized);
}

export function sanitizeAssistantMessageContent(content: string) {
  let sanitized = content;

  for (const pattern of STREAM_STATUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  return sanitized.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function getVisibleArtifacts(message: ConversationMessage) {
  const artifacts = message.error
    ? message.artifacts.filter((artifact) => artifact.type !== "ERROR")
    : message.artifacts;

  const priority: Record<ConversationMessage["artifacts"][number]["type"], number> = {
    CHART: 0,
    TABLE: 1,
    SQL: 2,
    TEXT: 3,
    ERROR: 4,
  };

  return [...artifacts].sort((left, right) => {
    const score = priority[left.type] - priority[right.type];
    if (score !== 0) {
      return score;
    }
    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function getVisibleAssistantContent(message: ConversationMessage) {
  const sanitized = sanitizeAssistantMessageContent(message.content);
  const hasChartArtifact = message.artifacts.some((artifact) => artifact.type === "CHART");
  if (!hasChartArtifact) {
    return sanitized;
  }

  return stripChartConfigBlocks(sanitized);
}

function stripChartConfigBlocks(content: string) {
  const lines = content.split("\n");
  const kept: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "{") {
      const candidate = lines.slice(index).join("\n");
      const block = extractLeadingJsonLikeBlock(candidate);
      if (
        block &&
        ((
          /"type"\s*:\s*"[^"]+"/.test(block) &&
          /"data"\s*:/.test(block)
        ) || (
          /"kind"\s*:\s*"[^"]+"/.test(block) &&
          /"xField"\s*:/.test(block) &&
          /"yField"\s*:/.test(block) &&
          /"data"\s*:/.test(block)
        ))
      ) {
        index += block.split("\n").length - 1;
        continue;
      }
    }
    kept.push(line);
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function extractLeadingJsonLikeBlock(content: string) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return content.slice(0, index + 1);
      }
    }
  }

  return null;
}

type BarChartRow = Record<string, unknown>;

type BarChartRenderPlan = {
  kind: "simple" | "grouped" | "stacked";
  xField: string;
  yField: string;
  seriesField: string | null;
  categories: string[];
  series: string[];
  rows: BarChartRow[];
  notice: string | null;
};

type BarChartRenderPlanInput = {
  rows: BarChartRow[];
  xField: string;
  yField: string;
  seriesField?: string | null;
  stacked?: boolean;
  maxCategories?: number;
  maxSeries?: number;
};

const DEFAULT_BAR_CATEGORY_CAP = 12;
const DEFAULT_BAR_SERIES_CAP = 5;
const OTHER_CATEGORY_LABEL = "Other categories";
const OTHER_SERIES_LABEL = "Other series";

function toTextLabel(value: unknown, fallback: string) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  return fallback;
}

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function rankLabels(labels: string[], totals: Map<string, number>, maxItems: number) {
  if (labels.length <= maxItems) {
    return {
      selected: [...labels],
      overflow: false,
    };
  }

  const orderByOccurrence = new Map(labels.map((label, index) => [label, index]));
  const selected = [...labels]
    .sort((left, right) => {
      const leftTotal = totals.get(left) ?? 0;
      const rightTotal = totals.get(right) ?? 0;
      if (rightTotal !== leftTotal) {
        return rightTotal - leftTotal;
      }

      return (orderByOccurrence.get(left) ?? 0) - (orderByOccurrence.get(right) ?? 0);
    })
    .slice(0, maxItems);

  return {
    selected,
    overflow: true,
  };
}

export function buildBarChartRenderPlan({
  rows,
  xField,
  yField,
  seriesField = null,
  stacked = false,
  maxCategories = DEFAULT_BAR_CATEGORY_CAP,
  maxSeries = DEFAULT_BAR_SERIES_CAP,
}: BarChartRenderPlanInput): BarChartRenderPlan {
  const categoryOrder: string[] = [];
  const seriesOrder: string[] = [];
  const categorySeriesTotals = new Map<string, Map<string, number>>();
  const categoryTotals = new Map<string, number>();
  const seriesTotals = new Map<string, number>();

  for (const row of rows) {
    const category = toTextLabel(row[xField], "Unknown");
    const series = seriesField ? toTextLabel(row[seriesField], "Unknown series") : "__value__";
    const value = toFiniteNumber(row[yField]);

    if (!categoryOrder.includes(category)) {
      categoryOrder.push(category);
    }

    if (seriesField && !seriesOrder.includes(series)) {
      seriesOrder.push(series);
    }

    const categoryMap = categorySeriesTotals.get(category) ?? new Map<string, number>();
    categoryMap.set(series, (categoryMap.get(series) ?? 0) + value);
    categorySeriesTotals.set(category, categoryMap);
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + value);
    seriesTotals.set(series, (seriesTotals.get(series) ?? 0) + value);
  }

  const rankedCategories = rankLabels(categoryOrder, categoryTotals, maxCategories);
  const rankedSeries = seriesField
    ? rankLabels(seriesOrder, seriesTotals, maxSeries)
    : { selected: ["__value__"], overflow: false };

  const categoryLookup = new Set(rankedCategories.selected);
  const seriesLookup = new Set(rankedSeries.selected);
  const categories = rankedCategories.overflow
    ? [...rankedCategories.selected, OTHER_CATEGORY_LABEL]
    : [...rankedCategories.selected];
  const series = seriesField
    ? rankedSeries.overflow
      ? [...rankedSeries.selected, OTHER_SERIES_LABEL]
      : [...rankedSeries.selected]
    : [];

  const rowsByCategory = new Map<string, BarChartRow>(
    categories.map((category) => [
      category,
      {
        [xField]: category,
        [yField]: 0,
        ...(seriesField
          ? Object.fromEntries(series.map((seriesName) => [seriesName, 0]))
          : {}),
      },
    ]),
  );

  const targetCategoryFor = (category: string) =>
    categoryLookup.has(category) ? category : OTHER_CATEGORY_LABEL;
  const targetSeriesFor = (seriesName: string) =>
    seriesLookup.has(seriesName) ? seriesName : OTHER_SERIES_LABEL;

  for (const [category, categoryMap] of categorySeriesTotals.entries()) {
    const targetCategory = targetCategoryFor(category);
    const targetRow = rowsByCategory.get(targetCategory);
    if (!targetRow) {
      continue;
    }

    if (!seriesField) {
      targetRow[yField] = (toFiniteNumber(targetRow[yField]) ?? 0) + (categoryTotals.get(category) ?? 0);
      continue;
    }

    for (const [seriesName, value] of categoryMap.entries()) {
      const targetSeries = targetSeriesFor(seriesName);
      targetRow[targetSeries] = (toFiniteNumber(targetRow[targetSeries]) ?? 0) + value;
      targetRow[yField] = (toFiniteNumber(targetRow[yField]) ?? 0) + value;
    }
  }

  const noticeParts: string[] = [];
  if (rankedCategories.overflow) {
    noticeParts.push(`Showing the top ${maxCategories} categories`);
  }
  if (rankedSeries.overflow) {
    noticeParts.push(`top ${maxSeries} series`);
  }

  let notice: string | null = null;
  if (noticeParts.length > 0) {
    const buckets: string[] = [];
    if (rankedCategories.overflow) {
      buckets.push(OTHER_CATEGORY_LABEL);
    }
    if (rankedSeries.overflow) {
      buckets.push(OTHER_SERIES_LABEL);
    }

    notice = `${noticeParts.join(" and ")}. Remaining values were grouped into ${buckets
      .map((bucket) => `"${bucket}"`)
      .join(" and ")}.`;
  }

  return {
    kind: seriesField ? (stacked ? "stacked" : "grouped") : "simple",
    xField,
    yField,
    seriesField,
    categories,
    series,
    rows: categories.map((category) => rowsByCategory.get(category) as BarChartRow),
    notice,
  };
}

export function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let currentList: { type: "unordered-list" | "ordered-list"; items: string[] } | null = null;
  let codeFence: { language: string; lines: string[] } | null = null;

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

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (codeFence) {
      if (line.startsWith("```")) {
        blocks.push({
          type: "code",
          language: codeFence.language,
          code: codeFence.lines.join("\n"),
        });
        codeFence = null;
      } else {
        codeFence.lines.push(rawLine);
      }
      continue;
    }

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      codeFence = { language: line.slice(3).trim(), lines: [] };
      continue;
    }

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

    if (isMarkdownTableHeader(line, lines[index + 1])) {
      flushParagraph();
      flushList();
      const headers = splitMarkdownTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length) {
        const candidate = lines[index].trim();
        if (!candidate || !candidate.includes("|")) {
          index -= 1;
          break;
        }
        rows.push(splitMarkdownTableRow(candidate));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  if (codeFence) {
    blocks.push({
      type: "code",
      language: codeFence.language,
      code: codeFence.lines.join("\n"),
    });
  }
  flushParagraph();
  flushList();
  return blocks;
}

function splitMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isMarkdownTableHeader(line: string, nextLine: string | undefined) {
  if (!line.includes("|") || !nextLine) {
    return false;
  }

  const alignment = nextLine.trim();
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(alignment);
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
