"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import { databaseTerms } from "@/lib/database-terms";
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
    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {sources.length ? (
        <Select
          value={sourceId ?? ""}
          onValueChange={(id: string | null) => onChange({ databaseSourceId: id, llmConnectionId: modelId })}
        >
          <SelectTrigger aria-label="Database" className="w-full text-[13px] sm:w-64">
            <SelectValue placeholder="Choose a database">
              {(id: string | null) => {
                const source = sources.find((s) => s.id === id);
                return source ? <SourceOption source={source} /> : "Choose a database";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}><SourceOption source={s} /></SelectItem>
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
          <SelectTrigger aria-label="Model" className="w-full text-[13px] sm:w-52">
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
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <AlertTriangle size={12} />
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Logo, name and database type, so two sources with similar names stay apart. */
function SourceOption({ source }: { source: DatabaseSource }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <DatabaseLogo provider={source.provider} className="h-4 w-4 shrink-0" />
      <span className="truncate">{source.label}</span>
      <span className="shrink-0 text-on-surface-variant">{databaseTerms(source.provider).name}</span>
    </span>
  );
}
