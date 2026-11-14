"use client";

import { Menu } from "lucide-react";
import { formatConversationTitle } from "@/components/chat/chat-formatting";
import { useChatStore } from "@/components/chat/store/useChatStore";
import type { ConversationDetails } from "@/lib/queries/conversations";

export function ChatHeader({ activeConversation }: { activeConversation: ConversationDetails | undefined }) {
  const openSidebar = useChatStore((s) => s.openSidebar);

  return (
    <header className="flex items-center justify-between border-b-2 border-primary/10 px-4 py-3 md:px-8 md:py-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Open conversations"
          className="-ml-1 shrink-0 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-container lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h2 className="truncate font-headline text-lg text-on-surface md:text-xl">
            {activeConversation
              ? formatConversationTitle(activeConversation.title)
              : "Select or create a conversation"}
          </h2>
          {activeConversation ? (
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">
              {activeConversation.databaseSource.label}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
