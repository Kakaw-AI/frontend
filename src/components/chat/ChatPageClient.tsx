"use client";

import { authClient } from "@/lib/auth-client";
import { chatOptionsQueryKey, chatOptionsQueryOptions, type ChatOptions } from "@/lib/queries/chat-options";
import {
  conversationDetailsQueryKey,
  conversationDetailsQueryOptions,
  conversationsQueryKey,
  conversationsQueryOptions,
  createConversationMutationOptions,
  deleteConversationMutationOptions,
  retryConversationMessage,
  streamConversationMessage,
  updateConversationRuntimeMutationOptions,
  type ConversationDetails,
  type ConversationSummary,
} from "@/lib/queries/conversations";
import {
  activateLlmConnectionMutationOptions,
  deactivateLlmConnectionMutationOptions,
  deleteLlmConnectionMutationOptions,
  saveLlmConnectionMutationOptions,
  type SaveLlmConnectionInput,
} from "@/lib/queries/llm-connections";
import { applyRetryReset, applyStreamEvent, createOptimisticUserMessage } from "@/components/chat/chat-stream-state";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useChatStore } from "./store/useChatStore";
import { useDraftCache, readNewChatDraft } from "./hooks/useDraftCache";
import { ChatSidebar } from "./layout/ChatSidebar";
import { ChatHeader } from "./layout/ChatHeader";
import { MessageList } from "./messages/MessageList";
import { ChatComposer } from "./composer/ChatComposer";
import { ComposerConnectionSelect } from "./composer/ComposerConnectionSelect";
import { ChatConnectionPicker } from "./picker/ChatConnectionPicker";

export function ChatPageClient() {
  const router = useRouter();
  const { conversationId: activeConversationId = null } = useParams<{ conversationId?: string }>();
  const queryClient = useQueryClient();

  const session = authClient.useSession();
  const user = session.data?.user;

  const chatOptionsQuery = useQuery(chatOptionsQueryOptions());
  const conversationsQuery = useQuery(conversationsQueryOptions());
  const activeConversationQuery = useQuery(conversationDetailsQueryOptions(activeConversationId ?? ""));

  const {
    composerInput,
    setComposerInput,
    setComposerError,
    setIsSending,
    beginSignOut,
    endSignOut,
    closePicker,
    closeSidebar,
    isSidebarOpen,
    pendingConversation,
    setPendingConversation,
    clearPendingConversation,
  } = useChatStore();

  // The localStorage key for the current chat: conversationId or "new" for on-the-fly
  const chatKey = activeConversationId ?? "new";

  // Close the mobile conversation drawer whenever the active conversation
  // changes (selection, redirect to first conversation, or delete).
  useEffect(() => {
    closeSidebar();
  }, [activeConversationId, closeSidebar]);

  const { readDraftText, setDraft, clearDraft } = useDraftCache(chatKey, pendingConversation);

  // On startup: restore on-the-fly state from localStorage if present
  useEffect(() => {
    if (!pendingConversation) {
      const saved = readNewChatDraft();
      if (saved) {
        setPendingConversation({
          databaseSourceId: saved.databaseSourceId,
          llmConnectionId: saved.llmConnectionId,
        });
      }
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On chatKey change: restore draft text into composer
  useEffect(() => {
    setComposerInput(readDraftText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatKey]);

  const createConversationMutation = useMutation({
    ...createConversationMutationOptions(),
    onSuccess(conversation) {
      queryClient.setQueryData<ConversationSummary[] | undefined>(
        conversationsQueryKey,
        (current) => [conversation, ...(current ?? [])],
      );
    },
  });

  const createLlmConnectionMutation = useMutation({
    ...saveLlmConnectionMutationOptions(),
    onSuccess(connection) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) => current ? { ...current, llmConnections: [connection, ...current.llmConnections] } : current,
      );
    },
  });

  const activateLlmConnectionMutation = useMutation({
    ...activateLlmConnectionMutationOptions(),
    onSuccess(connection) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) => current ? { ...current, llmConnections: current.llmConnections.map((item) => item.id === connection.id ? connection : item) } : current,
      );
    },
  });

  const deactivateLlmConnectionMutation = useMutation({
    ...deactivateLlmConnectionMutationOptions(),
    onSuccess(connection) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) => current ? { ...current, llmConnections: current.llmConnections.map((item) => item.id === connection.id ? connection : item) } : current,
      );
    },
  });

  const deleteLlmConnectionMutation = useMutation({
    ...deleteLlmConnectionMutationOptions(),
    onSuccess(result) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) => current ? { ...current, llmConnections: current.llmConnections.filter((item) => item.id !== result.id) } : current,
      );
    },
  });

  const updateConversationRuntimeMutation = useMutation(updateConversationRuntimeMutationOptions());
  const deleteConversationMutation = useMutation(deleteConversationMutationOptions());

  // Redirect /chat → first existing conversation, but only when there is no pending on-the-fly state
  // and no localStorage draft that hasn't been restored yet (guards against SPA navigation racing
  // the startup restore effect on the same render cycle).
  useEffect(() => {
    if (!activeConversationId && !pendingConversation && !readNewChatDraft() && conversationsQuery.data?.length) {
      router.replace("/chat/" + conversationsQuery.data[0].id);
    }
  }, [activeConversationId, pendingConversation, conversationsQuery.data, router]);

  const activeConversation = activeConversationQuery.data;
  const hasStreamingAssistantMessage = Boolean(
    activeConversation?.messages.some((message) => message.role === "assistant" && message.status === "STREAMING"),
  );
  const isConversationRuntimeAvailable = activeConversation?.runtime.isAvailableForChat ?? false;
  const runtimeWarning = activeConversation && !isConversationRuntimeAvailable ? activeConversation.runtime.warning : null;
  const isPendingRuntimeUpdate = updateConversationRuntimeMutation.isPending;
  const isSending = useChatStore((s) => s.isSending);
  const composerError = useChatStore((s) => s.composerError);

  const isComposerLocked = isSending || isPendingRuntimeUpdate || hasStreamingAssistantMessage || Boolean(activeConversation && !isConversationRuntimeAvailable);
  const visibleComposerError = runtimeWarning ?? composerError;

  const selectedSource = useMemo(() => activeConversation?.databaseSource ?? null, [activeConversation]);
  const selectedLlmConnection = useMemo(() => activeConversation?.llmConnection ?? null, [activeConversation]);

  // Resolve a human-readable label for the pending on-the-fly state
  const pendingLabel = useMemo(() => {
    if (!pendingConversation || !chatOptionsQuery.data) return null;
    const src = chatOptionsQuery.data.databaseSources.find(
      (s) => s.id === pendingConversation.databaseSourceId,
    );
    const llm = chatOptionsQuery.data.llmConnections.find(
      (c) => c.id === pendingConversation.llmConnectionId,
    );
    if (!src || !llm) return null;
    return `${src.label} · ${llm.defaultModel ?? "selected model"}`;
  }, [pendingConversation, chatOptionsQuery.data]);

  useEffect(() => {
    if (activeConversation?.runtime.isAvailableForChat) {
      setComposerError(null);
    }
  }, [activeConversation?.id, activeConversation?.runtime.isAvailableForChat, setComposerError]);

  async function invalidateConversationCaches(conversationId?: string | null) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: chatOptionsQueryKey }),
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
      ...(conversationId ? [queryClient.invalidateQueries({ queryKey: conversationDetailsQueryKey(conversationId) })] : []),
    ]);
  }

  async function handleLogout() {
    if (useChatStore.getState().isSigningOut) return;
    beginSignOut();
    try {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      endSignOut();
    }
  }

  async function handleSwitchConversationConnection(llmConnectionId: string | null) {
    if (!activeConversation || !llmConnectionId) return;

    setComposerError(null);
    const updatedConversation = await updateConversationRuntimeMutation.mutateAsync({
      conversationId: activeConversation.id,
      input: {
        llmConnectionId,
        llmModelOverride: activeConversation.llmModelOverride,
      },
    });

    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversation.id),
      updatedConversation,
    );
    await queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
  }

  function handleSuggestionClick(text: string) {
    setComposerInput(text);
  }

  async function handleDeleteConversation(conversationId: string) {
    if (deleteConversationMutation.isPending) return;
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm("Delete this conversation? This can't be undone.");
    if (!confirmed) return;

    try {
      await deleteConversationMutation.mutateAsync(conversationId);

      // Drop it from the sidebar list and its details cache.
      queryClient.setQueryData<ConversationSummary[] | undefined>(
        conversationsQueryKey,
        (current) => current?.filter((conversation) => conversation.id !== conversationId),
      );
      queryClient.removeQueries({ queryKey: conversationDetailsQueryKey(conversationId) });

      // If the open conversation was deleted, leave it.
      if (activeConversationId === conversationId) {
        router.push("/chat");
      }
    } catch (error) {
      setComposerError(
        error instanceof Error ? error.message : "Unable to delete conversation.",
      );
    } finally {
      await queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    }
  }

  async function handleRetryMessage(messageId: string) {
    if (!activeConversationId || isComposerLocked) return;

    setComposerError(null);
    setIsSending(true);

    // Reset the failed bubble in place so the retry reuses it.
    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversationId),
      (current) => applyRetryReset(current, messageId),
    );

    try {
      await retryConversationMessage(activeConversationId, messageId, (event) => {
        queryClient.setQueryData<ConversationDetails | undefined>(
          conversationDetailsQueryKey(activeConversationId),
          (current) => applyStreamEvent(current, event),
        );
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to retry the message.";
      setComposerError(message);
      markStreamingMessageFailed(activeConversationId, message, messageId);
    } finally {
      setIsSending(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationDetailsQueryKey(activeConversationId) }),
        queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
      ]);
    }
  }

  // When a stream errors or the connection drops mid-response, flip the stuck
  // STREAMING bubble to FAILED so the user gets a Retry affordance instead of an
  // endless spinner. A server-side safety net persists the same terminal state,
  // and the trailing invalidate reconciles with it.
  function markStreamingMessageFailed(
    conversationId: string,
    errorMessage: string,
    messageId?: string,
  ) {
    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(conversationId),
      (current) =>
        applyStreamEvent(current, {
          type: "message_failed",
          data: {
            error: errorMessage,
            ...(messageId ? { messageId } : {}),
          },
        }),
    );
  }

  async function handleSendMessage() {
    const content = composerInput.trim();
    if (!content || isComposerLocked) return;

    // ── On-the-fly path: create conversation first, then send ──────────────
    if (!activeConversationId && pendingConversation) {
      if (!pendingConversation.databaseSourceId) {
        setComposerError("No database source selected.");
        return;
      }

      setComposerError(null);
      setIsSending(true);
      setComposerInput("");

      let newConversationId: string;
      try {
        const conversation = await createConversationMutation.mutateAsync({
          databaseSourceId: pendingConversation.databaseSourceId,
          llmConnectionId: pendingConversation.llmConnectionId,
          title: "New chat",
        });
        newConversationId = conversation.id;
        // Seed the details cache BEFORE navigating so the new page finds the
        // conversation (with an empty messages list) immediately on mount.
        queryClient.setQueryData<ConversationDetails>(
          conversationDetailsQueryKey(newConversationId),
          { ...conversation, messages: [] },
        );
        clearPendingConversation();
        clearDraft(); // remove kakaw:draft:new
        // Navigate to the real conversation URL
        router.push("/chat/" + newConversationId);
      } catch (error) {
        setComposerError(error instanceof Error ? error.message : "Unable to create conversation.");
        setIsSending(false);
        // Restore the input so the user doesn't lose their message
        setComposerInput(content);
        return;
      }

      // Append the optimistic user message — cache is guaranteed non-empty now
      queryClient.setQueryData<ConversationDetails | undefined>(
        conversationDetailsQueryKey(newConversationId),
        (current) => current ? { ...current, messages: [...current.messages, createOptimisticUserMessage(content)] } : current,
      );

      try {
        await streamConversationMessage(newConversationId, content, (event) => {
          queryClient.setQueryData<ConversationDetails | undefined>(
            conversationDetailsQueryKey(newConversationId),
            (current) => applyStreamEvent(current, event),
          );
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to stream chat response.";
        setComposerError(message);
        markStreamingMessageFailed(newConversationId, message);
      } finally {
        setIsSending(false);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: conversationDetailsQueryKey(newConversationId) }),
          queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
        ]);
      }
      return;
    }

    // ── Existing conversation path ─────────────────────────────────────────
    if (!activeConversationId || isComposerLocked) {
      if (activeConversation && !isConversationRuntimeAvailable) {
        setComposerError(activeConversation.runtime.warning ?? "This conversation is read-only until its runtime is restored.");
      }
      return;
    }

    if (!selectedSource?.canStartChat) {
      setComposerError("The selected database is still indexing with the agent runtime.");
      return;
    }

    if (!isConversationRuntimeAvailable) {
      setComposerError(runtimeWarning ?? "This conversation is read-only until its runtime is restored.");
      return;
    }

    setComposerError(null);
    setIsSending(true);
    setComposerInput("");

    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversationId),
      (current) => current ? { ...current, messages: current.messages.map((msg) => ({ ...msg, suggestions: [] })) } : current,
    );

    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversationId),
      (current) => current ? { ...current, messages: [...current.messages, createOptimisticUserMessage(content)] } : current,
    );

    try {
      await streamConversationMessage(activeConversationId, content, (event) => {
        queryClient.setQueryData<ConversationDetails | undefined>(
          conversationDetailsQueryKey(activeConversationId),
          (current) => applyStreamEvent(current, event),
        );
      });
      clearDraft(); // clear saved draft for this conversation after successful send
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to stream chat response.";
      setComposerError(message);
      markStreamingMessageFailed(activeConversationId, message);
    } finally {
      setIsSending(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationDetailsQueryKey(activeConversationId) }),
        queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
      ]);
    }
  }

  const readyConnections = chatOptionsQuery.data?.llmConnections.filter((c) => c.canStartChat) ?? [];

  return (
    <>
      <ChatConnectionPicker
        key={`${useChatStore((s) => s.isConnectionPickerOpen ? "open" : "closed")}:${useChatStore((s) => s.pickerStartsInAddLlmMode ? "add" : "pick")}:${activeConversationId ?? "none"}`}
        databaseSources={chatOptionsQuery.data?.databaseSources}
        llmConnections={chatOptionsQuery.data?.llmConnections}
        isLoading={chatOptionsQuery.isLoading}
        isRefreshing={chatOptionsQuery.isFetching && Boolean(chatOptionsQuery.data)}
        error={chatOptionsQuery.error instanceof Error ? chatOptionsQuery.error : null}
        activeSourceId={selectedSource?.id ?? null}
        activeLlmConnectionId={selectedLlmConnection?.id ?? null}
        isCreatingConversation={false}
        isCreatingLlmConnection={createLlmConnectionMutation.isPending}
        createLlmError={createLlmConnectionMutation.error instanceof Error ? createLlmConnectionMutation.error : null}
        onRetry={() => void chatOptionsQuery.refetch()}
        onCreateLlmConnection={async (input: SaveLlmConnectionInput) => {
          await createLlmConnectionMutation.mutateAsync(input);
          await chatOptionsQuery.refetch();
        }}
        onActivateLlmConnection={async (id) => {
          await activateLlmConnectionMutation.mutateAsync(id);
          await invalidateConversationCaches(activeConversationId);
        }}
        onDeactivateLlmConnection={async (id) => {
          await deactivateLlmConnectionMutation.mutateAsync(id);
          await invalidateConversationCaches(activeConversationId);
        }}
        onDeleteLlmConnection={async (id) => {
          await deleteLlmConnectionMutation.mutateAsync(id);
          await invalidateConversationCaches(activeConversationId);
        }}
        onConfirmSelection={(selection) => {
          // Deferred creation: store the selection, do NOT call the API yet
          setPendingConversation({
            databaseSourceId: selection.source.id,
            llmConnectionId: selection.llmConnection.id,
          });
          closePicker();
          // Navigate to /chat (no ID) so the on-the-fly state is active
          router.push("/chat");
        }}
      />

      <div className="flex h-dvh overflow-hidden bg-surface font-body text-on-surface">
        {isSidebarOpen ? (
          <button
            type="button"
            aria-label="Close conversations"
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-on-surface/35 backdrop-blur-sm lg:hidden"
          />
        ) : null}
        <ChatSidebar
          user={user}
          activeConversationId={activeConversationId}
          conversations={conversationsQuery.data}
          onConversationClick={(id) => router.push("/chat/" + id)}
          onDeleteConversation={handleDeleteConversation}
          deletingConversationId={
            deleteConversationMutation.isPending
              ? (deleteConversationMutation.variables ?? null)
              : null
          }
          onLogout={handleLogout}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-surface-container-lowest">
          <ChatHeader activeConversation={activeConversation} />

          <MessageList
            activeConversation={activeConversation}
            isLoading={activeConversationQuery.isLoading}
            isComposerLocked={isComposerLocked}
            isBusy={isComposerLocked}
            onSuggestionClick={handleSuggestionClick}
            onRetryMessage={handleRetryMessage}
          />

          <footer className="border-t border-outline-variant/15 px-4 py-3 md:px-8 md:py-4">
            {activeConversation ? (
              <ComposerConnectionSelect
                activeConnectionId={activeConversation.llmConnectionId}
                readyConnections={readyConnections}
                isPending={isPendingRuntimeUpdate}
                visibleComposerError={visibleComposerError}
                onSwitch={handleSwitchConversationConnection}
              />
            ) : null}

            <ChatComposer
              activeConversation={activeConversation}
              chatKey={chatKey}
              pendingLabel={pendingLabel}
              isComposerLocked={isComposerLocked}
              isConversationRuntimeAvailable={isConversationRuntimeAvailable}
              hasStreamingAssistantMessage={hasStreamingAssistantMessage}
              isPendingRuntimeUpdate={isPendingRuntimeUpdate}
              onDraftChange={setDraft}
              onSendMessage={handleSendMessage}
            />
          </footer>
        </main>
      </div>
    </>
  );
}
