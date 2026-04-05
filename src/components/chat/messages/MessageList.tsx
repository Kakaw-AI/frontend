"use client";

import { MessageCard } from "@/components/chat/MessageCard";
import type { ConversationDetails } from "@/lib/queries/conversations";
import { useEffect, useRef } from "react";

export function MessageList({
  activeConversation,
  isLoading,
  isComposerLocked,
  onSuggestionClick,
}: {
  activeConversation: ConversationDetails | undefined;
  isLoading: boolean;
  isComposerLocked: boolean;
  onSuggestionClick: (text: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation?.messages]);

  if (isLoading) {
    return (
      <section className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low px-6 py-8 text-sm text-on-surface/60">
          Loading conversation...
        </div>
      </section>
    );
  }

  if (!activeConversation) {
    return (
      <section className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="rounded-3xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface/60">
          Select a conversation or create a new one.
        </div>
      </section>
    );
  }

  const lastAssistantIndex = [...activeConversation.messages]
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.role === "assistant" && m.status === "COMPLETED")
    .at(-1)?.i ?? -1;

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
      <div className="space-y-5">
        {activeConversation.messages.map((message, index) => (
          <MessageCard
            key={message.id}
            message={message}
            isLastAssistantMessage={index === lastAssistantIndex && !isComposerLocked}
            onSuggestionClick={onSuggestionClick}
          />
        ))}

        {!activeConversation.messages.length ? (
          <div className="rounded-3xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface/60">
            Ask a question to get started.
          </div>
        ) : null}
        
        <div ref={bottomRef} className="h-px w-full" />
      </div>
    </section>
  );
}
