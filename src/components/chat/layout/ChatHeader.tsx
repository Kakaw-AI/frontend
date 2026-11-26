"use client";

import { Menu } from "lucide-react";
import { formatConversationTitle } from "@/components/chat/chat-formatting";
import { useChatStore } from "@/components/chat/store/useChatStore";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import { databaseTerms } from "@/lib/database-terms";
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
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-on-surface-variant">
          <DatabaseLogo provider={activeConversation.databaseSource.provider} className="h-4 w-4 shrink-0" />
          {databaseTerms(activeConversation.databaseSource.provider).name}
          <span className="hidden max-w-48 truncate sm:inline">· {activeConversation.databaseSource.label}</span>
        </span>
      ) : null}
    </header>
  );
}
