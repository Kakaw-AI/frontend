"use client";

import { buildIdleStepMessage } from "@/components/chat/step-log-state";
import type { ConversationMessage } from "@/lib/queries/conversations";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function StepLog({ message }: { message: ConversationMessage }) {
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
          className="flex items-center gap-1.5 text-xs text-on-surface/40 transition hover:text-on-surface/65 "
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
                className="flex items-center gap-2 text-xs text-on-surface/35 "
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
        <span>{buildIdleStepMessage()}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step) => (
        <div key={step.seq} className="flex items-center gap-2 text-sm text-on-surface/55 wrap-break-word">
          {step.done ? (
            <CheckCircle2 size={14} className="shrink-0 text-green-500" />
          ) : (
            <LoaderCircle size={14} className="shrink-0 animate-spin" />
          )}
          <span className={step.done ? "text-on-surface/35 " : ""}>
            {step.text}
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
  return seconds >= 3 ? <span className="tabular-nums text-on-surface/35"> · {seconds}s</span> : null;
}
