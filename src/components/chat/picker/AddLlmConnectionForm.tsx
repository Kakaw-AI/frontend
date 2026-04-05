"use client";

import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import { LLM_PROVIDER_OPTIONS, type LlmProvider, type SaveLlmConnectionInput } from "@/lib/queries/llm-connections";
import { GitPullRequest, LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";

export function AddLlmConnectionForm({
  githubLinked,
  isLinkingGithub,
  linkGithubError,
  isCreatingLlmConnection,
  createLlmError,
  initialProvider = "openai",
  initialDefaultModel = "",
  onLinkGithub,
  onCreateLlmConnection,
}: {
  githubLinked: boolean;
  isLinkingGithub: boolean;
  linkGithubError: Error | null;
  isCreatingLlmConnection: boolean;
  createLlmError: Error | null;
  initialProvider?: LlmProvider;
  initialDefaultModel?: string;
  onLinkGithub: () => void;
  onCreateLlmConnection: (input: SaveLlmConnectionInput) => Promise<void>;
}) {
  const [provider, setProvider] = useState<LlmProvider>(initialProvider);
  const [displayName, setDisplayName] = useState("");
  const [defaultModel, setDefaultModel] = useState(
    initialDefaultModel || (LLM_PROVIDER_OPTIONS[0]?.defaultModel ?? ""),
  );
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const providerOption =
    LLM_PROVIDER_OPTIONS.find((option) => option.value === provider) ??
    LLM_PROVIDER_OPTIONS[0];

  const copilotNeedsGithub = provider === "github-copilot" && !githubLinked;

  async function handleCreateLlmConnection() {
    await onCreateLlmConnection({
      provider,
      displayName: displayName.trim() || undefined,
      defaultModel: defaultModel.trim(),
      apiKey: provider === "github-copilot" ? undefined : apiKey.trim(),
      baseUrl:
        (provider === "openai" || provider === "custom-openai") && baseUrl.trim()
          ? baseUrl.trim()
          : undefined,
    });

    setDisplayName("");
    setApiKey("");
    setBaseUrl("");
  }

  return (
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

          {provider === "openai" || provider === "custom-openai" ? (
            <label className="space-y-2 text-sm">
              <span className="font-medium text-on-surface">Base URL</span>
              <input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={
                  provider === "custom-openai"
                    ? "https://your-endpoint.example/v1"
                    : "https://api.openai.com/v1"
                }
                className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary/40"
              />
              <p className="text-xs text-on-surface/50">
                Use this for self-hosted or other OpenAI-compatible services.
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
  );
}
