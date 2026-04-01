"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Plotly?: {
      newPlot: (
        element: HTMLElement,
        data: unknown,
        layout?: unknown,
        config?: unknown,
      ) => Promise<unknown> | unknown;
      purge?: (element: HTMLElement) => void;
      react?: (
        element: HTMLElement,
        data: unknown,
        layout?: unknown,
        config?: unknown,
      ) => Promise<unknown> | unknown;
      downloadImage?: (
        element: HTMLElement,
        options?: Record<string, unknown>,
      ) => Promise<unknown> | unknown;
    };
  }
}

type PlotlyChartArtifactProps = {
  chartType?: string;
  title?: string;
  spec: Record<string, unknown>;
  config?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toCellText(value: unknown) {
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

function escapeCsvField(value: unknown) {
  const normalized = toCellText(value).replace(/\r\n/g, "\n");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function sanitizeFilename(value: string, fallback: string, extension: string) {
  const stem = value
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${stem || fallback}.${extension}`;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
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

function extractTableTrace(data: unknown[]) {
  return data.find(
    (entry): entry is Record<string, unknown> => isRecord(entry) && entry.type === "table",
  );
}

function getTableColumnCount(trace: Record<string, unknown>) {
  const header = isRecord(trace.header) ? trace.header : null;
  const headerValues = Array.isArray(header?.values) ? header.values : [];
  if (headerValues.length > 0) {
    return headerValues.length;
  }

  const cells = isRecord(trace.cells) ? trace.cells : null;
  const cellValues = Array.isArray(cells?.values) ? cells.values : [];
  return cellValues.length;
}

function getTableRowCount(trace: Record<string, unknown>) {
  const cells = isRecord(trace.cells) ? trace.cells : null;
  const cellValues = Array.isArray(cells?.values) ? cells.values : [];
  const firstColumn = cellValues[0];
  return Array.isArray(firstColumn) ? firstColumn.length : 0;
}

function buildTableCsv(trace: Record<string, unknown>) {
  const header = isRecord(trace.header) ? trace.header : null;
  const cells = isRecord(trace.cells) ? trace.cells : null;
  const headerValues = Array.isArray(header?.values) ? header.values : [];
  const cellValues = Array.isArray(cells?.values) ? cells.values : [];

  if (headerValues.length === 0 || cellValues.length === 0) {
    return null;
  }

  const rowCount = getTableRowCount(trace);
  const lines = [headerValues.map((value) => escapeCsvField(value)).join(",")];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    lines.push(
      cellValues
        .map((column) =>
          Array.isArray(column) ? escapeCsvField(column[rowIndex]) : escapeCsvField(""),
        )
        .join(","),
    );
  }

  return lines.join("\n");
}

export function PlotlyChartArtifact({
  chartType,
  title,
  spec,
  config,
}: PlotlyChartArtifactProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasPlotlyInWindow =
    typeof window !== "undefined" && Boolean(window.Plotly);
  const [isReady, setIsReady] = useState<boolean>(hasPlotlyInWindow);
  const scriptId = useId();

  const figure = useMemo(() => {
    const data = Array.isArray(spec.data) ? spec.data : [];
    const layout = isRecord(spec.layout) ? spec.layout : {};
    const baseMargin = isRecord(layout.margin) ? layout.margin : {};
    const tableTrace = extractTableTrace(data);
    const tableColumnCount = tableTrace ? getTableColumnCount(tableTrace) : 0;
    const tableRowCount = tableTrace ? getTableRowCount(tableTrace) : 0;
    const tableWidth = tableTrace ? Math.max(860, tableColumnCount * 148) : null;
    const tableHeight = tableTrace
      ? Math.max(280, Math.min(920, 132 + tableRowCount * 34))
      : null;
    const existingWidth =
      typeof layout.width === "number" && Number.isFinite(layout.width) ? layout.width : null;
    const existingHeight =
      typeof layout.height === "number" && Number.isFinite(layout.height) ? layout.height : null;
    const mergedLayout = {
      ...layout,
      autosize: tableTrace ? false : true,
      margin: {
        t: title?.trim() ? 56 : 28,
        r: 24,
        b: 24,
        l: 24,
        ...baseMargin,
      },
      ...(tableTrace
        ? {
            width: Math.max(tableWidth ?? 0, existingWidth ?? 0),
            height: Math.max(tableHeight ?? 0, existingHeight ?? 0),
          }
        : {}),
    };
    const mergedConfig = {
      responsive: tableTrace ? false : true,
      displaylogo: false,
      displayModeBar: false,
      ...(config ?? {}),
    };

    return {
      data,
      layout: mergedLayout,
      config: mergedConfig,
      tableCsv: tableTrace ? buildTableCsv(tableTrace) : null,
      tableWidth,
      tableHeight,
    };
  }, [config, spec, title]);

  function handleDownloadCsv() {
    if (!figure.tableCsv) {
      return;
    }

    downloadTextFile(
      sanitizeFilename(title ?? "chart-data", "chart-data", "csv"),
      figure.tableCsv,
      "text/csv;charset=utf-8",
    );
  }

  function handleDownloadImage() {
    if (!isReady || !containerRef.current || !window.Plotly?.downloadImage) {
      return;
    }

    void window.Plotly.downloadImage(containerRef.current, {
      format: "png",
      filename: sanitizeFilename(title ?? chartType ?? "chart", "chart", "png").replace(
        /\.png$/,
        "",
      ),
      scale: 2,
    });
  }

  useEffect(() => {
    if (!isReady || !containerRef.current || !window.Plotly) {
      return;
    }

    const plotly = window.Plotly;
    const element = containerRef.current;

    void (plotly.react ?? plotly.newPlot)(
      element,
      figure.data,
      figure.layout,
      figure.config,
    );

    return () => {
      plotly.purge?.(element);
    };
  }, [figure, isReady]);

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest">
      {!hasPlotlyInWindow ? (
        <Script
          id={`plotly-loader-${scriptId}`}
          src="https://cdn.plot.ly/plotly-2.35.2.min.js"
          strategy="afterInteractive"
          onLoad={() => setIsReady(true)}
        />
      ) : null}

      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/10 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {chartType ? (
            <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface/45">
              {chartType}
            </span>
          ) : null}
          {title?.trim() ? (
            <span className="truncate text-xs font-medium text-on-surface/65">{title.trim()}</span>
          ) : !chartType ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/45">
              Chart
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {figure.tableCsv ? (
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="rounded-full border border-outline-variant/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface/60 transition hover:border-primary/35 hover:text-primary"
            >
              Download CSV
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={!isReady}
              className="rounded-full border border-outline-variant/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface/60 transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
            >
              Export PNG
            </button>
          )}
        </div>
      </div>
      <div className={figure.tableCsv ? "overflow-auto px-2 py-2" : "px-2 py-2"}>
        <div
          ref={containerRef}
          className="min-h-80"
          style={
            figure.tableCsv
              ? {
                  width: `${figure.tableWidth ?? 860}px`,
                  minWidth: "100%",
                  height: `${figure.tableHeight ?? 320}px`,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
