"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle, Sparkles } from "lucide-react";
import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import type { ConversationDetails } from "@/lib/queries/conversations";
import type { LlmConnection } from "@/lib/queries/llm-connections";

export function ConversationRuntimePanel({
  conversation,
  availableConnections,
  isPending,
  error,
  onSwitchConnection,
  onChangeModel,
  onReactivateConnection,
}: {
  conversation: ConversationDetails;
  availableConnections: LlmConnection[];
  isPending: boolean;
  error: Error | null;
  onSwitchConnection: (llmConnectionId: string) => Promise<void>;
  onChangeModel: (value: string | null) => Promise<void>;
  onReactivateConnection: (llmConnectionId: string) => Promise<void>;
}) {
  const readyConnections = useMemo(
    () => availableConnections.filter((connection) => connection.canStartChat),
    [availableConnections],
  );
  const currentConnection = conversation.llmConnection;
  const [selectedConnectionId, setSelectedConnectionId] = useState(
    currentConnection?.canStartChat ? currentConnection.id : (readyConnections[0]?.id ?? ""),
  );
  const [draftModel, setDraftModel] = useState(
    conversation.runtime.effectiveModel ?? "",
  );

  const isCurrentConnectionReady = currentConnection?.canStartChat ?? false;
  const effectiveSelectedConnectionId = readyConnections.some(
    (connection) => connection.id === selectedConnectionId,
  )
    ? selectedConnectionId
    : currentConnection?.canStartChat
      ? currentConnection.id
      : (readyConnections[0]?.id ?? "");
  const hasConnectionChange =
    !!effectiveSelectedConnectionId &&
    effectiveSelectedConnectionId !== currentConnection?.id;
  const normalizedDraftModel = draftModel.trim();
  const shouldUseDefaultModel =
    !normalizedDraftModel ||
    normalizedDraftModel === (currentConnection?.defaultModel.trim() ?? "");
  const hasModelChange =
    isCurrentConnectionReady &&
    (conversation.llmModelOverride ?? null) !==
      (shouldUseDefaultModel ? null : normalizedDraftModel);

  async function handleSaveModel() {
    await onChangeModel(shouldUseDefaultModel ? null : normalizedDraftModel);
  }

  return (
    <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-low px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Runtime
          </p>
          <div>
            <p className="text-base font-semibold text-on-surface">
              {conversation.runtime.effectiveModel
                ? `${conversation.llmConnection?.label ?? "Missing connection"} · ${conversation.runtime.effectiveModel}`
                : "Select a runtime to continue."}
            </p>
            <p className="mt-1 text-sm text-on-surface/60">
              {conversation.llmModelOverride
                ? "Conversation-specific model override is active."
                : "Using the saved connection default model."}
            </p>
          </div>
        </div>

        {!conversation.runtime.isAvailableForChat && conversation.runtime.warning ? (
          <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{conversation.runtime.warning}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
              Data Source
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container/60">
                <DatabaseLogo provider={conversation.databaseSource.provider} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-on-surface">
                  {conversation.databaseSource.label}
                </p>
                <p className="text-xs text-on-surface/55">
                  {conversation.databaseSource.provider}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
              Saved Connection
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container/60">
                {currentConnection ? (
                  <LlmProviderLogo provider={currentConnection.provider} className="h-5 w-5" />
                ) : (
                  <Sparkles size={16} className="text-on-surface/40" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-on-surface">
                  {currentConnection?.label ?? "Missing saved connection"}
                </p>
                <p className="text-xs text-on-surface/55">
                  {currentConnection
                    ? `${currentConnection.provider} · ${currentConnection.defaultModel}`
                    : "Switch to another active connection to continue."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-on-surface">Switch saved connection</p>
                <p className="mt-1 text-xs text-on-surface/55">
                  Choose another active, validated connection for this conversation.
                </p>
              </div>
              {currentConnection && !currentConnection.isActive ? (
                <button
                  type="button"
                  onClick={() => void onReactivateConnection(currentConnection.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <LoaderCircle size={12} className="animate-spin" />
                  ) : null}
                  Reactivate
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <label className="min-w-0 flex-1 space-y-2 text-sm">
                <span className="sr-only">Saved connection</span>
                <select
                  value={effectiveSelectedConnectionId}
                  onChange={(event) => setSelectedConnectionId(event.target.value)}
                  disabled={!readyConnections.length || isPending}
                  className="w-full rounded-2xl border border-outline-variant/25 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {readyConnections.length
                      ? "Select an active LLM connection"
                      : "No active LLM connections available"}
                  </option>
                  {readyConnections.map((connection) => (
                    <option key={connection.id} value={connection.id}>
                      {connection.label} · {connection.defaultModel}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => void onSwitchConnection(effectiveSelectedConnectionId)}
                disabled={!hasConnectionChange || isPending}
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Updating..." : "Switch connection"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-on-surface">Conversation model</p>
              <p className="mt-1 text-xs text-on-surface/55">
                Override the saved default only for this conversation.
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <label className="min-w-0 flex-1 space-y-2 text-sm">
                <span className="sr-only">Conversation model override</span>
                <input
                  value={draftModel}
                  onChange={(event) => setDraftModel(event.target.value)}
                  disabled={!currentConnection || isPending}
                  placeholder={currentConnection?.defaultModel ?? "Select a connection first"}
                  className="w-full rounded-2xl border border-outline-variant/25 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <button
                type="button"
                onClick={() => void handleSaveModel()}
                disabled={!hasModelChange || isPending}
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save model"}
              </button>

              <button
                type="button"
                onClick={() => void onChangeModel(null)}
                disabled={
                  !conversation.llmModelOverride ||
                  !currentConnection ||
                  !isCurrentConnectionReady ||
                  isPending
                }
                className="inline-flex items-center justify-center rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface/70 transition-colors hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Use saved default
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error.message}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
