"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import type { ConversationMessage } from "@/lib/queries/conversations";

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
          className="flex items-center gap-1.5 text-xs text-on-surface/40 transition hover:text-on-surface/65"
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
                className="flex items-center gap-2 text-xs text-on-surface/35"
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
        <span>Processing...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step) => (
        <div key={step.seq} className="flex items-center gap-2 text-sm text-on-surface/55">
          {step.done ? (
            <CheckCircle2 size={14} className="shrink-0 text-green-500" />
          ) : (
            <LoaderCircle size={14} className="shrink-0 animate-spin" />
          )}
          <span className={step.done ? "text-on-surface/35" : ""}>{step.text}</span>
        </div>
      ))}
    </div>
  );
}
