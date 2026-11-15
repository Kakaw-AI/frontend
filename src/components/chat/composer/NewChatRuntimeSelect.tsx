"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DatabaseSource } from "@/lib/queries/database-sources";
import type { LlmConnection } from "@/lib/queries/llm-connections";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useChatStore } from "../store/useChatStore";

/** Source + model pickers shown above the composer on the new-chat screen. */
export function NewChatRuntimeSelect({
  sources,
  models,
  sourceId,
  modelId,
  error,
  onChange,
}: {
  sources: DatabaseSource[];
  models: LlmConnection[];
  sourceId: string | null;
  modelId: string | null;
  error: string | null;
  onChange: (selection: { databaseSourceId: string | null; llmConnectionId: string | null }) => void;
}) {
  const openAddLlmPicker = useChatStore((s) => s.openAddLlmPicker);
  const linkClass = "text-xs font-bold text-primary underline underline-offset-2";

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      {sources.length ? (
        <Select
          value={sourceId ?? ""}
          onValueChange={(id: string | null) => onChange({ databaseSourceId: id, llmConnectionId: modelId })}
        >
          <SelectTrigger aria-label="Database" className="w-full sm:w-60">
            <SelectValue placeholder="Choose a database">
              {(id: string | null) => sources.find((s) => s.id === id)?.label ?? "Choose a database"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Link href="/onboarding/database" className={linkClass}>Connect a database</Link>
      )}

      {models.length ? (
        <Select
          value={modelId ?? ""}
          onValueChange={(id: string | null) => onChange({ databaseSourceId: sourceId, llmConnectionId: id })}
        >
          <SelectTrigger aria-label="Model" className="w-full sm:w-60">
            <SelectValue placeholder="Choose a model">
              {(id: string | null) => models.find((c) => c.id === id)?.label ?? "Choose a model"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {models.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label} · {c.defaultModel}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <button type="button" onClick={openAddLlmPicker} className={linkClass}>Add a model</button>
      )}

      {error ? (
        <span className="flex items-center gap-1.5 text-xs text-rose-700">
          <AlertTriangle size={12} />
          {error}
        </span>
      ) : null}
    </div>
  );
}
