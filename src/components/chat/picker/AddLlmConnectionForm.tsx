"use client";

import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import { LLM_PROVIDER_OPTIONS, type LlmProvider, type SaveLlmConnectionInput } from "@/lib/queries/llm-connections";
import { AlertCircle, LoaderCircle, Plus } from "lucide-react";
import { useId, useState } from "react";

const BASE_URL_PLACEHOLDERS: Partial<Record<LlmProvider, string>> = {
  openai: "https://api.openai.com/v1",
  ollama: "https://ollama.example.com/v1",
  "lm-studio": "https://lmstudio.example.com/v1",
};
const KEYLESS: LlmProvider[] = ["ollama", "lm-studio"];

export function AddLlmConnectionForm({
  isCreatingLlmConnection,
  createLlmError,
  onCreateLlmConnection,
}: {
  isCreatingLlmConnection: boolean;
  createLlmError: Error | null;
  onCreateLlmConnection: (input: SaveLlmConnectionInput) => Promise<void>;
}) {
  const id = useId();
  const [provider, setProvider] = useState<LlmProvider>(LLM_PROVIDER_OPTIONS[0].value);
  const [displayName, setDisplayName] = useState("");
  const [defaultModel, setDefaultModel] = useState(LLM_PROVIDER_OPTIONS[0].defaultModel);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const providerOption = LLM_PROVIDER_OPTIONS.find((o) => o.value === provider) ?? LLM_PROVIDER_OPTIONS[0];
  const needsKey = !KEYLESS.includes(provider);
  const baseUrlPlaceholder = BASE_URL_PLACEHOLDERS[provider];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onCreateLlmConnection({
        provider,
        displayName: displayName.trim() || undefined,
        defaultModel: defaultModel.trim(),
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrlPlaceholder && baseUrl.trim() ? baseUrl.trim() : undefined,
      });
      setDisplayName("");
      setApiKey("");
      setBaseUrl("");
    } catch {
      // Shown through createLlmError.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pod-card space-y-5 rounded-2xl p-4">
      <fieldset>
        <legend className="text-sm font-bold text-on-surface">Provider</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {LLM_PROVIDER_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-primary/20 p-3 transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name={`${id}-provider`}
                value={option.value}
                checked={provider === option.value}
                onChange={() => {
                  setProvider(option.value);
                  setDefaultModel(option.defaultModel);
                  setApiKey("");
                  setBaseUrl("");
                }}
                className="sr-only"
              />
              <LlmProviderLogo provider={option.value} className="h-8 w-8 shrink-0" />
              <span>
                <span className="block font-bold text-on-surface">{option.label}</span>
                <span className="mt-0.5 block text-xs text-on-surface-variant">{option.helper}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-model`} className="text-sm font-bold text-on-surface">Model</label>
          <input
            id={`${id}-model`}
            required
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            placeholder={providerOption.defaultModel}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="pod-input mt-2"
          />
        </div>
        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-bold text-on-surface">
            Name <span className="font-normal text-on-surface-variant">(optional)</span>
          </label>
          <input
            id={`${id}-name`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={120}
            placeholder={`${providerOption.label} · ${defaultModel}`}
            autoComplete="off"
            className="pod-input mt-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-key`} className="text-sm font-bold text-on-surface">
          API key {needsKey ? null : <span className="font-normal text-on-surface-variant">(optional)</span>}
        </label>
        <input
          id={`${id}-key`}
          type="password"
          required={needsKey}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          autoComplete="new-password"
          autoCapitalize="none"
          spellCheck={false}
          className="pod-input mt-2"
        />
      </div>

      {baseUrlPlaceholder ? (
        <div>
          <label htmlFor={`${id}-url`} className="text-sm font-bold text-on-surface">
            Base URL {provider === "openai" ? <span className="font-normal text-on-surface-variant">(optional)</span> : null}
          </label>
          <input
            id={`${id}-url`}
            type="url"
            required={!needsKey}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={baseUrlPlaceholder}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={`${id}-url-help`}
            className="pod-input mt-2"
          />
          <p id={`${id}-url-help`} className="mt-2 text-xs text-on-surface-variant">
            Kakaw calls this from its server, so it must be a public URL. localhost and private addresses won&apos;t work.
          </p>
        </div>
      ) : null}

      <div role="alert" aria-live="assertive">
        {createLlmError ? (
          <p className="pod-alert">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {createLlmError.message}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isCreatingLlmConnection} className="pod-btn">
          {isCreatingLlmConnection ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Plus size={16} aria-hidden />}
          {isCreatingLlmConnection ? "Testing…" : "Test and save"}
        </button>
      </div>
    </form>
  );
}
