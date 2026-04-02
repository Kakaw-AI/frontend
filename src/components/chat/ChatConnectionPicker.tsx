"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronDown,
  Database,
  GitPullRequest,
  LoaderCircle,
  Plus,
  Power,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import type { DatabaseSource } from "@/lib/queries/database-sources";
import {
  LLM_PROVIDER_OPTIONS,
  type LlmConnection,
  type LlmProvider,
  type SaveLlmConnectionInput,
} from "@/lib/queries/llm-connections";

type ConnectionActionKind = "activate" | "deactivate" | "delete";

type ConnectionCardAction = {
  action: ConnectionActionKind;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
};

function formatTimestamp(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function ConnectionActionButton({
  action,
  label,
  onClick,
  disabled,
  busy,
}: ConnectionCardAction) {
  const toneClassName =
    action === "delete"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : action === "activate"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-outline-variant/20 bg-white text-on-surface/70";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${toneClassName}`}
    >
      {busy ? <LoaderCircle size={12} className="animate-spin" /> : null}
      {action === "activate" ? (
        <RefreshCw size={12} />
      ) : action === "delete" ? (
        <Trash2 size={12} />
      ) : (
        <Power size={12} />
      )}
      {label}
    </button>
  );
}

function LlmConnectionCard({
  connection,
  selected,
  muted,
  onSelect,
  actions,
}: {
  connection: LlmConnection;
  selected: boolean;
  muted?: boolean;
  onSelect?: () => void;
  actions?: ConnectionCardAction[];
}) {
  const cardClassName = muted
    ? selected
      ? "border-outline-variant/20 bg-white/80 opacity-80"
      : "border-outline-variant/15 bg-surface-container-low opacity-75"
    : selected
      ? "border-primary/45 bg-white shadow-[0_18px_40px_-24px_rgba(112,87,49,0.45)]"
      : "border-outline-variant/20 bg-white hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_40px_-24px_rgba(112,87,49,0.45)]";

  const content = (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-container/60 text-primary">
          <LlmProviderLogo provider={connection.provider} className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-semibold text-on-surface">{connection.label}</p>
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface/40">
              {connection.provider}
            </span>
          </div>
          <p className="text-sm text-on-surface/55">
            {connection.defaultModel}
            {connection.apiKeyLastFour
              ? ` · key ••••${connection.apiKeyLastFour}`
              : connection.usesLinkedAccount
                ? " · linked account"
                : ""}
          </p>
          <p className="text-sm text-on-surface/55">
            Tested {formatTimestamp(connection.lastTestedAt, "recently")}
          </p>
          {connection.lastError ? (
            <p className="text-sm leading-relaxed text-rose-700/85">
              {connection.lastError}
            </p>
          ) : null}
        </div>
      </div>

      <DatabaseSourceStatusBadge status={connection.status} />
    </div>
  );

  return (
    <div className={`rounded-[24px] border px-5 py-4 transition-all ${cardClassName}`}>
      {onSelect ? (
        <button type="button" onClick={onSelect} className="w-full text-left">
          {content}
        </button>
      ) : (
        content
      )}

      {actions?.length ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-outline-variant/15 pt-3">
          {actions.map((item) => (
            <ConnectionActionButton key={`${connection.id}-${item.action}`} {...item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ChatConnectionPicker({
  isOpen,
  startInAddLlmMode,
  databaseSources,
  llmConnections,
  githubLinked,
  isLoading,
  isRefreshing,
  error,
  activeSourceId,
  activeLlmConnectionId,
  isCreatingConversation,
  isCreatingLlmConnection,
  createLlmError,
  isLinkingGithub,
  linkGithubError,
  onClose,
  onRetry,
  onLinkGithub,
  onCreateLlmConnection,
  onActivateLlmConnection,
  onDeactivateLlmConnection,
  onDeleteLlmConnection,
  onConfirmSelection,
}: {
  isOpen: boolean;
  startInAddLlmMode: boolean;
  databaseSources: DatabaseSource[] | undefined;
  llmConnections: LlmConnection[] | undefined;
  githubLinked: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  activeSourceId: string | null;
  activeLlmConnectionId: string | null;
  isCreatingConversation: boolean;
  isCreatingLlmConnection: boolean;
  createLlmError: Error | null;
  isLinkingGithub: boolean;
  linkGithubError: Error | null;
  onClose: () => void;
  onRetry: () => void;
  onLinkGithub: () => void;
  onCreateLlmConnection: (input: SaveLlmConnectionInput) => Promise<void>;
  onActivateLlmConnection: (connectionId: string) => Promise<void>;
  onDeactivateLlmConnection: (connectionId: string) => Promise<void>;
  onDeleteLlmConnection: (connectionId: string) => Promise<void>;
  onConfirmSelection: (selection: {
    source: DatabaseSource;
    llmConnection: LlmConnection;
  }) => void;
}) {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(activeSourceId);
  const [selectedLlmConnectionId, setSelectedLlmConnectionId] = useState<string | null>(
    activeLlmConnectionId,
  );
  const [isAddConnectionFormOpen, setIsAddConnectionFormOpen] = useState(false);
  const [isInactiveLlmSectionOpen, setIsInactiveLlmSectionOpen] = useState(false);
  const [provider, setProvider] = useState<LlmProvider>("openai");
  const [displayName, setDisplayName] = useState("");
  const [defaultModel, setDefaultModel] = useState(
    LLM_PROVIDER_OPTIONS[0]?.defaultModel ?? "",
  );
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [connectionActionState, setConnectionActionState] = useState<{
    id: string;
    action: ConnectionActionKind;
  } | null>(null);
  const [connectionActionError, setConnectionActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedSourceId(activeSourceId);
    setSelectedLlmConnectionId(activeLlmConnectionId);
  }, [activeLlmConnectionId, activeSourceId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!llmConnections?.length) {
      setIsAddConnectionFormOpen(true);
    }
  }, [isOpen, llmConnections]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (startInAddLlmMode) {
      setIsAddConnectionFormOpen(true);
    }
  }, [isOpen, startInAddLlmMode]);

  const providerOption =
    LLM_PROVIDER_OPTIONS.find((option) => option.value === provider) ??
    LLM_PROVIDER_OPTIONS[0];
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
  const selectedSource = databaseSources?.find((source) => source.id === selectedSourceId);
  const selectedLlmConnection = llmConnections?.find(
    (connection) => connection.id === selectedLlmConnectionId,
  );
  const hasValidSelection =
    !!selectedSource?.canStartChat && !!selectedLlmConnection?.canStartChat;
  const copilotNeedsGithub = provider === "github-copilot" && !githubLinked;
  const isConnectionActionPending = connectionActionState !== null;

  if (!isOpen) {
    return null;
  }

  async function handleCreateLlmConnection() {
    await onCreateLlmConnection({
      provider,
      displayName: displayName.trim() || undefined,
      defaultModel: defaultModel.trim(),
      apiKey: provider === "github-copilot" ? undefined : apiKey.trim(),
      baseUrl: provider === "openai" && baseUrl.trim() ? baseUrl.trim() : undefined,
    });

    setDisplayName("");
    setApiKey("");
    setBaseUrl("");
    setIsAddConnectionFormOpen(false);
  }

  async function handleConnectionAction(
    action: ConnectionActionKind,
    connectionId: string,
  ) {
    setConnectionActionError(null);
    setConnectionActionState({ id: connectionId, action });

    try {
      if (action === "activate") {
        await onActivateLlmConnection(connectionId);
        setSelectedLlmConnectionId(connectionId);
      } else if (action === "deactivate") {
        await onDeactivateLlmConnection(connectionId);
        if (selectedLlmConnectionId === connectionId) {
          setSelectedLlmConnectionId(null);
        }
      } else {
        await onDeleteLlmConnection(connectionId);
        if (selectedLlmConnectionId === connectionId) {
          setSelectedLlmConnectionId(null);
        }
      }
    } catch (error) {
      setConnectionActionError(
        error instanceof Error
          ? error.message
          : "Unable to update this LLM connection.",
      );
    } finally {
      setConnectionActionState(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/35 px-6 py-10 backdrop-blur-sm">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-outline-variant/30 bg-surface-container-lowest shadow-[0_35px_90px_-24px_rgba(27,28,28,0.28)]" style={{ maxHeight: "calc(100vh - 5rem)" }}>
        <div className="flex items-start justify-between gap-6 border-b border-outline-variant/15 px-8 py-6">
          <div className="space-y-2">
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              New Chat
            </p>
            <div>
              <h3 className="font-headline text-3xl italic text-primary">
                Choose your runtime stack
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface/65">
                Start each conversation with both a Vanna-ready data source and a
                validated LLM connection.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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
                <p className="mt-1 text-sm text-on-surface/60">
                  Pulling your saved data sources and LLM connections from the backend.
                </p>
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
                  {databaseSources?.length ?? 0} data source
                  {(databaseSources?.length ?? 0) === 1 ? "" : "s"} ·{" "}
                  {readyLlmConnections.length} ready LLM connection
                  {readyLlmConnections.length === 1 ? "" : "s"}
                  {failedLlmConnections.length
                    ? ` · ${failedLlmConnections.length} failed`
                    : ""}
                  {inactiveLlmConnections.length
                    ? ` · ${inactiveLlmConnections.length} inactive`
                    : ""}
                </span>
                {isRefreshing ? (
                  <span className="inline-flex items-center gap-2 font-medium text-primary">
                    <LoaderCircle size={14} className="animate-spin" />
                    Refreshing
                  </span>
                ) : null}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
                <section className="space-y-4 rounded-[28px] border border-outline-variant/15 bg-surface-container-low p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-label text-[10px] uppercase tracking-[0.22em] text-primary">
                        Step 1
                      </p>
                      <h4 className="mt-1 text-lg font-semibold text-on-surface">
                        Data source
                      </h4>
                    </div>
                  </div>

                  {!databaseSources?.length ? (
                    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-outline-variant/20 bg-surface-container-lowest px-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-primary">
                        <Database size={22} />
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-on-surface">No database sources found</p>
                        <p className="text-sm leading-relaxed text-on-surface/60">
                          Add a saved database connection before starting a chat.
                        </p>
                      </div>
                      <Link
                        href="/onboarding/database"
                        className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90"
                      >
                        Add Source
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {databaseSources.map((source) => {
                        const disabled = !source.canStartChat;
                        const selected = selectedSourceId === source.id;

                        return (
                          <button
                            key={source.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => setSelectedSourceId(source.id)}
                            className={`w-full rounded-[24px] border px-5 py-4 text-left transition-all ${
                              disabled
                                ? "cursor-not-allowed border-outline-variant/15 bg-surface-container-low opacity-70"
                                : selected
                                  ? "border-primary/45 bg-white shadow-[0_18px_40px_-24px_rgba(112,87,49,0.45)]"
                                  : "border-outline-variant/20 bg-white hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_40px_-24px_rgba(112,87,49,0.45)]"
                            }`}
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-container/60 text-primary">
                                  <DatabaseLogo provider={source.provider} className="h-6 w-6" />
                                </div>

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <p className="font-semibold text-on-surface">{source.label}</p>
                                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface/40">
                                      {source.provider}
                                    </span>
                                  </div>
                                  <p className="text-sm text-on-surface/55">
                                    Tested {formatTimestamp(source.lastTestedAt, "recently")}
                                  </p>
                                  {source.lastError ? (
                                    <p className="text-sm leading-relaxed text-rose-700/85">
                                      {source.lastError}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <DatabaseSourceStatusBadge status={source.status} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="space-y-4 rounded-[28px] border border-outline-variant/15 bg-surface-container-low p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-label text-[10px] uppercase tracking-[0.22em] text-primary">
                        Step 2
                      </p>
                      <h4 className="mt-1 text-lg font-semibold text-on-surface">
                        LLM connection
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddConnectionFormOpen((current) => !current);
                        setProvider(providerOption?.value ?? "openai");
                        setDefaultModel(providerOption?.defaultModel ?? "");
                        setBaseUrl("");
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-outline-variant/25 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface/70 transition-colors hover:border-primary/35 hover:text-primary"
                    >
                      <Plus size={14} />
                      {isAddConnectionFormOpen ? "Close" : "Add LLM"}
                    </button>
                  </div>

                  {isAddConnectionFormOpen ? (
                    <div className="space-y-4 rounded-[24px] border border-outline-variant/20 bg-white p-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {LLM_PROVIDER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setProvider(option.value);
                              setDefaultModel(option.defaultModel);
                              setApiKey("");
                              setBaseUrl("");
                            }}
                            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                              provider === option.value
                                ? "border-primary/45 bg-secondary-container/30"
                                : "border-outline-variant/20 hover:border-primary/25 hover:bg-surface-container-low"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <LlmProviderLogo provider={option.value} className="h-9 w-9" />
                              <div>
                                <p className="font-semibold text-on-surface">{option.label}</p>
                                <p className="mt-1 text-xs leading-relaxed text-on-surface/60">
                                  {option.helper}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm">
                          <span className="font-medium text-on-surface">Display name</span>
                          <input
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            maxLength={120}
                            placeholder={`${providerOption.label} · ${defaultModel}`}
                            className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary/40"
                          />
                        </label>

                        <label className="space-y-2 text-sm">
                          <span className="font-medium text-on-surface">Default model</span>
                          <input
                            value={defaultModel}
                            onChange={(event) => setDefaultModel(event.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder={providerOption.defaultModel}
                            className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary/40"
                          />
                        </label>
                      </div>

                      {provider === "github-copilot" ? (
                        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                          {githubLinked ? (
                            <div className="flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                <p className="font-semibold text-on-surface">GitHub account linked</p>
                                <p className="text-sm text-on-surface/60">
                                  Copilot will use the GitHub token attached to your account.
                                </p>
                              </div>
                              <DatabaseSourceStatusBadge status="READY" />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <p className="font-semibold text-on-surface">GitHub link required</p>
                                <p className="text-sm text-on-surface/60">
                                  Connect GitHub first so Copilot can reuse that token.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={onLinkGithub}
                                disabled={isLinkingGithub}
                                className="inline-flex items-center gap-2 rounded-full bg-[#24292F] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isLinkingGithub ? (
                                  <LoaderCircle size={14} className="animate-spin" />
                                ) : (
                                  <GitPullRequest size={14} />
                                )}
                                Connect GitHub
                              </button>
                              {linkGithubError ? (
                                <p className="text-sm leading-relaxed text-rose-700/85">
                                  {linkGithubError.message}
                                </p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-on-surface">API key</span>
                            <input
                              type="password"
                              value={apiKey}
                              onChange={(event) => setApiKey(event.target.value)}
                              autoComplete="new-password"
                              autoCorrect="off"
                              autoCapitalize="none"
                              spellCheck={false}
                              placeholder="Paste the provider API key"
                              className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary/40"
                            />
                          </label>

                          {provider === "openai" ? (
                            <label className="space-y-2 text-sm">
                              <span className="font-medium text-on-surface">Base URL</span>
                              <input
                                value={baseUrl}
                                onChange={(event) => setBaseUrl(event.target.value)}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                placeholder="https://api.openai.com/v1"
                                className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary/40"
                              />
                              <p className="text-xs text-on-surface/50">
                                Change for Azure OpenAI, self-hosted, or other compatible services.
                              </p>
                            </label>
                          ) : null}
                        </div>
                      )}

                      {createLlmError ? (
                        <p className="text-sm leading-relaxed text-rose-700/85">
                          {createLlmError.message}
                        </p>
                      ) : null}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            void handleCreateLlmConnection();
                          }}
                          disabled={
                            isCreatingLlmConnection ||
                            !defaultModel.trim() ||
                            copilotNeedsGithub ||
                            (provider !== "github-copilot" && !apiKey.trim())
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCreatingLlmConnection ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <Plus size={14} />
                          )}
                          Save LLM connection
                        </button>
                      </div>
                    </div>
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
                                onSelect={() => setSelectedLlmConnectionId(connection.id)}
                                actions={[
                                  {
                                    action: "deactivate",
                                    label: "Deactivate",
                                    onClick: () =>
                                      void handleConnectionAction("deactivate", connection.id),
                                    disabled: isConnectionActionPending,
                                    busy:
                                      isBusy &&
                                      connectionActionState?.action === "deactivate",
                                  },
                                  {
                                    action: "delete",
                                    label: "Delete",
                                    onClick: () =>
                                      void handleConnectionAction("delete", connection.id),
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
                            Add a new connection or expand the inactive list to review
                            saved connections that need attention.
                          </p>
                        </div>
                      )}

                      {failedLlmConnections.length ? (
                        <div className="space-y-3 rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest p-4">
                          <div>
                            <p className="font-semibold text-on-surface">
                              Failed health checks
                            </p>
                            <p className="mt-1 text-sm text-on-surface/60">
                              These connections are active but currently not healthy enough to
                              start new chats.
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
                                      onClick: () =>
                                        void handleConnectionAction("deactivate", connection.id),
                                      disabled: isConnectionActionPending,
                                      busy:
                                        isBusy &&
                                        connectionActionState?.action === "deactivate",
                                    },
                                    {
                                      action: "delete",
                                      label: "Delete",
                                      onClick: () =>
                                        void handleConnectionAction("delete", connection.id),
                                      disabled: isConnectionActionPending,
                                      busy:
                                        isBusy && connectionActionState?.action === "delete",
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
                            onClick={() =>
                              setIsInactiveLlmSectionOpen((current) => !current)
                            }
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                          >
                            <div>
                              <p className="font-semibold text-on-surface">
                                Inactive connections
                              </p>
                              <p className="mt-1 text-sm text-on-surface/60">
                                These profiles are saved but deactivated until you reactivate
                                them.
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
                                        onClick: () =>
                                          void handleConnectionAction("activate", connection.id),
                                        disabled: isConnectionActionPending,
                                        busy:
                                          isBusy &&
                                          connectionActionState?.action === "activate",
                                      },
                                      {
                                        action: "delete",
                                        label: "Delete",
                                        onClick: () =>
                                          void handleConnectionAction("delete", connection.id),
                                        disabled: isConnectionActionPending,
                                        busy:
                                          isBusy && connectionActionState?.action === "delete",
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
              </div>

              <div className="flex items-center justify-between rounded-[24px] border border-outline-variant/15 bg-surface-container-low px-5 py-4">
                <div className="space-y-1">
                  <p className="font-label text-[10px] uppercase tracking-[0.22em] text-primary">
                    Ready state
                  </p>
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
                    if (!hasValidSelection || !selectedSource || !selectedLlmConnection) {
                      return;
                    }

                    onConfirmSelection({
                      source: selectedSource,
                      llmConnection: selectedLlmConnection,
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingConversation ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : null}
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
