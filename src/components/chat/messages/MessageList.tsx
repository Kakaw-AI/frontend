"use client";

import { MessageCard } from "@/components/chat/MessageCard";
import type { ConversationDetails } from "@/lib/queries/conversations";
import { useEffect, useMemo, useRef } from "react";

export function MessageList({
  activeConversation,
  isLoading,
  isComposerLocked,
  isBusy,
  onSuggestionClick,
  onRetryMessage,
}: {
  activeConversation: ConversationDetails | undefined;
  isLoading: boolean;
  isComposerLocked: boolean;
  isBusy: boolean;
  onSuggestionClick: (text: string) => void;
  onRetryMessage: (messageId: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation?.messages;
  const messageCount = messages?.length ?? 0;
  const streamingLength = messages?.[messageCount - 1]?.content.length ?? 0;

  // Keyed on shape rather than array identity. The array is replaced on every
  // streamed token, which restarted the smooth scroll animation each time and
  // left it permanently mid-flight. Auto-scroll snaps while text is streaming
  // and animates only when a new message arrives.
  const isStreaming = messages?.[messageCount - 1]?.status === "STREAMING";
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount, streamingLength]);

  const lastAssistantIndex = useMemo(() => {
    if (!messages) {
      return -1;
    }
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === "assistant" && message.status === "COMPLETED") {
        return index;
      }
    }
    return -1;
  }, [messages]);

  if (isLoading) {
    return (
      <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
        <div className="rounded-lg border border-border bg-surface-container-lowest px-6 py-8 text-sm text-on-surface-variant">
          Loading conversation...
        </div>
      </section>
    );
  }

  if (!activeConversation) {
    return (
      <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
        <div className="rounded-lg border border-dashed border-primary/30 px-6 py-12 text-center text-sm text-on-surface-variant">
          Pick a database and model below, then ask your first question.
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {activeConversation.messages.map((message, index) => (
          <MessageCard
            key={message.id}
            message={message}
            isLastAssistantMessage={index === lastAssistantIndex && !isComposerLocked}
            isBusy={isBusy}
            onSuggestionClick={onSuggestionClick}
            onRetry={onRetryMessage}
          />
        ))}

        {!activeConversation.messages.length ? (
          <div className="rounded-lg border border-dashed border-primary/30 px-6 py-12 text-center text-sm text-on-surface-variant">
            Ask a question to get started.
          </div>
        ) : null}
        
        <div ref={bottomRef} className="h-px w-full" />
      </div>
    </section>
  );
}
