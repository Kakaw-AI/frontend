"use client";

import { formatConversationTitle } from "@/components/chat/chat-formatting";
import type { ConversationDetails } from "@/lib/queries/conversations";

export function ChatHeader({ activeConversation }: { activeConversation: ConversationDetails | undefined }) {
  return (
    <header className="flex items-center justify-between border-b border-outline-variant/15 px-8 py-5">
      <div>
        <h2 className="font-headline text-2xl italic text-primary">
          {activeConversation
            ? formatConversationTitle(activeConversation.title)
            : "Select or create a conversation"}
        </h2>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-on-surface/35">
          Your conversation history
        </p>
      </div>
    </header>
  );
}
