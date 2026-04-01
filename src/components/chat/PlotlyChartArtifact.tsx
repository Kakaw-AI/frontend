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
    };
  }
}

type PlotlyChartArtifactProps = {
  chartType?: string;
  title?: string;
  spec: Record<string, unknown>;
  config?: Record<string, unknown>;
};

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
    const layout =
      spec.layout && typeof spec.layout === "object"
        ? spec.layout
        : {};
    const mergedLayout = {
      autosize: true,
      ...(layout as Record<string, unknown>),
    };
    const mergedConfig = {
      responsive: true,
      displaylogo: false,
      ...(config ?? {}),
    };

    return {
      data,
      layout: mergedLayout,
      config: mergedConfig,
    };
  }, [config, spec]);

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

      <div className="border-b border-outline-variant/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/45">
        {title?.trim() || chartType || "Chart"}
      </div>
      <div ref={containerRef} className="min-h-80 w-full px-2 py-2" />
    </div>
  );
}
