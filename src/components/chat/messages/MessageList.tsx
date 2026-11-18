"use client";

import { Skeleton } from "@/components/amicro/skeleton";
import { MessageCard } from "@/components/chat/MessageCard";
import type { ConversationDetails } from "@/lib/queries/conversations";
import { useEffect, useMemo, useRef } from "react";

const sectionClass = "min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6";
const emptyClass = "py-16 text-center text-sm text-on-surface-variant";

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
      <section className={sectionClass}>
        <div role="status" className="mx-auto max-w-3xl space-y-6 py-2">
          <span className="sr-only">Loading conversation…</span>
          <Skeleton className="ml-auto h-9 w-2/5 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  if (!activeConversation) {
    return (
      <section className={sectionClass}>
        <p className={emptyClass}>
          Pick a database and model below, then ask your first question.
        </p>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <div className="mx-auto max-w-3xl space-y-5">
        {activeConversation.messages.map((message, index) => (
          <MessageCard
            key={message.id}
            message={message}
            isLastAssistantMessage={
              index === lastAssistantIndex && !isComposerLocked
            }
            isBusy={isBusy}
            onSuggestionClick={onSuggestionClick}
            onRetry={onRetryMessage}
          />
        ))}

        {!activeConversation.messages.length ? (
          <p className={emptyClass}>Ask a question to get started.</p>
        ) : null}

        <div ref={bottomRef} className="h-px w-full" />
      </div>
    </section>
  );
}
