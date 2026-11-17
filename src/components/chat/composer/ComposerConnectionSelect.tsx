"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LlmConnection } from "@/lib/queries/llm-connections";
import { AlertTriangle } from "lucide-react";

export function ComposerConnectionSelect({
  activeConnectionId,
  readyConnections,
  isPending,
  visibleComposerError,
  onSwitch,
}: {
  activeConnectionId: string | null;
  readyConnections: LlmConnection[];
  isPending: boolean;
  visibleComposerError: string | null;
  onSwitch: (id: string | null) => void;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <Select
        value={activeConnectionId ?? ""}
        onValueChange={(id: string | null) => {
          if (id) onSwitch(id);
        }}
        disabled={isPending || !readyConnections.length}
      >
        <SelectTrigger className="w-full text-[13px] sm:w-52">
          <SelectValue placeholder="No connection">
            {(id: string | null) =>
              readyConnections.find((c) => c.id === id)?.label ?? "No connection"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {readyConnections.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label} · {c.defaultModel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {visibleComposerError ? (
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <AlertTriangle size={12} />
          {visibleComposerError}
        </span>
      ) : null}
    </div>
  );
}
