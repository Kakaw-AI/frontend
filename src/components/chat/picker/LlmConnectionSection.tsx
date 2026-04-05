"use client";

import type { LlmConnection, SaveLlmConnectionInput } from "@/lib/queries/llm-connections";
import { ChevronDown, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { AddLlmConnectionForm } from "./AddLlmConnectionForm";
import { type ConnectionActionKind, LlmConnectionCard } from "./LlmConnectionCard";

export function LlmConnectionSection({
  llmConnections,
  selectedLlmConnectionId,
  isAddConnectionFormOpen,
  githubLinked,
  isLinkingGithub,
  linkGithubError,
  isCreatingLlmConnection,
  createLlmError,
  connectionActionState,
  connectionActionError,
  onSelect,
  onToggleAddForm,
  onLinkGithub,
  onCreateLlmConnection,
  onConnectionAction,
}: {
  llmConnections: LlmConnection[] | undefined;
  selectedLlmConnectionId: string | null;
  isAddConnectionFormOpen: boolean;
  githubLinked: boolean;
  isLinkingGithub: boolean;
  linkGithubError: Error | null;
  isCreatingLlmConnection: boolean;
  createLlmError: Error | null;
  connectionActionState: { id: string; action: ConnectionActionKind } | null;
  connectionActionError: string | null;
  onSelect: (id: string | null) => void;
  onToggleAddForm: (open: boolean) => void;
  onLinkGithub: () => void;
  onCreateLlmConnection: (input: SaveLlmConnectionInput) => Promise<void>;
  onConnectionAction: (action: ConnectionActionKind, connectionId: string) => Promise<void>;
}) {
  const [isInactiveLlmSectionOpen, setIsInactiveLlmSectionOpen] = useState(false);

  const readyLlmConnections =
    llmConnections?.filter(
      (connection) => connection.isActive && connection.status === "SUCCESS",
    ) ?? [];
  const failedLlmConnections =
    llmConnections?.filter(
      (connection) => connection.isActive && connection.status !== "SUCCESS",
    ) ?? [];
  const inactiveLlmConnections =
    llmConnections?.filter((connection) => !connection.isActive) ?? [];

  const isConnectionActionPending = connectionActionState !== null;

  return (
    <section className="space-y-4 rounded-[28px] border border-outline-variant/15 bg-surface-container-low p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.22em] text-primary">
            Step 2
          </p>
          <h4 className="mt-1 text-lg font-semibold text-on-surface">LLM connection</h4>
        </div>

        <button
          type="button"
          onClick={() => onToggleAddForm(!isAddConnectionFormOpen)}
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/25 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface/70 transition-colors hover:border-primary/35 hover:text-primary"
        >
          <Plus size={14} />
          {isAddConnectionFormOpen ? "Close" : "Add LLM"}
        </button>
      </div>

      {isAddConnectionFormOpen ? (
        <AddLlmConnectionForm
          githubLinked={githubLinked}
          isLinkingGithub={isLinkingGithub}
          linkGithubError={linkGithubError}
          isCreatingLlmConnection={isCreatingLlmConnection}
          createLlmError={createLlmError}
          onLinkGithub={onLinkGithub}
          onCreateLlmConnection={onCreateLlmConnection}
        />
      ) : null}

      {!llmConnections?.length ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-outline-variant/20 bg-surface-container-lowest px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-primary">
            <Sparkles size={22} />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-on-surface">No LLM connections found</p>
            <p className="text-sm leading-relaxed text-on-surface/60">
              Add one now so chats can run against a validated provider.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {readyLlmConnections.length ? (
            <div className="grid gap-3">
              {readyLlmConnections.map((connection) => {
                const selected = selectedLlmConnectionId === connection.id;
                const isBusy = connectionActionState?.id === connection.id;

                return (
                  <LlmConnectionCard
                    key={connection.id}
                    connection={connection}
                    selected={selected}
                    onSelect={() => onSelect(connection.id)}
                    actions={[
                      {
                        action: "deactivate",
                        label: "Deactivate",
                        onClick: () => void onConnectionAction("deactivate", connection.id),
                        disabled: isConnectionActionPending,
                        busy: isBusy && connectionActionState?.action === "deactivate",
                      },
                      {
                        action: "delete",
                        label: "Delete",
                        onClick: () => void onConnectionAction("delete", connection.id),
                        disabled: isConnectionActionPending,
                        busy: isBusy && connectionActionState?.action === "delete",
                      },
                    ]}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-outline-variant/20 bg-surface-container-lowest px-6 py-5 text-center">
              <p className="font-semibold text-on-surface">
                No active LLM connections available
              </p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface/60">
                Add a new connection or expand the inactive list to review saved connections
                that need attention.
              </p>
            </div>
          )}

          {failedLlmConnections.length ? (
            <div className="space-y-3 rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest p-4">
              <div>
                <p className="font-semibold text-on-surface">Failed health checks</p>
                <p className="mt-1 text-sm text-on-surface/60">
                  These connections are active but currently not healthy enough to start new
                  chats.
                </p>
              </div>

              <div className="grid gap-3">
                {failedLlmConnections.map((connection) => {
                  const selected = selectedLlmConnectionId === connection.id;
                  const isBusy = connectionActionState?.id === connection.id;

                  return (
                    <LlmConnectionCard
                      key={connection.id}
                      connection={connection}
                      selected={selected}
                      muted
                      actions={[
                        {
                          action: "deactivate",
                          label: "Deactivate",
                          onClick: () => void onConnectionAction("deactivate", connection.id),
                          disabled: isConnectionActionPending,
                          busy: isBusy && connectionActionState?.action === "deactivate",
                        },
                        {
                          action: "delete",
                          label: "Delete",
                          onClick: () => void onConnectionAction("delete", connection.id),
                          disabled: isConnectionActionPending,
                          busy: isBusy && connectionActionState?.action === "delete",
                        },
                      ]}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {inactiveLlmConnections.length ? (
            <div className="rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => setIsInactiveLlmSectionOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div>
                  <p className="font-semibold text-on-surface">Inactive connections</p>
                  <p className="mt-1 text-sm text-on-surface/60">
                    These profiles are saved but deactivated until you reactivate them.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-on-surface/65">
                  {inactiveLlmConnections.length}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      isInactiveLlmSectionOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              {isInactiveLlmSectionOpen ? (
                <div className="grid gap-3 border-t border-outline-variant/15 px-4 pb-4 pt-2">
                  {inactiveLlmConnections.map((connection) => {
                    const selected = selectedLlmConnectionId === connection.id;
                    const isBusy = connectionActionState?.id === connection.id;

                    return (
                      <LlmConnectionCard
                        key={connection.id}
                        connection={connection}
                        selected={selected}
                        muted
                        actions={[
                          {
                            action: "activate",
                            label: "Reactivate",
                            onClick: () => void onConnectionAction("activate", connection.id),
                            disabled: isConnectionActionPending,
                            busy: isBusy && connectionActionState?.action === "activate",
                          },
                          {
                            action: "delete",
                            label: "Delete",
                            onClick: () => void onConnectionAction("delete", connection.id),
                            disabled: isConnectionActionPending,
                            busy: isBusy && connectionActionState?.action === "delete",
                          },
                        ]}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {connectionActionError ? (
            <p className="text-sm leading-relaxed text-rose-700/85">
              {connectionActionError}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
