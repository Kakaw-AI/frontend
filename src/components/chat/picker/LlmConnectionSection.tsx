"use client";

import type { LlmConnection, SaveLlmConnectionInput } from "@/lib/queries/llm-connections";
import { AlertCircle, Plus, X } from "lucide-react";
import { AddLlmConnectionForm } from "./AddLlmConnectionForm";
import { type ConnectionActionKind, LlmConnectionCard } from "./LlmConnectionCard";

export function LlmConnectionSection({
  llmConnections,
  isAddConnectionFormOpen,
  isCreatingLlmConnection,
  createLlmError,
  connectionActionState,
  connectionActionError,
  onToggleAddForm,
  onCreateLlmConnection,
  onConnectionAction,
}: {
  llmConnections: LlmConnection[] | undefined;
  isAddConnectionFormOpen: boolean;
  isCreatingLlmConnection: boolean;
  createLlmError: Error | null;
  connectionActionState: { id: string; action: ConnectionActionKind } | null;
  connectionActionError: string | null;
  onToggleAddForm: (open: boolean) => void;
  onCreateLlmConnection: (input: SaveLlmConnectionInput) => Promise<void>;
  onConnectionAction: (action: ConnectionActionKind, connectionId: string) => Promise<void>;
}) {
  const active = llmConnections?.filter((c) => c.isActive) ?? [];
  const inactive = llmConnections?.filter((c) => !c.isActive) ?? [];

  const card = (connection: LlmConnection, actions: ConnectionActionKind[]) => (
    <LlmConnectionCard
      key={connection.id}
      connection={connection}
      actions={actions}
      busyAction={connectionActionState?.id === connection.id ? connectionActionState.action : null}
      disabled={connectionActionState !== null}
      onAction={(action) => void onConnectionAction(action, connection.id)}
    />
  );

  return (
    <section aria-labelledby="models-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id="models-title" className="pod-label">Models</h3>
        <button
          type="button"
          onClick={() => onToggleAddForm(!isAddConnectionFormOpen)}
          aria-expanded={isAddConnectionFormOpen}
          className="pod-btn-ghost py-1.5 text-xs"
        >
          {isAddConnectionFormOpen ? <X size={14} aria-hidden /> : <Plus size={14} aria-hidden />}
          {isAddConnectionFormOpen ? "Cancel" : "Add model"}
        </button>
      </div>

      {isAddConnectionFormOpen ? (
        <AddLlmConnectionForm
          isCreatingLlmConnection={isCreatingLlmConnection}
          createLlmError={createLlmError}
          onCreateLlmConnection={onCreateLlmConnection}
        />
      ) : null}

      {connectionActionError ? (
        <p className="pod-alert" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {connectionActionError}
        </p>
      ) : null}

      {active.length ? (
        <ul className="space-y-2">{active.map((c) => card(c, ["deactivate", "delete"]))}</ul>
      ) : !isAddConnectionFormOpen ? (
        <p className="rounded-2xl border-2 border-dashed border-primary/30 px-4 py-6 text-center text-sm text-on-surface-variant">
          No models turned on.
        </p>
      ) : null}

      {inactive.length ? (
        <details className="group">
          <summary className="cursor-pointer text-sm font-bold text-on-surface-variant hover:text-on-surface">
            Turned off ({inactive.length})
          </summary>
          <ul className="mt-2 space-y-2">{inactive.map((c) => card(c, ["activate", "delete"]))}</ul>
        </details>
      ) : null}
    </section>
  );
}
