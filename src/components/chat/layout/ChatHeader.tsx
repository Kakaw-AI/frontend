"use client";

import { Menu } from "lucide-react";
import { formatConversationTitle } from "@/components/chat/chat-formatting";
import { useChatStore } from "@/components/chat/store/useChatStore";
import type { ConversationDetails } from "@/lib/queries/conversations";

export function ChatHeader({ activeConversation }: { activeConversation: ConversationDetails | undefined }) {
  const openSidebar = useChatStore((s) => s.openSidebar);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 md:px-6">
      <button
        type="button"
        onClick={openSidebar}
        aria-label="Open conversations"
        className="-ml-1 shrink-0 rounded-md p-1.5 text-on-surface transition-colors hover:bg-accent/60 lg:hidden"
      >
        <Menu size={18} />
      </button>
      <h2 className="min-w-0 truncate text-sm font-semibold text-on-surface">
        {activeConversation ? formatConversationTitle(activeConversation.title) : "New chat"}
      </h2>
      {activeConversation ? (
        <span className="hidden min-w-0 shrink-0 truncate text-xs text-on-surface-variant sm:inline">
          {activeConversation.databaseSource.label}
        </span>
      ) : null}
    </header>
  );
}
