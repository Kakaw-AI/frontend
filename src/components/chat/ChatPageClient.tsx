"use client";

import { authClient } from "@/lib/auth-client";
import { chatOptionsQueryKey, chatOptionsQueryOptions, type ChatOptions } from "@/lib/queries/chat-options";
import {
  conversationDetailsQueryKey,
  conversationDetailsQueryOptions,
  conversationsQueryKey,
  conversationsQueryOptions,
  createConversationMutationOptions,
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
import { applyStreamEvent, createOptimisticUserMessage } from "@/components/chat/chat-stream-state";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useChatStore } from "./store/useChatStore";
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
    closePicker
  } = useChatStore();

  const createConversationMutation = useMutation({
    ...createConversationMutationOptions(),
    onSuccess(conversation) {
      queryClient.setQueryData<ConversationSummary[] | undefined>(
        conversationsQueryKey,
        (current) => [conversation, ...(current ?? [])],
      );
      router.push("/chat/" + conversation.id);
      closePicker();
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

  useEffect(() => {
    if (!activeConversationId && conversationsQuery.data?.length) {
      router.replace("/chat/" + conversationsQuery.data[0].id);
    }
  }, [activeConversationId, conversationsQuery.data, router]);

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

  async function handleSendMessage() {
    const content = composerInput.trim();
    if (!content || !activeConversationId || isComposerLocked) {
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
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : "Unable to stream chat response.");
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
        isCreatingConversation={createConversationMutation.isPending}
        isCreatingLlmConnection={createLlmConnectionMutation.isPending}
        createLlmError={createLlmConnectionMutation.error instanceof Error ? createLlmConnectionMutation.error : null}
        onRetry={() => void chatOptionsQuery.refetch()}
        onCreateLlmConnection={async (input) => {
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
          createConversationMutation.mutate({
            databaseSourceId: selection.source.id,
            llmConnectionId: selection.llmConnection.id,
            title: "New chat",
          });
        }}
      />

      <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface">
        <ChatSidebar
          user={user}
          activeConversationId={activeConversationId}
          conversations={conversationsQuery.data}
          onConversationClick={(id) => router.push("/chat/" + id)}
          onLogout={handleLogout}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-surface-container-lowest">
          <ChatHeader activeConversation={activeConversation} />

          <MessageList
            activeConversation={activeConversation}
            isLoading={activeConversationQuery.isLoading}
            isComposerLocked={isComposerLocked}
            onSuggestionClick={handleSuggestionClick}
          />

          <footer className="border-t border-outline-variant/15 px-8 py-4">
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
              isComposerLocked={isComposerLocked}
              isConversationRuntimeAvailable={isConversationRuntimeAvailable}
              hasStreamingAssistantMessage={hasStreamingAssistantMessage}
              isPendingRuntimeUpdate={isPendingRuntimeUpdate}
              onSendMessage={handleSendMessage}
            />
          </footer>
        </main>
      </div>
    </>
  );
}
