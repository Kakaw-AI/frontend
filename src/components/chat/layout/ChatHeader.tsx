"use client";

import { Menu } from "lucide-react";
import { formatConversationTitle } from "@/components/chat/chat-formatting";
import { useChatStore } from "@/components/chat/store/useChatStore";
import type { ConversationDetails } from "@/lib/queries/conversations";

export function ChatHeader({ activeConversation }: { activeConversation: ConversationDetails | undefined }) {
  const openSidebar = useChatStore((s) => s.openSidebar);

  return (
    <header className="flex items-center justify-between border-b border-outline-variant/15 px-4 py-4 md:px-8 md:py-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Open conversations"
          className="-ml-1 shrink-0 rounded-lg p-2 text-on-surface/70 transition-colors hover:bg-surface-container lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h2 className="truncate font-headline text-xl italic text-primary md:text-2xl">
            {activeConversation
              ? formatConversationTitle(activeConversation.title)
              : "Select or create a conversation"}
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-on-surface/35">
            Your conversation history
          </p>
        </div>
      </div>
    </header>
  );
}
