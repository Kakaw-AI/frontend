"use client";

import { memo, useMemo, useState } from "react";
import {
  buildCsvContent,
  downloadTextArtifact,
  formatArtifactCellValue,
  humanizeDataLabel,
  isNumericColumn,
  sanitizeDownloadFilename,
} from "@/components/chat/chat-formatting";

export const TableArtifact = memo(function TableArtifact({
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
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-container-lowest">
      <div className="flex items-center justify-between gap-3 border-b-2 border-border px-4 py-3">
        <div>
          <p className="text-sm font-bold text-on-surface">
            Result{typeof totalRows === "number" ? ` · ${totalRows} rows` : ""}
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Showing {showingRowsLabel} rows
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={columns.length === 0}
          className="rounded-[8px] border border-border px-3 py-1 text-xs font-bold text-on-surface transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45"
        >
          Download CSV
        </button>
      </div>
      <p className="px-4 pt-2 text-xs text-on-surface-variant sm:hidden">
        Swipe table sideways to see more →
      </p>
      <div className="max-h-[34rem] overflow-auto">
        <table
          className="w-max min-w-full border-separate border-spacing-0 text-left"
          style={{ fontSize: "12.5px" }}
        >
          <thead className="sticky top-0 z-10 bg-surface-container">
            <tr>
              {columns.map((column) => {
                const isActive = sortColumn === column;

                return (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className={`cursor-pointer select-none whitespace-nowrap px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-on-surface-variant transition-colors hover:text-on-surface ${numericColumns.has(column) ? "text-right" : "text-left"}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {humanizeDataLabel(column)}
                      <span
                        className={`text-[10px] ${isActive ? "text-secondary" : ""}`}
                      >
                        {isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={index} className="hover:bg-surface">
                {columns.map((column) => (
                  <td
                    key={column}
                    className={`max-w-72 min-w-32 border-t border-primary/10 px-4 py-2.5 align-top text-on-surface ${numericColumns.has(column) ? "text-right font-mono tabular-nums" : "whitespace-pre-wrap break-words"}`}
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
        <div className="border-t-2 border-border px-4 py-3 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="rounded-[8px] border border-border px-4 py-1.5 text-xs font-bold text-on-surface transition-colors hover:bg-accent"
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
});
