"use client";

import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import {
  LLM_PROVIDER_FAMILIES,
  LLM_PROVIDER_OPTIONS,
  listProviderModels,
  providerFamily,
  type LlmConnection,
  type LlmProvider,
  type SaveLlmConnectionInput,
} from "@/lib/queries/llm-connections";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";

const BASE_URL_PLACEHOLDERS: Partial<Record<LlmProvider, string>> = {
  openai: "https://api.openai.com/v1",
  ollama: "https://ollama.example.com/v1",
  "lm-studio": "https://lmstudio.example.com/v1",
};
const KEYLESS: LlmProvider[] = ["ollama", "lm-studio"];
const NEW_KEY = "new";
const OTHER_MODEL = "__other__";

/** The value once it has stopped changing for `ms`, so typing a key does not fire a request per keystroke. */
function useSettled<T>(value: T, ms = 600): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

export function AddLlmConnectionForm({
  connections,
  isCreatingLlmConnection,
  createLlmError,
  onCreateLlmConnection,
}: {
  /** The user's saved connections; a key saved on one can be reused for the same provider. */
  connections: LlmConnection[];
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
  /** A saved connection's id to reuse its key, NEW_KEY to type one, "" for the first saved key. */
  const [keyChoice, setKeyChoice] = useState("");
  const [customModel, setCustomModel] = useState(false);

  const providerOption = LLM_PROVIDER_OPTIONS.find((o) => o.value === provider) ?? LLM_PROVIDER_OPTIONS[0];
  const family = providerFamily(provider);
  const openAiServices = LLM_PROVIDER_OPTIONS.filter((o) => providerFamily(o.value) === "openai");

  function choose(next: LlmProvider) {
    setProvider(next);
    setDefaultModel(LLM_PROVIDER_OPTIONS.find((o) => o.value === next)?.defaultModel ?? "");
    setApiKey("");
    setBaseUrl("");
    setKeyChoice("");
    setCustomModel(false);
  }
  const needsKey = !KEYLESS.includes(provider);
  const baseUrlPlaceholder = BASE_URL_PLACEHOLDERS[provider];

  const savedKeys = connections.filter((connection) => connection.provider === provider && connection.apiKeyLastFour);
  const reuseKeyId =
    keyChoice === NEW_KEY ? "" : (savedKeys.find((connection) => connection.id === keyChoice) ?? savedKeys[0])?.id ?? "";

  // The model list loads once there is a key (saved or typed) and, for local
  // servers, an address. Settled values, so typing does not call per keystroke.
  const settledKey = useSettled(apiKey.trim());
  const settledBaseUrl = useSettled(baseUrlPlaceholder ? baseUrl.trim() : "");
  const canListModels = needsKey ? Boolean(reuseKeyId || settledKey.length >= 8) : Boolean(settledBaseUrl);
  const modelsQuery = useQuery({
    // The typed key is not part of the cache key; its length and last four
    // characters tell keys apart well enough within one form.
    queryKey: ["llm-provider-models", provider, reuseKeyId, settledKey.length, settledKey.slice(-4), settledBaseUrl],
    queryFn: ({ signal }) =>
      listProviderModels(
        {
          provider,
          ...(reuseKeyId ? { reuseKeyFromConnectionId: reuseKeyId } : { apiKey: settledKey || undefined }),
          baseUrl: settledBaseUrl || undefined,
        },
        signal,
      ),
    enabled: canListModels,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const models = canListModels ? (modelsQuery.data ?? []) : [];

  // Typed by the user, or one the list offers: the provider's usual model if
  // listed, else the newest.
  const model =
    customModel || models.length === 0 || models.includes(defaultModel)
      ? defaultModel
      : models.includes(providerOption.defaultModel)
        ? providerOption.defaultModel
        : models[0];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onCreateLlmConnection({
        provider,
        displayName: displayName.trim() || undefined,
        defaultModel: model.trim(),
        ...(reuseKeyId ? { reuseKeyFromConnectionId: reuseKeyId } : { apiKey: apiKey.trim() || undefined }),
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
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {LLM_PROVIDER_FAMILIES.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-accent/60 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name={`${id}-provider`}
                value={option.value}
                checked={family === option.value}
                // A family starts on its first service: OpenAI for the OpenAI-compatible tile.
                onChange={() => choose(option.value)}
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

      {family === "openai" ? (
        <fieldset>
          <legend className="text-sm font-bold text-on-surface">Service</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {openAiServices.map((option) => (
              <label
                key={option.value}
                className="cursor-pointer rounded-[10px] border border-border px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-accent/60 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
              >
                <input
                  type="radio"
                  name={`${id}-service`}
                  value={option.value}
                  checked={provider === option.value}
                  onChange={() => choose(option.value)}
                  className="sr-only"
                />
                {option.value === "openai" ? "OpenAI (ChatGPT)" : option.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-model`} className="text-sm font-bold text-on-surface">Model</label>
          {models.length > 0 && !customModel ? (
            <select
              id={`${id}-model`}
              required
              value={model}
              onChange={(e) => {
                if (e.target.value === OTHER_MODEL) {
                  setCustomModel(true);
                  return;
                }
                setDefaultModel(e.target.value);
              }}
              className="pod-input mt-2"
            >
              {models.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={OTHER_MODEL}>Other model id…</option>
            </select>
          ) : (
            <input
              id={`${id}-model`}
              required
              value={model}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder={providerOption.defaultModel}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby={`${id}-model-help`}
              className="pod-input mt-2"
            />
          )}
          <p id={`${id}-model-help`} className="mt-2 text-xs text-on-surface-variant" aria-live="polite">
            {modelsQuery.isFetching ? (
              <span className="inline-flex items-center gap-1.5">
                <LoaderCircle size={12} className="animate-spin" aria-hidden /> Loading models…
              </span>
            ) : customModel && models.length > 0 ? (
              <button type="button" onClick={() => setCustomModel(false)} className="underline underline-offset-2 hover:text-on-surface">
                Pick from the list
              </button>
            ) : canListModels && modelsQuery.error ? (
              `Couldn't load the model list (${modelsQuery.error.message}). Type the model id.`
            ) : !canListModels ? (
              needsKey ? "Add the key to pick from the provider's models." : "Add the address to pick from its models."
            ) : null}
          </p>
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
            placeholder={`${providerOption.label} · ${model}`}
            autoComplete="off"
            className="pod-input mt-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor={savedKeys.length ? `${id}-key-source` : `${id}-key`} className="text-sm font-bold text-on-surface">
          API key {needsKey ? null : <span className="font-normal text-on-surface-variant">(optional)</span>}
        </label>
        {savedKeys.length > 0 ? (
          <select
            id={`${id}-key-source`}
            value={reuseKeyId || NEW_KEY}
            onChange={(e) => setKeyChoice(e.target.value)}
            className="pod-input mt-2"
          >
            {savedKeys.map((connection) => (
              <option key={connection.id} value={connection.id}>
                Saved key from {connection.label} (…{connection.apiKeyLastFour})
              </option>
            ))}
            <option value={NEW_KEY}>Enter a new key</option>
          </select>
        ) : null}
        {!reuseKeyId ? (
          <input
            id={`${id}-key`}
            type="password"
            required={needsKey}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            aria-label={savedKeys.length ? "New API key" : undefined}
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            className="pod-input mt-2"
          />
        ) : null}
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
