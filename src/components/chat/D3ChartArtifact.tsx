"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as d3 from "d3";
import { humanizeDataLabel } from "@/components/chat/chat-formatting";

type D3ChartArtifactProps = {
  chartType?: string;
  title?: string;
  spec: Record<string, unknown>;
};

type ChartRow = Record<string, unknown>;

const COLOR_PALETTE = [
  "var(--chart-1, #6366f1)",
  "var(--chart-2, #8b5cf6)",
  "var(--chart-3, #06b6d4)",
  "var(--chart-4, #10b981)",
  "var(--chart-5, #f59e0b)",
];

function asRows(value: unknown): ChartRow[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is ChartRow => typeof entry === "object" && entry !== null)
    : [];
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCell(value: unknown) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function D3ChartArtifact({
  chartType,
  title,
  spec,
}: D3ChartArtifactProps) {
  const containerId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);

  const rows = asRows(spec.data);
  const kind = asText(spec.kind) || chartType || "bar";
  const xField = asText(spec.xField);
  const yField = asText(spec.yField);
  const xLabel = asText(spec.xLabel) || humanizeDataLabel(xField);
  const yLabel = asText(spec.yLabel) || humanizeDataLabel(yField);
  const displayTitle =
    title ||
    asText(spec.title) ||
    (kind === "histogram"
      ? `Distribution of ${xLabel}`
      : xField && yField
        ? `${yLabel} by ${xLabel}`
        : "Visualization");

  useEffect(() => {
    const container = containerRef.current;
    const svgElement = svgRef.current;
    if (!container || !svgElement) {
      return;
    }

    setDrawError(null);

    const draw = () => {
      try {
        const rect = container.getBoundingClientRect();
        const width = Math.max(rect.width, 320);
        const height = 320;
        const margin = { top: 24, right: 24, bottom: 56, left: 64 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const svg = d3.select(svgElement);
        svg.selectAll("*").remove();
        svg.attr("width", width).attr("height", height);

        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const appendAxisLabels = () => {
          if (kind !== "pie" && xField) {
            svg
              .append("text")
              .attr("x", margin.left + innerWidth / 2)
              .attr("y", height - 10)
              .attr("text-anchor", "middle")
              .attr("font-size", 12)
              .attr("font-weight", 600)
              .attr("fill", "currentColor")
              .text(xLabel);
          }

          if (kind !== "pie" && yField) {
            svg
              .append("text")
              .attr("transform", `translate(18, ${margin.top + innerHeight / 2}) rotate(-90)`)
              .attr("text-anchor", "middle")
              .attr("font-size", 12)
              .attr("font-weight", 600)
              .attr("fill", "currentColor")
              .text(kind === "histogram" ? "Count" : yLabel);
          }
        };

        if (kind === "pie") {
          const pieData = rows
            .map((row) => ({
              label: formatCell(row[xField]),
              value: asNumber(row[yField]) ?? 0,
            }))
            .filter((row) => row.label && row.value >= 0)
            .slice(0, 8);

          const radius = Math.min(innerWidth, innerHeight) / 2;
          const pie = d3.pie<{ label: string; value: number }>().value((d) => d.value);
          const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
            .innerRadius(0)
            .outerRadius(radius - 12);
          const color = d3.scaleOrdinal<string, string>(COLOR_PALETTE);

          const chart = g
            .append("g")
            .attr("transform", `translate(${innerWidth / 2},${innerHeight / 2})`);

          chart
            .selectAll("path")
            .data(pie(pieData))
            .join("path")
            .attr("d", arc)
            .attr("fill", (d) => color(d.data.label))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

          chart
            .selectAll("text")
            .data(pie(pieData))
            .join("text")
            .attr("transform", (d) => `translate(${arc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("font-size", 11)
            .attr("font-weight", 600)
            .text((d) => d.data.label);
          return;
        }

        if (kind === "histogram") {
          const values = rows
            .map((row) => asNumber(row[xField]))
            .filter((v): v is number => v !== null);

          const bins = d3.bin().thresholds(20)(values);
          const xScale = d3
            .scaleLinear()
            .domain([bins[0]?.x0 ?? 0, bins[bins.length - 1]?.x1 ?? 0])
            .nice()
            .range([0, innerWidth]);
          const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(bins, (b) => b.length) ?? 0])
            .nice()
            .range([innerHeight, 0]);

          g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(6))
            .style("font-size", "11px");

          g.append("g").call(d3.axisLeft(yScale).ticks(5)).style("font-size", "11px");

          g.selectAll("rect")
            .data(bins)
            .join("rect")
            .attr("x", (b) => xScale(b.x0 ?? 0) + 1)
            .attr("y", (b) => yScale(b.length))
            .attr("width", (b) => Math.max(0, xScale(b.x1 ?? 0) - xScale(b.x0 ?? 0) - 1))
            .attr("height", (b) => innerHeight - yScale(b.length))
            .attr("fill", COLOR_PALETTE[0])
            .attr("fill-opacity", 0.85);
          appendAxisLabels();
          return;
        }

        if (kind === "scatter") {
          const xValues = rows.map((row) => asNumber(row[xField]) ?? 0);
          const yValues = rows.map((row) => asNumber(row[yField]) ?? 0);

          const xScale = d3
            .scaleLinear()
            .domain([d3.min(xValues) ?? 0, d3.max(xValues) ?? 0])
            .nice()
            .range([0, innerWidth]);
          const yScale = d3
            .scaleLinear()
            .domain([d3.min(yValues) ?? 0, d3.max(yValues) ?? 0])
            .nice()
            .range([innerHeight, 0]);

          g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .style("font-size", "11px");

          g.append("g").call(d3.axisLeft(yScale).ticks(5)).style("font-size", "11px");

          g.selectAll("circle")
            .data(rows)
            .join("circle")
            .attr("cx", (row) => xScale(asNumber(row[xField]) ?? 0))
            .attr("cy", (row) => yScale(asNumber(row[yField]) ?? 0))
            .attr("r", 4)
            .attr("fill", COLOR_PALETTE[0])
            .attr("fill-opacity", 0.8);
          appendAxisLabels();
          return;
        }

        const categories = rows.map((row) => formatCell(row[xField]));
        const values = rows.map((row) => asNumber(row[yField]) ?? 0);
        const xScale = d3
          .scaleBand()
          .domain(categories)
          .range([0, innerWidth])
          .padding(0.2);
        const yScale = d3
          .scaleLinear()
          .domain([0, d3.max(values) ?? 0])
          .nice()
          .range([innerHeight, 0]);

        g.append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(d3.axisBottom(xScale))
          .selectAll("text")
          .attr("transform", "rotate(-30)")
          .style("text-anchor", "end")
          .style("font-size", "11px");

        g.append("g").call(d3.axisLeft(yScale).ticks(5)).style("font-size", "11px");

        if (kind === "line") {
          const line = d3
            .line<ChartRow>()
            .x((row) => (xScale(formatCell(row[xField])) ?? 0) + xScale.bandwidth() / 2)
            .y((row) => yScale(asNumber(row[yField]) ?? 0));

          g.append("path")
            .datum(rows)
            .attr("fill", "none")
            .attr("stroke", COLOR_PALETTE[0])
            .attr("stroke-width", 2.5)
            .attr("d", line);

          g.selectAll("circle")
            .data(rows)
            .join("circle")
            .attr("cx", (row) => (xScale(formatCell(row[xField])) ?? 0) + xScale.bandwidth() / 2)
            .attr("cy", (row) => yScale(asNumber(row[yField]) ?? 0))
            .attr("r", 4)
            .attr("fill", COLOR_PALETTE[1]);
          appendAxisLabels();
          return;
        }

        g.selectAll("rect")
          .data(rows)
          .join("rect")
          .attr("x", (row) => xScale(formatCell(row[xField])) ?? 0)
          .attr("y", (row) => yScale(asNumber(row[yField]) ?? 0))
          .attr("width", xScale.bandwidth())
          .attr("height", (row) => innerHeight - yScale(asNumber(row[yField]) ?? 0))
          .attr("rx", 10)
          .attr("fill", (_row, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]);
        appendAxisLabels();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Chart rendering failed.";
        setDrawError(message);
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [chartType, kind, xField, yField, rows, spec]);

  function downloadSVG() {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgElement);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayTitle.replace(/\s+/g, "_")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayTitle.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const header = (
    <div className="border-b border-outline-variant/10 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/75">
        Visualization
      </p>
      <h4 className="mt-1 text-sm font-semibold text-on-surface">{displayTitle}</h4>
    </div>
  );

  if (!xField || !yField) {
    return (
      <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest">
        {header}
        <div className="flex items-center justify-center h-32 text-sm text-on-surface/50 border-dashed">
          Chart data is incomplete — missing axis fields
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest">
      {header}

      <div ref={containerRef} id={containerId} className="w-full px-3 py-2">
        {drawError ? (
          <div className="flex items-center justify-center h-32 text-sm text-on-surface/50">
            {drawError}
          </div>
        ) : (
          <svg ref={svgRef} className="h-auto w-full" />
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex items-center gap-2 border-t border-outline-variant/10 px-4 py-2">
          <button
            type="button"
            onClick={downloadSVG}
            className="rounded-full border border-outline-variant/15 px-3 py-1 text-[11px] font-medium text-on-surface/70 hover:bg-surface-container-low transition-colors"
          >
            Download SVG
          </button>
          <button
            type="button"
            onClick={downloadCSV}
            className="rounded-full border border-outline-variant/15 px-3 py-1 text-[11px] font-medium text-on-surface/70 hover:bg-surface-container-low transition-colors"
          >
            Download CSV
          </button>
        </div>
      )}
    </div>
  );
}
