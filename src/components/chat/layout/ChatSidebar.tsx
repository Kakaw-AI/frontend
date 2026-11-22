"use client";

import { ChevronRight, Database, LogOut, Plus, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { formatConversationTime } from "@/components/chat/chat-formatting";
import type { ConversationSummary } from "@/lib/queries/conversations";
import { useChatStore } from "../store/useChatStore";

const navItem =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-on-surface-variant transition-colors hover:bg-accent/60 hover:text-on-surface";

export function ChatSidebar({
  user,
  activeConversationId,
  conversations,
  onConversationClick,
  onDeleteConversation,
  deletingConversationId,
  onLogout,
  onDeleteAccount,
}: {
  user:
    | { name?: string | null; email?: string | null; image?: string | null }
    | null
    | undefined;
  activeConversationId: string | null;
  conversations: ConversationSummary[] | undefined;
  onConversationClick: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  deletingConversationId: string | null;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) {
  const openAddLlmPicker = useChatStore((s) => s.openAddLlmPicker);
  const isSigningOut = useChatStore((s) => s.isSigningOut);
  const isSidebarOpen = useChatStore((s) => s.isSidebarOpen);
  const closeSidebar = useChatStore((s) => s.closeSidebar);

  return (
    // Mobile: off-canvas drawer toggled by the header hamburger. Desktop (lg+):
    // a static in-flow column — the lg: utilities fully neutralize the drawer.
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 max-w-[85vw] flex-col gap-3 border-r border-border bg-sidebar p-3 transition-transform duration-300 lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:shrink-0 lg:transition-none ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-2 pt-0.5">
        <Logo className="text-xl" />
        <Link
          href="/chat"
          onClick={closeSidebar}
          aria-label="New chat"
          title="New chat"
          className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-accent/60 hover:text-on-surface"
        >
          <Plus size={16} />
        </Link>
      </div>

      <nav className="space-y-0.5">
        <Link href="/onboarding/database" className={navItem}>
          <Database size={14} />
          Databases
        </Link>
        <button type="button" onClick={openAddLlmPicker} className={navItem}>
          <Sparkles size={14} />
          Models
        </button>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-1 px-2 text-[11px] font-medium text-on-surface-variant">Recent</p>

        <div className="space-y-1">
          {groupByDatabase(conversations).map((group) => (
            // Native disclosure: collapses with no state of its own. Open by default.
            <details key={group.id} open className="group/db">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-on-surface transition-colors hover:bg-accent/60 [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  size={13}
                  className="shrink-0 text-on-surface-variant transition-transform group-open/db:rotate-90"
                />
                <Database size={12} className="shrink-0 text-on-surface-variant" />
                <span className="truncate">{group.label}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] font-medium text-on-surface-variant">
                  {group.conversations.length}
                </span>
              </summary>

              <div className="mt-px space-y-px pl-3">
                {group.conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={
                      activeConversationId === conversation.id
                        ? "group relative rounded-md bg-accent"
                        : "group relative rounded-md hover:bg-accent/60"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onConversationClick(conversation.id);
                        closeSidebar();
                      }}
                      className="w-full rounded-md px-2 py-1.5 pr-8 text-left"
                    >
                      <p dir="auto" className="truncate text-[13px] font-medium text-on-surface">
                        {conversation.title}
                      </p>
                      <p className="truncate text-[11px] text-on-surface-variant">
                        {conversation.runtime.effectiveModel ?? "Unavailable LLM runtime"} ·{" "}
                        {formatConversationTime(conversation.lastMessageAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete conversation"
                      title="Delete conversation"
                      disabled={deletingConversationId === conversation.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className="absolute right-1 top-1.5 rounded-md p-1.5 text-on-surface-variant opacity-0 transition-opacity hover:bg-secondary-container hover:text-secondary focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          ))}

          {!conversations?.length ? (
            <p className="px-2 py-3 text-[13px] text-on-surface-variant">No conversations yet.</p>
          ) : null}
        </div>
      </div>

      {user ? (
        <div className="space-y-1 border-t border-border pt-3">
          <div className="flex items-center gap-2 px-1">
            {user.image ? (
              // GitHub/Google avatar hosts are whitelisted in next.config images.
              <Image
                src={user.image}
                alt={user.name ?? "User avatar"}
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-on-surface">
                {getInitials(user.name, user.email)}
              </div>
            )}
            <div className="min-w-0 leading-tight">
              {user.name ? (
                <p className="truncate text-[13px] font-medium text-on-surface">{user.name}</p>
              ) : null}
              {user.email ? (
                <p className="truncate text-[11px] text-on-surface-variant">{user.email}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onLogout}
              disabled={isSigningOut}
              aria-label={isSigningOut ? "Signing out" : "Log out"}
              title="Log out"
              className="ml-auto shrink-0 rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-accent/60 hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={onDeleteAccount}
            disabled={isSigningOut}
            className="w-full px-1 text-left text-[11px] text-on-surface-variant underline-offset-2 transition-colors hover:text-secondary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete account
          </button>
        </div>
      ) : null}
    </aside>
  );
}

/** One group per database, in the order its most recent chat appears. */
function groupByDatabase(conversations: ConversationSummary[] | undefined) {
  const groups = new Map<string, { id: string; label: string; conversations: ConversationSummary[] }>();
  for (const conversation of conversations ?? []) {
    const id = conversation.databaseSourceId;
    let group = groups.get(id);
    if (!group) {
      group = { id, label: conversation.databaseSource.label, conversations: [] };
      groups.set(id, group);
    }
    group.conversations.push(conversation);
  }
  return [...groups.values()];
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
