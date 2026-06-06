"use client";

import type { DatabaseSource } from "@/lib/queries/database-sources";
import type { LlmConnection, SaveLlmConnectionInput } from "@/lib/queries/llm-connections";
import { AlertCircle, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DatabaseSourceSection } from "./DatabaseSourceSection";
import { LlmConnectionSection } from "./LlmConnectionSection";
import { type ConnectionActionKind } from "./LlmConnectionCard";
import { useChatStore } from "../store/useChatStore";

export function ChatConnectionPicker({
  databaseSources,
  llmConnections,
  isLoading,
  isRefreshing,
  error,
  activeSourceId,
  activeLlmConnectionId,
  isCreatingConversation,
  isCreatingLlmConnection,
  createLlmError,
  onRetry,
  onCreateLlmConnection,
  onActivateLlmConnection,
  onDeactivateLlmConnection,
  onDeleteLlmConnection,
  onConfirmSelection,
}: {
  databaseSources: DatabaseSource[] | undefined;
  llmConnections: LlmConnection[] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  activeSourceId: string | null;
  activeLlmConnectionId: string | null;
  isCreatingConversation: boolean;
  isCreatingLlmConnection: boolean;
  createLlmError: Error | null;
  onRetry: () => void;
  onCreateLlmConnection: (input: SaveLlmConnectionInput) => Promise<void>;
  onActivateLlmConnection: (connectionId: string) => Promise<void>;
  onDeactivateLlmConnection: (connectionId: string) => Promise<void>;
  onDeleteLlmConnection: (connectionId: string) => Promise<void>;
  onConfirmSelection: (selection: { source: DatabaseSource; llmConnection: LlmConnection }) => void;
}) {
  const isOpen = useChatStore((s) => s.isConnectionPickerOpen);
  const startInAddLlmMode = useChatStore((s) => s.pickerStartsInAddLlmMode);
  const closePicker = useChatStore((s) => s.closePicker);

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(activeSourceId);
  const [selectedLlmConnectionId, setSelectedLlmConnectionId] = useState<string | null>(activeLlmConnectionId);
  const [isAddConnectionFormOpen, setIsAddConnectionFormOpen] = useState(false);
  const [connectionActionState, setConnectionActionState] = useState<{ id: string; action: ConnectionActionKind } | null>(null);
  const [connectionActionError, setConnectionActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSourceId(activeSourceId);
    setSelectedLlmConnectionId(activeLlmConnectionId);
  }, [activeLlmConnectionId, activeSourceId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!llmConnections?.length) setIsAddConnectionFormOpen(true);
  }, [isOpen, llmConnections]);

  useEffect(() => {
    if (!isOpen) return;
    if (startInAddLlmMode) setIsAddConnectionFormOpen(true);
  }, [isOpen, startInAddLlmMode]);

  const readyLlmConnections = llmConnections?.filter((c) => c.isActive && c.status === "SUCCESS") ?? [];
  const failedLlmConnections = llmConnections?.filter((c) => c.isActive && c.status !== "SUCCESS") ?? [];
  const inactiveLlmConnections = llmConnections?.filter((c) => !c.isActive) ?? [];
  const selectedSource = databaseSources?.find((s) => s.id === selectedSourceId);
  const selectedLlmConnection = llmConnections?.find((c) => c.id === selectedLlmConnectionId);
  const hasValidSelection = !!selectedSource?.canStartChat && !!selectedLlmConnection?.canStartChat;

  if (!isOpen) return null;

  async function handleConnectionAction(action: ConnectionActionKind, connectionId: string) {
    setConnectionActionError(null);
    setConnectionActionState({ id: connectionId, action });

    try {
      if (action === "activate") {
        await onActivateLlmConnection(connectionId);
        setSelectedLlmConnectionId(connectionId);
      } else if (action === "deactivate") {
        await onDeactivateLlmConnection(connectionId);
        if (selectedLlmConnectionId === connectionId) setSelectedLlmConnectionId(null);
      } else {
        await onDeleteLlmConnection(connectionId);
        if (selectedLlmConnectionId === connectionId) setSelectedLlmConnectionId(null);
      }
    } catch (error) {
      setConnectionActionError(
        error instanceof Error ? error.message : "Unable to update this LLM connection.",
      );
    } finally {
      setConnectionActionState(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/35 px-4 py-6 backdrop-blur-sm md:px-6 md:py-10">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-[0_35px_90px_-24px_rgba(27,28,28,0.28)] md:rounded-[32px]" style={{ maxHeight: "calc(100dvh - 3rem)" }}>
        <div className="flex items-start justify-between gap-6 border-b border-outline-variant/15 px-5 py-5 md:px-8 md:py-6">
          <div className="space-y-2">
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">New Chat</p>
            <div>
              <h3 className="font-headline text-3xl italic text-primary">Choose your runtime stack</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface/65">
                Start each conversation with both an indexed data source and a validated LLM connection.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              closePicker();
              setIsAddConnectionFormOpen(false);
            }}
            className="rounded-full border border-outline-variant/20 p-2 text-on-surface/60 transition-colors hover:bg-surface-container-low hover:text-primary"
            aria-label="Close connection picker"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-outline-variant/20 bg-surface-container-low">
              <LoaderCircle size={24} className="animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold text-on-surface">Loading chat options</p>
                <p className="mt-1 text-sm text-on-surface/60">Pulling your saved data sources and LLM connections from the backend.</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-[28px] border border-rose-200/70 bg-rose-50/70 px-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertCircle size={22} />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-rose-900">Unable to load chat options</p>
                <p className="text-sm leading-relaxed text-rose-800/80">{error.message}</p>
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-full bg-rose-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-on-surface/50">
                <span>
                  {databaseSources?.length ?? 0} data source{(databaseSources?.length ?? 0) === 1 ? "" : "s"} ·{" "}
                  {readyLlmConnections.length} ready LLM connection{readyLlmConnections.length === 1 ? "" : "s"}
                  {failedLlmConnections.length ? ` · ${failedLlmConnections.length} failed` : ""}
                  {inactiveLlmConnections.length ? ` · ${inactiveLlmConnections.length} inactive` : ""}
                </span>
                {isRefreshing ? (
                  <span className="inline-flex items-center gap-2 font-medium text-primary">
                    <LoaderCircle size={14} className="animate-spin" /> Refreshing
                  </span>
                ) : null}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
                <DatabaseSourceSection
                  databaseSources={databaseSources}
                  selectedSourceId={selectedSourceId}
                  onSelect={setSelectedSourceId}
                />
                <LlmConnectionSection
                  llmConnections={llmConnections}
                  selectedLlmConnectionId={selectedLlmConnectionId}
                  isAddConnectionFormOpen={isAddConnectionFormOpen}
                  isCreatingLlmConnection={isCreatingLlmConnection}
                  createLlmError={createLlmError}
                  connectionActionState={connectionActionState}
                  connectionActionError={connectionActionError}
                  onSelect={setSelectedLlmConnectionId}
                  onToggleAddForm={setIsAddConnectionFormOpen}
                  onCreateLlmConnection={async (input) => {
                    await onCreateLlmConnection(input);
                    setIsAddConnectionFormOpen(false);
                  }}
                  onConnectionAction={handleConnectionAction}
                />
              </div>

              <div className="flex items-center justify-between rounded-[24px] border border-outline-variant/15 bg-surface-container-low px-5 py-4">
                <div className="space-y-1">
                  <p className="font-label text-[10px] uppercase tracking-[0.22em] text-primary">Ready state</p>
                  <p className="text-sm text-on-surface/65">
                    {hasValidSelection && selectedSource && selectedLlmConnection
                      ? `Starting with ${selectedSource.label} and ${selectedLlmConnection.label}.`
                      : "Select one healthy database source and one healthy LLM connection to continue."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!hasValidSelection || isCreatingConversation}
                  onClick={() => {
                    if (hasValidSelection && selectedSource && selectedLlmConnection) {
                      onConfirmSelection({ source: selectedSource, llmConnection: selectedLlmConnection });
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingConversation ? <LoaderCircle size={14} className="animate-spin" /> : null}
                  {isCreatingConversation ? "Starting..." : "Start chat"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
