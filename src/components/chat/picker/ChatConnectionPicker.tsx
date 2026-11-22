"use client";

import type { DatabaseSource } from "@/lib/queries/database-sources";
import type { LlmConnection, SaveLlmConnectionInput } from "@/lib/queries/llm-connections";
import { AlertCircle, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DatabaseSourceSection, type SourceActionKind } from "./DatabaseSourceSection";
import { LlmConnectionSection } from "./LlmConnectionSection";
import { type ConnectionActionKind } from "./LlmConnectionCard";
import { useChatStore } from "../store/useChatStore";

/** Manage databases and models. Starting a chat happens on the new-chat screen. */
export function ChatConnectionPicker({
  databaseSources,
  llmConnections,
  isLoading,
  error,
  isCreatingLlmConnection,
  createLlmError,
  onRetry,
  onCreateLlmConnection,
  onActivateLlmConnection,
  onDeactivateLlmConnection,
  onDeleteLlmConnection,
  onDeleteDatabaseSource,
  onResyncDatabaseSource,
}: {
  databaseSources: DatabaseSource[] | undefined;
  llmConnections: LlmConnection[] | undefined;
  isLoading: boolean;
  error: Error | null;
  isCreatingLlmConnection: boolean;
  createLlmError: Error | null;
  onRetry: () => void;
  onCreateLlmConnection: (input: SaveLlmConnectionInput) => Promise<void>;
  onActivateLlmConnection: (connectionId: string) => Promise<void>;
  onDeactivateLlmConnection: (connectionId: string) => Promise<void>;
  onDeleteLlmConnection: (connectionId: string) => Promise<void>;
  /** Resolves false when the user cancels the confirmation. */
  onDeleteDatabaseSource: (sourceId: string) => Promise<boolean>;
  onResyncDatabaseSource: (sourceId: string) => Promise<void>;
}) {
  const isOpen = useChatStore((s) => s.isConnectionPickerOpen);
  const startInAddLlmMode = useChatStore((s) => s.pickerStartsInAddLlmMode);
  const closePicker = useChatStore((s) => s.closePicker);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [isAddConnectionFormOpen, setIsAddConnectionFormOpen] = useState(startInAddLlmMode);
  const [connectionActionState, setConnectionActionState] = useState<{ id: string; action: ConnectionActionKind } | null>(null);
  const [connectionActionError, setConnectionActionError] = useState<string | null>(null);
  const [busySource, setBusySource] = useState<{ id: string; action: SourceActionKind } | null>(null);
  const [sourceActionError, setSourceActionError] = useState<string | null>(null);

  // Native modal: focus trap, Esc to close and the backdrop come for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && llmConnections && !llmConnections.length) setIsAddConnectionFormOpen(true);
  }, [isOpen, llmConnections]);

  async function handleConnectionAction(action: ConnectionActionKind, connectionId: string) {
    setConnectionActionError(null);
    setConnectionActionState({ id: connectionId, action });
    try {
      if (action === "activate") await onActivateLlmConnection(connectionId);
      else if (action === "deactivate") await onDeactivateLlmConnection(connectionId);
      else await onDeleteLlmConnection(connectionId);
    } catch (error) {
      setConnectionActionError(error instanceof Error ? error.message : "Unable to update this model.");
    } finally {
      setConnectionActionState(null);
    }
  }

  async function handleSourceAction(action: SourceActionKind, sourceId: string) {
    setSourceActionError(null);
    setBusySource({ id: sourceId, action });
    try {
      await (action === "delete" ? onDeleteDatabaseSource(sourceId) : onResyncDatabaseSource(sourceId));
    } catch (error) {
      setSourceActionError(error instanceof Error ? error.message : `Unable to ${action} this database.`);
    } finally {
      setBusySource(null);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={closePicker}
      aria-labelledby="connections-title"
      className="m-auto w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-lg border border-border bg-surface p-0 text-on-surface backdrop:bg-on-surface/35 backdrop:backdrop-blur-sm"
    >
      {isOpen ? (
        <div className="flex max-h-[calc(100dvh-3rem)] flex-col">
          <header className="flex items-center justify-between gap-4 border-b-2 border-primary/10 px-5 py-4 md:px-6">
            <h2 id="connections-title" className="font-headline text-2xl text-on-surface">Databases and models</h2>
            <button type="button" onClick={closePicker} className="rounded-full p-2 transition-colors hover:bg-surface-container" aria-label="Close">
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 md:px-6">
            {isLoading ? (
              <p className="flex items-center justify-center gap-2 py-16 text-sm text-on-surface-variant">
                <LoaderCircle size={16} className="animate-spin" aria-hidden />
                Loading
              </p>
            ) : error ? (
              <div className="space-y-4 py-8">
                <p className="pod-alert" role="alert">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                  {error.message}
                </p>
                <button type="button" onClick={onRetry} className="pod-btn-ghost">
                  <RefreshCw size={14} aria-hidden />
                  Try again
                </button>
              </div>
            ) : (
              <>
                <DatabaseSourceSection
                  databaseSources={databaseSources}
                  busySource={busySource}
                  actionError={sourceActionError}
                  onAction={(action, id) => void handleSourceAction(action, id)}
                />
                <LlmConnectionSection
                  llmConnections={llmConnections}
                  isAddConnectionFormOpen={isAddConnectionFormOpen}
                  isCreatingLlmConnection={isCreatingLlmConnection}
                  createLlmError={createLlmError}
                  connectionActionState={connectionActionState}
                  connectionActionError={connectionActionError}
                  onToggleAddForm={setIsAddConnectionFormOpen}
                  onCreateLlmConnection={async (input) => {
                    await onCreateLlmConnection(input);
                    setIsAddConnectionFormOpen(false);
                  }}
                  onConnectionAction={handleConnectionAction}
                />
              </>
            )}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
