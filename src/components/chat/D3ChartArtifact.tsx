"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
// Assembled from submodules rather than the `d3` meta-package, which pulls in
// d3-geo, d3-force, d3-contour, d3-delaunay, d3-hierarchy and d3-chord that
// nothing here uses. Keep this object in sync when reaching for a new d3 API.
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";
import * as d3Scale from "d3-scale";
import * as d3Selection from "d3-selection";
import * as d3Shape from "d3-shape";
import type { PieArcDatum } from "d3-shape";
import {
  buildBarChartRenderPlan,
  humanizeDataLabel,
} from "@/components/chat/chat-formatting";

const d3 = {
  ...d3Array,
  ...d3Axis,
  ...d3Scale,
  ...d3Selection,
  ...d3Shape,
};

type D3ChartArtifactProps = {
  chartType?: string;
  title?: string;
  spec: Record<string, unknown>;
};

type ChartRow = Record<string, unknown>;
type Svg = d3Selection.Selection<SVGSVGElement, unknown, null, undefined>;
type G = d3Selection.Selection<SVGGElement, unknown, null, undefined>;

const COLOR_PALETTE = [
  "var(--chart-1, #2a1810)",
  "var(--chart-2, #e8a317)",
  "var(--chart-3, #2b6a78)",
  "var(--chart-4, #2f6b4f)",
  "var(--chart-5, #8a5a00)",
  "#9a8478",
];
const colorAt = (index: number) => COLOR_PALETTE[index % COLOR_PALETTE.length];

/** Most series any multi-series chart draws; the rest are dropped by total. */
const SERIES_LIMIT = 6;
const PIE_LIMIT = 8;

/** "500k", "1.2M": short enough that tick labels never reach the axis title. */
const compactNumber = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const formatTick = (value: d3.NumberValue) => compactNumber.format(Number(value));
const fullNumber = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

function asRows(value: unknown): ChartRow[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is ChartRow => typeof entry === "object" && entry !== null)
    : [];
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** Postgres numeric and bigint arrive as strings from some drivers. */
function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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

const truncate = (label: string, max: number) => (label.length > max ? `${label.slice(0, max - 1)}…` : label);

/** Distinct values in first-seen order; SQL already ordered them. */
function distinct(rows: ChartRow[], field: string) {
  return [...new Set(rows.map((row) => formatCell(row[field])))].filter(Boolean);
}

/** The `limit` series with the largest totals, largest first. */
function topSeries(rows: ChartRow[], seriesField: string, valueField: string, limit: number) {
  const totals = d3.rollup(rows, (group) => d3.sum(group, (row) => asNumber(row[valueField]) ?? 0), (row) => formatCell(row[seriesField]));
  return [...totals.entries()]
    .filter(([name]) => name)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

function pieSlices(rows: ChartRow[], xField: string, yField: string) {
  return rows
    .map((row) => ({ label: formatCell(row[xField]), value: asNumber(row[yField]) ?? 0 }))
    .filter((slice) => slice.label && slice.value >= 0)
    .slice(0, PIE_LIMIT);
}

function frame(svg: Svg, width: number, height: number, margin: { top: number; right: number; bottom: number; left: number }) {
  svg.attr("width", width).attr("height", height);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`) as G;
  return { g, innerWidth: width - margin.left - margin.right, innerHeight: height - margin.top - margin.bottom };
}

function axisTitle(svg: Svg, x: number, y: number, text: string, anchor: "start" | "middle" | "end", color = "currentColor") {
  svg
    .append("text")
    .attr("x", x)
    .attr("y", y)
    .attr("text-anchor", anchor)
    .attr("font-size", 12)
    .attr("font-weight", 600)
    .attr("fill", color)
    .attr("opacity", 0.75)
    .text(text);
}

/** Left axis with faint gridlines across the plot. */
function yAxisWithGrid(g: G, scale: d3Scale.ScaleLinear<number, number>, innerWidth: number) {
  g.append("g")
    .call(d3.axisLeft(scale).ticks(5).tickFormat(formatTick).tickSize(-innerWidth))
    .call((axis) => axis.select(".domain").remove())
    .call((axis) => axis.selectAll(".tick line").attr("stroke-opacity", 0.1))
    .style("font-size", "11px");
}

function shouldTilt(labels: string[], innerWidth: number) {
  const shown = Math.min(labels.length, 16);
  const slot = innerWidth / Math.max(shown, 1);
  return labels.some((label) => label.length * 6.5 > slot * 0.9);
}

/** Category axis; thins ticks past 16 and tilts names that would collide. */
function bandAxis(g: G, scale: d3Scale.ScaleBand<string>, innerHeight: number, tilt: boolean) {
  const domain = scale.domain();
  const step = Math.ceil(domain.length / 16);
  const labels = g
    .append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(scale).tickValues(domain.filter((_, i) => i % step === 0)))
    .selectAll<SVGTextElement, string>("text")
    .style("font-size", "11px");
  if (tilt) {
    labels
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end")
      .text((label) => truncate(String(label), 12))
      .append("title")
      .text((label) => String(label));
  }
}

/** Least-squares fit, drawn dashed so the trend reads at a glance. */
function trendLine(g: G, points: Array<[number, number]>, x: d3Scale.ScaleLinear<number, number>, y: d3Scale.ScaleLinear<number, number>) {
  if (points.length < 4) return;
  const meanX = d3.mean(points, (p) => p[0]) ?? 0;
  const meanY = d3.mean(points, (p) => p[1]) ?? 0;
  const sxx = d3.sum(points, (p) => (p[0] - meanX) ** 2);
  if (sxx === 0) return;
  const slope = d3.sum(points, (p) => (p[0] - meanX) * (p[1] - meanY)) / sxx;
  const [x0, x1] = x.domain();
  g.append("line")
    .attr("x1", x(x0))
    .attr("x2", x(x1))
    .attr("y1", y(meanY + slope * (x0 - meanX)))
    .attr("y2", y(meanY + slope * (x1 - meanX)))
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.35)
    .attr("stroke-dasharray", "5 4")
    .attr("stroke-width", 1.5);
}

type DrawInput = {
  svg: Svg;
  width: number;
  rows: ChartRow[];
  xField: string;
  yField: string;
  xLabel: string;
  yLabel: string;
  seriesField: string | null;
  y2Field: string;
  y2Label: string;
  sizeField: string;
  sizeLabel: string;
  labelField: string;
};

function drawPie({ svg, width, rows, xField, yField, yLabel }: DrawInput) {
  const height = 300;
  svg.attr("width", width).attr("height", height);
  const slices = pieSlices(rows, xField, yField);
  const total = d3.sum(slices, (slice) => slice.value);
  const radius = Math.min(width, height) / 2 - 12;
  const pie = d3.pie<{ label: string; value: number }>().value((d) => d.value).sort(null);
  const arc = d3.arc<PieArcDatum<{ label: string; value: number }>>().innerRadius(radius * 0.58).outerRadius(radius).padAngle(0.012);
  const chart = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  chart
    .selectAll("path")
    .data(pie(slices))
    .join("path")
    .attr("d", arc)
    .attr("fill", (_, i) => colorAt(i))
    .attr("stroke", "var(--card, #fff9f0)")
    .attr("stroke-width", 1.5)
    .append("title")
    .text((d) => `${d.data.label}: ${fullNumber.format(d.data.value)} (${((d.data.value / (total || 1)) * 100).toFixed(1)}%)`);

  chart
    .selectAll("text.pct")
    .data(pie(slices).filter((d) => d.data.value / (total || 1) >= 0.06))
    .join("text")
    .attr("class", "pct")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .attr("fill", "var(--card, #fff9f0)")
    .text((d) => `${Math.round((d.data.value / (total || 1)) * 100)}%`);

  chart.append("text").attr("text-anchor", "middle").attr("font-size", 22).attr("font-weight", 700).attr("fill", "currentColor").text(compactNumber.format(total));
  chart.append("text").attr("text-anchor", "middle").attr("dy", "1.6em").attr("font-size", 11).attr("fill", "currentColor").attr("opacity", 0.6).text(`Total ${yLabel}`);
}

function drawHistogram({ svg, width, rows, xField, xLabel }: DrawInput) {
  const height = 320;
  const { g, innerWidth, innerHeight } = frame(svg, width, height, { top: 32, right: 24, bottom: 48, left: 56 });
  const values = rows.map((row) => asNumber(row[xField])).filter((v): v is number => v !== null);
  const bins = d3.bin().thresholds(20)(values);
  const xScale = d3.scaleLinear().domain([bins[0]?.x0 ?? 0, bins[bins.length - 1]?.x1 ?? 0]).nice().range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length) ?? 0]).nice().range([innerHeight, 0]);

  g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xScale).ticks(6).tickFormat(formatTick)).style("font-size", "11px");
  yAxisWithGrid(g, yScale, innerWidth);

  g.selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", (b) => xScale(b.x0 ?? 0) + 1)
    .attr("y", (b) => yScale(b.length))
    .attr("width", (b) => Math.max(0, xScale(b.x1 ?? 0) - xScale(b.x0 ?? 0) - 1))
    .attr("height", (b) => innerHeight - yScale(b.length))
    .attr("fill", COLOR_PALETTE[0])
    .attr("fill-opacity", 0.85)
    .append("title")
    .text((b) => `${formatTick(b.x0 ?? 0)}–${formatTick(b.x1 ?? 0)}: ${b.length}`);

  axisTitle(svg, 56 + innerWidth / 2, height - 10, xLabel, "middle");
  axisTitle(svg, 48, 14, "Count", "start");
}

/** Scatter, or bubble when a size field is set: area encodes the third measure. */
function drawPoints({ svg, width, rows, xField, yField, xLabel, yLabel, sizeField, sizeLabel, labelField }: DrawInput) {
  const height = 360;
  const { g, innerWidth, innerHeight } = frame(svg, width, height, { top: 32, right: 28, bottom: 48, left: 56 });
  const points = rows
    .map((row) => ({
      x: asNumber(row[xField]),
      y: asNumber(row[yField]),
      size: sizeField ? asNumber(row[sizeField]) ?? 0 : 0,
      label: labelField ? formatCell(row[labelField]) : "",
    }))
    .filter((p): p is { x: number; y: number; size: number; label: string } => p.x !== null && p.y !== null)
    // Largest first so small bubbles stay on top and clickable.
    .sort((a, b) => b.size - a.size);

  const pad = (lo: number, hi: number) => {
    const span = hi - lo || Math.abs(hi) || 1;
    return [lo - span * 0.08, hi + span * 0.08] as [number, number];
  };
  const xScale = d3.scaleLinear().domain(pad(d3.min(points, (p) => p.x) ?? 0, d3.max(points, (p) => p.x) ?? 0)).nice().range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain(pad(d3.min(points, (p) => p.y) ?? 0, d3.max(points, (p) => p.y) ?? 0)).nice().range([innerHeight, 0]);
  const rScale = d3.scaleSqrt().domain([0, d3.max(points, (p) => Math.abs(p.size)) || 1]).range([sizeField ? 4 : 5, sizeField ? 28 : 5]);

  g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xScale).ticks(5).tickFormat(formatTick)).style("font-size", "11px");
  yAxisWithGrid(g, yScale, innerWidth);
  trendLine(g, points.map((p) => [p.x, p.y]), xScale, yScale);

  g.selectAll("circle")
    .data(points)
    .join("circle")
    .attr("cx", (p) => xScale(p.x))
    .attr("cy", (p) => yScale(p.y))
    .attr("r", (p) => rScale(Math.abs(p.size)))
    .attr("fill", sizeField ? COLOR_PALETTE[1] : COLOR_PALETTE[0])
    .attr("fill-opacity", sizeField ? 0.55 : 0.8)
    .attr("stroke", COLOR_PALETTE[0])
    .attr("stroke-opacity", 0.5)
    .append("title")
    .text((p) =>
      [p.label, `${xLabel}: ${fullNumber.format(p.x)}`, `${yLabel}: ${fullNumber.format(p.y)}`, sizeField ? `${sizeLabel}: ${fullNumber.format(p.size)}` : ""]
        .filter(Boolean)
        .join("\n"),
    );

  if (labelField) {
    // Name the biggest few; every name on a crowded plot is noise.
    const named = [...points].sort((a, b) => (sizeField ? b.size - a.size : b.y - a.y)).slice(0, 8);
    g.selectAll("text.point-label")
      .data(named)
      .join("text")
      .attr("class", "point-label")
      .attr("x", (p) => xScale(p.x) + rScale(Math.abs(p.size)) + 4)
      .attr("y", (p) => yScale(p.y))
      .attr("dy", "0.35em")
      .attr("font-size", 11)
      .attr("fill", "currentColor")
      .attr("opacity", 0.8)
      .text((p) => truncate(p.label, 16));
  }

  axisTitle(svg, 56 + innerWidth / 2, height - 10, xLabel, "middle");
  axisTitle(svg, 48, 14, yLabel, "start");
}

/** Ranked horizontal bars with the value at each bar's end. */
function drawHBar({ svg, width, rows, xField, yField, yLabel }: DrawInput) {
  const data = rows
    .map((row) => ({ label: formatCell(row[xField]), value: asNumber(row[yField]) ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);
  const left = Math.min(170, Math.max(60, (d3.max(data, (d) => Math.min(d.label.length, 24)) ?? 0) * 6.5 + 14));
  const height = data.length * 26 + 44;
  const { g, innerWidth, innerHeight } = frame(svg, width, height, { top: 28, right: 52, bottom: 16, left });
  const lo = Math.min(0, d3.min(data, (d) => d.value) ?? 0);
  const xScale = d3.scaleLinear().domain([lo, d3.max(data, (d) => d.value) ?? 0]).nice().range([0, innerWidth]);
  const yScale = d3.scaleBand().domain(data.map((d) => d.label)).range([0, innerHeight]).padding(0.22);
  const top = data[0]?.value ?? 0;

  g.append("g")
    .call(d3.axisLeft(yScale).tickSize(0).tickPadding(8))
    .call((axis) => axis.select(".domain").remove())
    .selectAll<SVGTextElement, string>("text")
    .style("font-size", "11px")
    .text((label) => truncate(label, 24))
    .append("title")
    .text((label) => label);

  g.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => xScale(Math.min(0, d.value)))
    .attr("y", (d) => yScale(d.label) ?? 0)
    .attr("width", (d) => Math.abs(xScale(d.value) - xScale(0)))
    .attr("height", yScale.bandwidth())
    .attr("rx", 4)
    .attr("fill", (d) => (d.value === top && top > 0 ? COLOR_PALETTE[1] : COLOR_PALETTE[0]))
    .attr("fill-opacity", (d) => (d.value === top && top > 0 ? 1 : 0.72))
    .append("title")
    .text((d) => `${d.label}: ${fullNumber.format(d.value)}`);

  g.selectAll("text.value")
    .data(data)
    .join("text")
    .attr("class", "value")
    .attr("x", (d) => xScale(Math.max(0, d.value)) + 5)
    .attr("y", (d) => (yScale(d.label) ?? 0) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("font-size", 11)
    .attr("font-weight", 600)
    .attr("fill", "currentColor")
    .text((d) => compactNumber.format(d.value));

  axisTitle(svg, left, 16, yLabel, "start");
}

/** Category x series grid; colour depth is the value. */
function drawHeatmap({ svg, width, rows, xField, yField, yLabel, seriesField }: DrawInput) {
  if (!seriesField) return;
  const xs = distinct(rows, xField).slice(0, 30);
  const ys = topSeries(rows, seriesField, yField, 25);
  const cells = d3.rollup(
    rows,
    (group) => d3.sum(group, (row) => asNumber(row[yField]) ?? 0),
    (row) => formatCell(row[xField]),
    (row) => formatCell(row[seriesField]),
  );
  const data = xs.flatMap((x) => ys.map((y) => ({ x, y, value: cells.get(x)?.get(y) })));
  const values = data.map((d) => d.value).filter((v): v is number => v !== undefined);
  const [lo, hi] = [d3.min(values) ?? 0, d3.max(values) ?? 0];
  const depth = (v: number) => (hi === lo ? 0.6 : 0.08 + (0.92 * (v - lo)) / (hi - lo));

  const left = Math.min(150, Math.max(60, (d3.max(ys, (y) => Math.min(y.length, 20)) ?? 0) * 6.5 + 14));
  const innerGuess = width - left - 16;
  const tilt = shouldTilt(xs, innerGuess);
  const cellHeight = 26;
  const height = ys.length * cellHeight + (tilt ? 72 : 40) + 12;
  const { g, innerWidth, innerHeight } = frame(svg, width, height, { top: 12, right: 16, bottom: tilt ? 72 : 40, left });
  const xScale = d3.scaleBand().domain(xs).range([0, innerWidth]).padding(0.06);
  const yScale = d3.scaleBand().domain(ys).range([0, innerHeight]).padding(0.06);

  bandAxis(g, xScale, innerHeight, tilt);
  g.append("g")
    .call(d3.axisLeft(yScale).tickSize(0).tickPadding(6))
    .call((axis) => axis.select(".domain").remove())
    .selectAll<SVGTextElement, string>("text")
    .style("font-size", "11px")
    .text((label) => truncate(label, 20));

  const cell = g
    .selectAll("g.cell")
    .data(data)
    .join("g")
    .attr("class", "cell")
    .attr("transform", (d) => `translate(${xScale(d.x) ?? 0},${yScale(d.y) ?? 0})`);
  cell
    .append("rect")
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("rx", 3)
    .attr("fill", (d) => (d.value === undefined ? "currentColor" : COLOR_PALETTE[1]))
    .attr("fill-opacity", (d) => (d.value === undefined ? 0.04 : depth(d.value)))
    .append("title")
    .text((d) => `${d.y} · ${d.x}\n${yLabel}: ${d.value === undefined ? "no data" : fullNumber.format(d.value)}`);
  if (xScale.bandwidth() >= 34) {
    cell
      .filter((d) => d.value !== undefined)
      .append("text")
      .attr("x", xScale.bandwidth() / 2)
      .attr("y", yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-weight", 600)
      .attr("fill", "currentColor")
      .attr("pointer-events", "none")
      .text((d) => compactNumber.format(d.value ?? 0));
  }
}

/** Bars for one measure, a line for a second on its own right-hand axis. */
function drawCombo({ svg, width, rows, xField, yField, yLabel, y2Field, y2Label }: DrawInput) {
  const categories = rows.map((row) => formatCell(row[xField]));
  const tilt = shouldTilt(categories, width - 120);
  const height = 340;
  const { g, innerWidth, innerHeight } = frame(svg, width, height, { top: 36, right: 56, bottom: tilt ? 64 : 32, left: 56 });
  const xScale = d3.scaleBand().domain(categories).range([0, innerWidth]).padding(0.25);
  const bars = d3.scaleLinear().domain([Math.min(0, d3.min(rows, (r) => asNumber(r[yField]) ?? 0) ?? 0), d3.max(rows, (r) => asNumber(r[yField]) ?? 0) ?? 0]).nice().range([innerHeight, 0]);
  const line = d3.scaleLinear().domain([Math.min(0, d3.min(rows, (r) => asNumber(r[y2Field]) ?? 0) ?? 0), d3.max(rows, (r) => asNumber(r[y2Field]) ?? 0) ?? 0]).nice().range([innerHeight, 0]);
  const center = (row: ChartRow) => (xScale(formatCell(row[xField])) ?? 0) + xScale.bandwidth() / 2;

  bandAxis(g, xScale, innerHeight, tilt);
  yAxisWithGrid(g, bars, innerWidth);
  g.append("g")
    .attr("transform", `translate(${innerWidth},0)`)
    .call(d3.axisRight(line).ticks(5).tickFormat(formatTick))
    .call((axis) => axis.select(".domain").remove())
    .style("font-size", "11px")
    .style("color", COLOR_PALETTE[1]);

  g.selectAll("rect")
    .data(rows)
    .join("rect")
    .attr("x", (row) => xScale(formatCell(row[xField])) ?? 0)
    .attr("y", (row) => bars(Math.max(0, asNumber(row[yField]) ?? 0)))
    .attr("width", xScale.bandwidth())
    .attr("height", (row) => Math.abs(bars(asNumber(row[yField]) ?? 0) - bars(0)))
    .attr("rx", 4)
    .attr("fill", COLOR_PALETTE[0])
    .attr("fill-opacity", 0.75)
    .append("title")
    .text((row) => `${formatCell(row[xField])}\n${yLabel}: ${fullNumber.format(asNumber(row[yField]) ?? 0)}\n${y2Label}: ${fullNumber.format(asNumber(row[y2Field]) ?? 0)}`);

  g.append("path")
    .datum(rows)
    .attr("fill", "none")
    .attr("stroke", COLOR_PALETTE[1])
    .attr("stroke-width", 2.5)
    .attr("d", d3.line<ChartRow>().x(center).y((row) => line(asNumber(row[y2Field]) ?? 0)));
  g.selectAll("circle")
    .data(rows)
    .join("circle")
    .attr("cx", center)
    .attr("cy", (row) => line(asNumber(row[y2Field]) ?? 0))
    .attr("r", 4)
    .attr("fill", COLOR_PALETTE[1])
    .attr("stroke", "var(--card, #fff9f0)")
    .attr("stroke-width", 1.5)
    .append("title")
    .text((row) => `${formatCell(row[xField])}\n${y2Label}: ${fullNumber.format(asNumber(row[y2Field]) ?? 0)}`);

  axisTitle(svg, 48, 16, yLabel, "start");
  axisTitle(svg, width - 8, 16, y2Label, "end", COLOR_PALETTE[1]);
}

/** Column bars (single, grouped, stacked) and lines (single or one per series). */
function drawCategoryChart(input: DrawInput & { kind: string; barPlan: ReturnType<typeof buildBarChartRenderPlan> | null; lineSeries: string[] }) {
  const { svg, width, rows, xField, yField, yLabel, seriesField, kind, barPlan, lineSeries } = input;
  const multiLine = kind === "line" && seriesField && lineSeries.length > 0;
  const barRows = barPlan?.rows ?? rows;
  const categories = multiLine ? distinct(rows, xField) : barPlan?.categories ?? barRows.map((row) => formatCell(row[xField]));
  const tilt = shouldTilt(categories, width - 88);
  const height = 320;
  const { g, innerWidth, innerHeight } = frame(svg, width, height, { top: 32, right: 24, bottom: tilt ? 64 : 32, left: 56 });
  const xScale = d3.scaleBand().domain(categories).range([0, innerWidth]).padding(0.2);
  const center = (category: string) => (xScale(category) ?? 0) + xScale.bandwidth() / 2;
  const hasSeries = Boolean(barPlan?.seriesField);
  const seriesNames = barPlan?.series ?? [];
  const colorScale = d3.scaleOrdinal<string, string>().domain(seriesNames).range(COLOR_PALETTE);

  const values = multiLine
    ? rows.filter((row) => lineSeries.includes(formatCell(row[seriesField]))).map((row) => asNumber(row[yField]) ?? 0)
    : hasSeries
      ? barRows.map((row) =>
          barPlan?.kind === "stacked"
            ? d3.sum(seriesNames, (name) => asNumber(row[name]) ?? 0)
            : d3.max(seriesNames, (name) => asNumber(row[name]) ?? 0) ?? 0,
        )
      : barRows.map((row) => asNumber(row[yField]) ?? 0);
  const yScale = d3.scaleLinear().domain([Math.min(0, d3.min(values) ?? 0), d3.max(values) ?? 0]).nice().range([innerHeight, 0]);

  bandAxis(g, xScale, innerHeight, tilt);
  yAxisWithGrid(g, yScale, innerWidth);
  axisTitle(svg, 48, 14, yLabel, "start");

  if (kind === "line") {
    const groups = multiLine
      ? lineSeries.map((name, i) => ({ name, color: colorAt(i), rows: rows.filter((row) => formatCell(row[seriesField]) === name) }))
      : [{ name: "", color: COLOR_PALETTE[0], rows }];
    const path = d3.line<ChartRow>().x((row) => center(formatCell(row[xField]))).y((row) => yScale(asNumber(row[yField]) ?? 0)).curve(d3.curveMonotoneX);

    if (!multiLine) {
      // One series: a soft area under the line carries the magnitude.
      g.append("path")
        .datum(rows)
        .attr("fill", COLOR_PALETTE[1])
        .attr("fill-opacity", 0.15)
        .attr("d", d3.area<ChartRow>().x((row) => center(formatCell(row[xField]))).y0(yScale(0)).y1((row) => yScale(asNumber(row[yField]) ?? 0)).curve(d3.curveMonotoneX));
    }
    for (const group of groups) {
      g.append("path").datum(group.rows).attr("fill", "none").attr("stroke", group.color).attr("stroke-width", 2.5).attr("d", path);
      g.append("g")
        .selectAll("circle")
        .data(group.rows)
        .join("circle")
        .attr("cx", (row) => center(formatCell(row[xField])))
        .attr("cy", (row) => yScale(asNumber(row[yField]) ?? 0))
        .attr("r", groups.length > 1 ? 3 : 4)
        .attr("fill", multiLine ? group.color : COLOR_PALETTE[1])
        .append("title")
        .text((row) => `${group.name ? `${group.name} · ` : ""}${formatCell(row[xField])}: ${fullNumber.format(asNumber(row[yField]) ?? 0)}`);
    }
    return;
  }

  if (hasSeries && barPlan?.seriesField) {
    if (barPlan.kind === "stacked") {
      const stackedSeries = d3
        .stack<Record<string, unknown>>()
        .keys(seriesNames)
        .value((row, key) => asNumber(row[key]) ?? 0)(barRows);
      g.selectAll("g.stack-layer")
        .data(stackedSeries)
        .join("g")
        .attr("class", "stack-layer")
        .attr("fill", (d) => colorScale(d.key))
        .selectAll("rect")
        .data((layer) => layer.map((d) => ({ d, key: layer.key })))
        .join("rect")
        .attr("x", ({ d }) => xScale(formatCell(d.data[xField])) ?? 0)
        .attr("y", ({ d }) => yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("height", ({ d }) => Math.max(0, yScale(d[0]) - yScale(d[1])))
        .append("title")
        .text(({ d, key }) => `${formatCell(d.data[xField])} · ${key}: ${fullNumber.format(d[1] - d[0])}`);
    } else {
      const seriesScale = d3.scaleBand<string>().domain(seriesNames).range([0, xScale.bandwidth()]).padding(0.12);
      const grouped = barRows.flatMap((row) =>
        seriesNames.map((name) => ({ category: formatCell(row[xField]), series: name, value: asNumber(row[name]) ?? 0 })),
      );
      g.selectAll("rect.grouped-bar")
        .data(grouped)
        .join("rect")
        .attr("class", "grouped-bar")
        .attr("x", (d) => (xScale(d.category) ?? 0) + (seriesScale(d.series) ?? 0))
        .attr("y", (d) => yScale(Math.max(0, d.value)))
        .attr("width", seriesScale.bandwidth())
        .attr("height", (d) => Math.abs(yScale(d.value) - yScale(0)))
        .attr("rx", 4)
        .attr("fill", (d) => colorScale(d.series))
        .append("title")
        .text((d) => `${d.category} · ${d.series}: ${fullNumber.format(d.value)}`);
    }
    return;
  }

  // One series, one colour: colouring each bar differently implies
  // categories the data does not have. The top bar is picked out in
  // pod gold, the brand's one accent; the rest are a lighter cocoa.
  const topValue = d3.max(barRows, (row) => asNumber(row[yField]) ?? 0) ?? 0;
  const isTop = (row: ChartRow) => (asNumber(row[yField]) ?? 0) === topValue && topValue > 0;
  g.selectAll("rect")
    .data(barRows)
    .join("rect")
    .attr("x", (row) => xScale(formatCell(row[xField])) ?? 0)
    .attr("y", (row) => yScale(Math.max(0, asNumber(row[yField]) ?? 0)))
    .attr("width", xScale.bandwidth())
    .attr("height", (row) => Math.abs(yScale(asNumber(row[yField]) ?? 0) - yScale(0)))
    .attr("rx", 6)
    .attr("fill", (row) => (isTop(row) ? COLOR_PALETTE[1] : COLOR_PALETTE[0]))
    .attr("fill-opacity", (row) => (isTop(row) ? 1 : 0.72))
    .append("title")
    .text((row) => `${formatCell(row[xField])}: ${fullNumber.format(asNumber(row[yField]) ?? 0)}`);
}

export const D3ChartArtifact = memo(function D3ChartArtifact({
  chartType,
  title,
  spec,
}: D3ChartArtifactProps) {
  const containerId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);

  // The redraw effect lists `rows` in its dependencies. Computing it inline
  // produced a fresh array on every render, so every chart in the conversation
  // tore itself down and re-drew on every streamed token and every keystroke.
  const rows = useMemo(() => asRows(spec.data), [spec.data]);
  const kind = asText(spec.kind) || chartType || "bar";
  const xField = asText(spec.xField);
  const yField = asText(spec.yField);
  const seriesField = asText(spec.seriesField) || null;
  const y2Field = asText(spec.y2Field);
  const sizeField = asText(spec.sizeField);
  const labelField = asText(spec.labelField);
  const stacked = Boolean(spec.stacked);
  const legendLabel = asText(spec.legendLabel) || (seriesField ? humanizeDataLabel(seriesField) : "");
  const xLabel = asText(spec.xLabel) || humanizeDataLabel(xField);
  const yLabel = asText(spec.yLabel) || humanizeDataLabel(yField);
  const y2Label = asText(spec.y2Label) || humanizeDataLabel(y2Field);
  const sizeLabel = asText(spec.sizeLabel) || humanizeDataLabel(sizeField);
  const barPlan =
    kind === "bar" && xField && yField
      ? buildBarChartRenderPlan({
          rows,
          xField,
          yField,
          seriesField,
          stacked,
        })
      : null;
  const lineSeries = kind === "line" && seriesField ? topSeries(rows, seriesField, yField, SERIES_LIMIT) : [];
  const displayTitle =
    title ||
    asText(spec.title) ||
    (kind === "histogram"
      ? `Distribution of ${xLabel}`
      : xField && yField
        ? `${yLabel} by ${xLabel}`
        : "Visualization");

  const legend: Array<{ label: string; color: string; line?: boolean }> =
    kind === "pie"
      ? pieSlices(rows, xField, yField).map((slice, i) => ({ label: slice.label, color: colorAt(i) }))
      : kind === "combo" && y2Field
        ? [
            { label: yLabel, color: COLOR_PALETTE[0] },
            { label: y2Label, color: COLOR_PALETTE[1], line: true },
          ]
        : barPlan?.seriesField
          ? barPlan.series.map((name, i) => ({ label: name, color: colorAt(i) }))
          : lineSeries.map((name, i) => ({ label: name, color: colorAt(i), line: true }));
  const note =
    kind === "bubble" && sizeField
      ? `Bubble size shows ${sizeLabel}. The dashed line is the trend.`
      : kind === "scatter"
        ? "The dashed line is the trend."
        : kind === "heatmap"
          ? `Deeper colour means higher ${yLabel}.`
          : barPlan?.notice ?? "";

  useEffect(() => {
    const container = containerRef.current;
    const svgElement = svgRef.current;
    if (!container || !svgElement) {
      return;
    }

    const draw = () => {
      try {
        // Cleared per draw, so a redraw that succeeds (new data, or a resize)
        // also removes an error left by an earlier attempt.
        setDrawError(null);
        const svg = d3.select(svgElement);
        svg.selectAll("*").remove();
        const input: DrawInput = {
          svg,
          width: Math.max(container.getBoundingClientRect().width, 320),
          rows,
          xField,
          yField,
          xLabel,
          yLabel,
          seriesField,
          y2Field,
          y2Label,
          sizeField,
          sizeLabel,
          labelField,
        };

        if (kind === "pie") drawPie(input);
        else if (kind === "histogram") drawHistogram(input);
        else if (kind === "scatter" || kind === "bubble") drawPoints(input);
        else if (kind === "hbar") drawHBar(input);
        else if (kind === "heatmap" && seriesField) drawHeatmap(input);
        else if (kind === "combo" && y2Field) drawCombo(input);
        else drawCategoryChart({ ...input, kind, barPlan, lineSeries });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Chart rendering failed.";
        setDrawError(message);
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
    // barPlan, lineSeries and the labels are derived during render from the
    // values listed here. barPlan is a new object every render, so listing it
    // would redraw the chart on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, kind, xField, yField, rows, seriesField, stacked, spec]);

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
    <div className="border-b-2 border-border px-4 py-3">
      <h4 className="text-sm font-bold text-on-surface">{displayTitle}</h4>
    </div>
  );

  if (!xField || !yField) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-container-lowest">
        {header}
        <div className="flex items-center justify-center h-32 text-sm text-on-surface/50 border-dashed">
          Chart data is incomplete — missing axis fields
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-container-lowest">
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
        <div className="border-t-2 border-primary/10 px-4 py-2">
          {note ? <p className="mb-2 text-[11px] text-on-surface/55">{note}</p> : null}
          {legend.length > 0 ? (
            <div className="mb-2">
              {legendLabel && kind !== "pie" && kind !== "combo" ? (
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface/55">
                  {legendLabel}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                {legend.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-1.5 text-[11px] text-on-surface/70"
                  >
                    <span
                      className={item.line ? "inline-block h-0.5 w-3.5 rounded-full" : "inline-block h-2.5 w-2.5 rounded-full"}
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadSVG}
              className="rounded-[8px] border border-border px-3 py-1 text-xs font-bold text-on-surface hover:bg-accent transition-colors"
            >
              Download SVG
            </button>
            <button
              type="button"
              onClick={downloadCSV}
              className="rounded-[8px] border border-border px-3 py-1 text-xs font-bold text-on-surface hover:bg-accent transition-colors"
            >
              Download CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
