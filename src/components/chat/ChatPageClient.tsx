"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bird,
  Database,
  LogOut,
  Plus,
  Search,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { ChatConnectionPicker } from "@/components/chat/ChatConnectionPicker";
import { MessageCard } from "@/components/chat/MessageCard";
import { formatConversationTime } from "@/components/chat/chat-formatting";
import {
  applyStreamEvent,
  createOptimisticUserMessage,
} from "@/components/chat/chat-stream-state";
import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import { authClient } from "@/lib/auth-client";
import {
  chatOptionsQueryKey,
  chatOptionsQueryOptions,
  type ChatOptions,
} from "@/lib/queries/chat-options";
import {
  conversationDetailsQueryKey,
  conversationDetailsQueryOptions,
  conversationsQueryKey,
  conversationsQueryOptions,
  createConversationMutationOptions,
  streamConversationMessage,
  type ConversationDetails,
  type ConversationSummary,
} from "@/lib/queries/conversations";
import {
  linkGithubAccount,
  saveLlmConnectionMutationOptions,
  type SaveLlmConnectionInput,
} from "@/lib/queries/llm-connections";

export function ChatPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isConnectionPickerOpen, setIsConnectionPickerOpen] = useState(false);
  const [pickerStartsInAddLlmMode, setPickerStartsInAddLlmMode] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLinkingGithub, setIsLinkingGithub] = useState(false);
  const [githubLinkError, setGithubLinkError] = useState<Error | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const session = authClient.useSession();
  const user = session.data?.user;
  const chatOptionsQuery = useQuery(chatOptionsQueryOptions());
  const conversationsQuery = useQuery(conversationsQueryOptions());
  const activeConversationQuery = useQuery(
    conversationDetailsQueryOptions(activeConversationId ?? ""),
  );

  const createConversationMutation = useMutation({
    ...createConversationMutationOptions(),
    onSuccess(conversation) {
      queryClient.setQueryData<ConversationSummary[] | undefined>(
        conversationsQueryKey,
        (current) => [conversation, ...(current ?? [])],
      );
      setActiveConversationId(conversation.id);
      setIsConnectionPickerOpen(false);
    },
  });

  const createLlmConnectionMutation = useMutation({
    ...saveLlmConnectionMutationOptions(),
    onSuccess(connection) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) =>
          current
            ? {
                ...current,
                llmConnections: [connection, ...current.llmConnections],
              }
            : current,
      );
    },
  });

  useEffect(() => {
    if (!activeConversationId && conversationsQuery.data?.length) {
      setActiveConversationId(conversationsQuery.data[0].id);
    }
  }, [activeConversationId, conversationsQuery.data]);

  const activeConversation = activeConversationQuery.data;
  const githubLinked = chatOptionsQuery.data?.githubLinked ?? false;
  const hasStreamingAssistantMessage = Boolean(
    activeConversation?.messages.some(
      (message) => message.role === "assistant" && message.status === "STREAMING",
    ),
  );
  const isComposerLocked = isSending || hasStreamingAssistantMessage;

  const selectedSource = useMemo(
    () => activeConversation?.databaseSource ?? null,
    [activeConversation],
  );

  const selectedLlmConnection = useMemo(
    () => activeConversation?.llmConnection ?? null,
    [activeConversation],
  );

  function handleOpenConnectionPicker() {
    setComposerError(null);
    setGithubLinkError(null);
    setPickerStartsInAddLlmMode(false);
    setIsConnectionPickerOpen(true);
    void chatOptionsQuery.refetch();
  }

  function handleOpenAddLlmPicker() {
    setComposerError(null);
    setGithubLinkError(null);
    setPickerStartsInAddLlmMode(true);
    setIsConnectionPickerOpen(true);
    void chatOptionsQuery.refetch();
  }

  async function handleCreateConversation(selection: {
    source: { id: string };
    llmConnection: { id: string };
  }) {
    await createConversationMutation.mutateAsync({
      databaseSourceId: selection.source.id,
      llmConnectionId: selection.llmConnection.id,
    });
  }

  async function handleCreateLlmConnection(input: SaveLlmConnectionInput) {
    setGithubLinkError(null);
    await createLlmConnectionMutation.mutateAsync(input);
    await chatOptionsQuery.refetch();
  }

  async function handleLinkGithub() {
    setGithubLinkError(null);
    setIsLinkingGithub(true);

    try {
      const callbackURL =
        typeof window === "undefined" ? "/chat" : `${window.location.origin}/chat`;
      await linkGithubAccount(callbackURL);
    } catch (error) {
      setGithubLinkError(
        error instanceof Error
          ? error
          : new Error("Unable to link your GitHub account."),
      );
    } finally {
      setIsLinkingGithub(false);
    }
  }

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  const handleSuggestionClick = useCallback(
    (text: string) => {
      setInput(text);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        textareaRef.current.focus();
      }
    },
    [textareaRef],
  );

  async function handleSendMessage() {
    const content = input.trim();
    if (!content || !activeConversationId || isComposerLocked) {
      return;
    }

    if (!selectedSource?.canStartChat) {
      setComposerError("The selected database is still syncing with the Python agent.");
      return;
    }

    setComposerError(null);
    setIsSending(true);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversationId),
      (current) =>
        current
          ? {
              ...current,
              messages: current.messages.map((msg) => ({ ...msg, suggestions: [] })),
            }
          : current,
    );

    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversationId),
      (current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, createOptimisticUserMessage(content)],
            }
          : current,
    );

    try {
      await streamConversationMessage(activeConversationId, content, (event) => {
        queryClient.setQueryData<ConversationDetails | undefined>(
          conversationDetailsQueryKey(activeConversationId),
          (current) => applyStreamEvent(current, event),
        );
      });
    } catch (error) {
      setComposerError(
        error instanceof Error ? error.message : "Unable to stream chat response.",
      );
    } finally {
      setIsSending(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: conversationDetailsQueryKey(activeConversationId),
        }),
        queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
      ]);
    }
  }

  return (
    <>
      <ChatConnectionPicker
        isOpen={isConnectionPickerOpen}
        startInAddLlmMode={pickerStartsInAddLlmMode}
        databaseSources={chatOptionsQuery.data?.databaseSources}
        llmConnections={chatOptionsQuery.data?.llmConnections}
        githubLinked={githubLinked}
        isLoading={chatOptionsQuery.isLoading}
        isRefreshing={chatOptionsQuery.isFetching && Boolean(chatOptionsQuery.data)}
        error={chatOptionsQuery.error instanceof Error ? chatOptionsQuery.error : null}
        activeSourceId={selectedSource?.id ?? null}
        activeLlmConnectionId={selectedLlmConnection?.id ?? null}
        isCreatingLlmConnection={createLlmConnectionMutation.isPending}
        createLlmError={
          createLlmConnectionMutation.error instanceof Error
            ? createLlmConnectionMutation.error
            : null
        }
        isLinkingGithub={isLinkingGithub}
        linkGithubError={githubLinkError}
        onClose={() => {
          setIsConnectionPickerOpen(false);
          setPickerStartsInAddLlmMode(false);
        }}
        onRetry={() => {
          void chatOptionsQuery.refetch();
        }}
        onLinkGithub={() => {
          void handleLinkGithub();
        }}
        onCreateLlmConnection={handleCreateLlmConnection}
        onConfirmSelection={(selection) => {
          void handleCreateConversation(selection);
        }}
      />

      <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface">
        <aside className="flex h-full w-80 shrink-0 flex-col gap-5 border-r border-outline-variant/15 bg-surface-container-low p-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
              <Bird size={18} />
            </div>
            <div>
              <h1 className="font-headline text-xl font-bold italic text-primary">
                Kakaw AI
              </h1>
              <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface/45">
                Your AI data analyst
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenConnectionPicker}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            New Chat
          </button>

          <div className="grid gap-2">
            <Link
              href="/onboarding/database"
              className="flex items-center justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface/75 transition-colors hover:border-primary/25 hover:text-primary"
            >
              <span className="inline-flex items-center gap-3">
                <Database size={16} />
                Add Database
              </span>
              <Plus size={14} />
            </Link>

            <button
              type="button"
              onClick={handleOpenAddLlmPicker}
              className="flex items-center justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface/75 transition-colors hover:border-primary/25 hover:text-primary"
            >
              <span className="inline-flex items-center gap-3">
                <Sparkles size={16} />
                Connect LLM
              </span>
              <Plus size={14} />
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/35" />
            <input
              className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-lowest py-2 pr-4 pl-10 text-sm placeholder:text-on-surface/30"
              placeholder="Search conversations"
              type="text"
              readOnly
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface/35">
              Conversations
            </p>

            <div className="space-y-2">
              {conversationsQuery.data?.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={
                    activeConversationId === conversation.id
                      ? "w-full rounded-2xl border border-primary/20 bg-white px-4 py-3 text-left shadow-sm"
                      : "w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-left"
                  }
                >
                  <p className="truncate text-sm font-semibold text-on-surface">
                    {conversation.title}
                  </p>
                  <p className="mt-1 text-xs text-on-surface/55">
                    {conversation.databaseSource.label} · {conversation.llmConnection.defaultModel}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
                    {formatConversationTime(conversation.lastMessageAt)}
                  </p>
                </button>
              ))}

              {!conversationsQuery.data?.length ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-lowest px-4 py-5 text-sm text-on-surface/60">
                  No conversations yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 border-t border-outline-variant/15 pt-4">
            <div className="space-y-2">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface/35">
                Active Runtime
              </p>

              <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container/60">
                  {selectedSource ? (
                    <DatabaseLogo provider={selectedSource.provider} className="h-5 w-5" />
                  ) : (
                    <Database size={16} className="text-on-surface/40" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
                    Database
                  </p>
                  <p className="truncate text-sm font-medium">
                    {selectedSource?.label ?? "No conversation selected"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container/60">
                  {selectedLlmConnection ? (
                    <LlmProviderLogo provider={selectedLlmConnection.provider} className="h-5 w-5" />
                  ) : (
                    <Sparkles size={16} className="text-on-surface/40" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
                    LLM
                  </p>
                  <p className="truncate text-sm font-medium">
                    {selectedLlmConnection
                      ? `${selectedLlmConnection.label} · ${selectedLlmConnection.defaultModel}`
                      : "No conversation selected"}
                  </p>
                </div>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface/70"
              >
                <LogOut size={14} />
                {isSigningOut ? "Signing Out" : "Log Out"}
              </button>
            ) : null}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-surface-container-lowest">
          <header className="flex items-center justify-between border-b border-outline-variant/15 px-8 py-5">
            <div>
              <h2 className="font-headline text-2xl italic text-primary">
                {activeConversation?.title ?? "Select or create a conversation"}
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-on-surface/35">
                Your conversation history
              </p>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            {activeConversationQuery.isLoading ? (
              <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low px-6 py-8 text-sm text-on-surface/60">
                Loading conversation...
              </div>
            ) : activeConversation ? (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface/35">
                      Data Source
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <DatabaseLogo provider={activeConversation.databaseSource.provider} className="h-6 w-6" />
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {activeConversation.databaseSource.label}
                        </p>
                        <p className="text-xs text-on-surface/55">
                          {activeConversation.databaseSource.provider}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface/35">
                      Model Runtime
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <LlmProviderLogo provider={activeConversation.llmConnection.provider} className="h-6 w-6" />
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {activeConversation.llmConnection.label}
                        </p>
                        <p className="text-xs text-on-surface/55">
                          {activeConversation.llmConnection.defaultModel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {(() => {
                    const lastAssistantIndex = [...activeConversation.messages]
                      .map((m, i) => ({ m, i }))
                      .filter(({ m }) => m.role === "assistant" && m.status === "COMPLETED")
                      .at(-1)?.i ?? -1;

                    return activeConversation.messages.map((message, index) => (
                      <MessageCard
                        key={message.id}
                        message={message}
                        isLastAssistantMessage={index === lastAssistantIndex && !isComposerLocked}
                        onSuggestionClick={handleSuggestionClick}
                      />
                    ));
                  })()}

                  {!activeConversation.messages.length ? (
                    <div className="rounded-3xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface/60">
                      Ask a question to get started.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface/60">
                Select a conversation or create a new one.
              </div>
            )}
          </section>

          <footer className="border-t border-outline-variant/15 px-8 py-6">
            {composerError ? (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                <AlertTriangle size={16} />
                {composerError}
              </div>
            ) : null}

            <div
              className={[
                "flex flex-col rounded-3xl border bg-surface-container-low transition-shadow",
                !activeConversation || isComposerLocked
                  ? "border-outline-variant/15"
                  : "border-primary/40 shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]",
              ].join(" ")}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  const el = event.target;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                disabled={!activeConversation || isComposerLocked}
                className="w-full resize-none border-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-relaxed placeholder:text-on-surface/30 focus:ring-0"
                style={{ minHeight: "44px", maxHeight: "200px", overflowY: "auto" }}
                placeholder={
                  activeConversation
                    ? `Ask ${activeConversation.llmConnection.label} about ${activeConversation.databaseSource.label}...`
                    : "Create a conversation first to start querying the selected database."
                }
              />
              <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
                <p className="text-[10px] text-on-surface/35">
                  {isComposerLocked ? (
                    "Responding…"
                  ) : (
                    <>
                      <kbd className="rounded border border-outline-variant/20 bg-surface-container px-1 py-0.5 font-mono text-[9px]">Enter</kbd>
                      {" send · "}
                      <kbd className="rounded border border-outline-variant/20 bg-surface-container px-1 py-0.5 font-mono text-[9px]">⇧ Enter</kbd>
                      {" newline"}
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => { void handleSendMessage(); }}
                  disabled={!activeConversation || !input.trim() || isComposerLocked}
                  className="flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary shadow-sm shadow-primary/20 disabled:opacity-40"
                >
                  <SendHorizontal size={13} />
                  Send
                </button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
