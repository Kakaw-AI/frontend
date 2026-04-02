"use client";

import { useMemo, useState } from "react";
import {
  buildCsvContent,
  downloadTextArtifact,
  formatArtifactCellValue,
  isNumericColumn,
  sanitizeDownloadFilename,
} from "@/components/chat/chat-formatting";

export function TableArtifact({
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
