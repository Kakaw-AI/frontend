"use client";

import { TextShimmer } from "@/components/amicro/text-shimmer";
import { buildIdleStepMessage, shouldCollapseCompletedSteps } from "@/components/chat/step-log-state";
import type { ConversationMessage } from "@/lib/queries/conversations";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function StepLog({ message }: { message: ConversationMessage }) {
  const steps = message.steps ?? [];
  // Decided from the status as well, so an answer loaded from the server folds too.
  const collapsed = message.stepsCollapsed || shouldCollapseCompletedSteps(message.status);
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
          aria-expanded={expanded}
          className="-mx-1 flex items-center gap-1.5 rounded-md px-1 py-1 text-xs text-on-surface-variant transition hover:bg-accent/60 hover:text-on-surface"
        >
          <CheckCircle2 size={12} className="text-chart-3" />
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
                className="flex items-center gap-2 text-xs text-on-surface-variant"
              >
                <CheckCircle2 size={11} className="shrink-0 text-chart-3" />
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
      <div className="flex items-center gap-2 text-[13px] text-on-surface-variant">
        <TextShimmer>{buildIdleStepMessage()}</TextShimmer>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step) => (
        <div
          key={step.seq}
          className="flex items-center gap-2 text-[13px] text-on-surface wrap-break-word"
        >
          {step.done ? (
            <CheckCircle2 size={13} className="shrink-0 text-chart-3" />
          ) : (
            <LoaderCircle
              size={13}
              className="shrink-0 animate-spin text-on-surface-variant"
            />
          )}
          <span className={step.done ? "text-on-surface-variant" : ""}>
            {step.done ? step.text : <TextShimmer>{step.text}</TextShimmer>}
            {step.done ? null : <RunningFor />}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Seconds the current step has been on screen. SQL drafts on reasoning models
 * can take 30 s or more with nothing else changing; a ticking count shows the
 * reply is still alive. Remounts, and so restarts, with each new step.
 */
function RunningFor() {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.floor((now - startedAt) / 1000);
  return seconds >= 3 ? (
    <span className="tabular-nums text-on-surface-variant"> · {seconds}s</span>
  ) : null;
}
