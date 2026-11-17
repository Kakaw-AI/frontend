"use client";

import { Database, LogOut, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { formatConversationTime } from "@/components/chat/chat-formatting";
import { describeConversationRuntime, type ConversationSummary } from "@/lib/queries/conversations";
import { useChatStore } from "../store/useChatStore";

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
      className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col gap-4 border-r-2 border-border bg-surface-container p-4 transition-transform duration-300 lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:shrink-0 lg:transition-none ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="px-2 pt-1">
        <Logo />
      </div>

      <Link
        href="/chat"
        onClick={closeSidebar}
        className="pod-btn"
      >
        <Plus size={16} strokeWidth={2.5} />
        New chat
      </Link>

      <div className="flex gap-2">
        <Link
          href="/onboarding/database"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-border bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-accent"
        >
          <Database size={14} />
          Database
        </Link>
        <button
          type="button"
          onClick={openAddLlmPicker}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-border bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-accent"
        >
          <Sparkles size={14} />
          Model
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          aria-label="Search conversations"
          className="w-full rounded-[8px] border border-primary/20 bg-surface-container-lowest py-2 pr-4 pl-10 text-sm placeholder:text-on-surface-variant focus:border-border focus:outline-none"
          placeholder="Search conversations"
          type="text"
          readOnly
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-2 px-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant">
          Conversations
        </p>

        <div className="space-y-1">
          {conversations?.map((conversation) => (
            <div
              key={conversation.id}
              className={
                activeConversationId === conversation.id
                  ? "group relative rounded-2xl border border-border bg-surface-container-lowest"
                  : "group relative rounded-2xl border border-transparent hover:bg-surface-container-lowest/70"
              }
            >
              <button
                type="button"
                onClick={() => {
                  onConversationClick(conversation.id);
                  closeSidebar();
                }}
                className="w-full rounded-2xl px-3 py-2.5 pr-9 text-left"
              >
                <p className="truncate text-sm font-bold text-on-surface">{conversation.title}</p>
                <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                  {describeConversationRuntime(conversation)} · {formatConversationTime(conversation.lastMessageAt)}
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
                className="absolute right-2 top-2 rounded-full p-1.5 text-on-surface-variant opacity-0 transition-opacity hover:bg-secondary-container hover:text-secondary focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {!conversations?.length ? (
            <div className="rounded-2xl border border-dashed border-primary/30 px-4 py-5 text-sm text-on-surface-variant">
              No conversations yet.
            </div>
          ) : null}
        </div>
      </div>

      {user ? (
        <div className="space-y-3 border-t-2 border-primary/15 pt-4">
          <div className="flex items-center gap-3 px-1">
            {user.image ? (
              // GitHub/Google avatar hosts are whitelisted in next.config images.
              <Image
                src={user.image}
                alt={user.name ?? "User avatar"}
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-accent text-xs font-bold text-primary">
                {getInitials(user.name, user.email)}
              </div>
            )}
            <div className="min-w-0">
              {user.name ? (
                <p className="truncate text-sm font-semibold text-on-surface">{user.name}</p>
              ) : null}
              {user.email ? (
                <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onLogout}
              disabled={isSigningOut}
              aria-label={isSigningOut ? "Signing out" : "Log out"}
              title="Log out"
              className="ml-auto shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-lowest hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={onDeleteAccount}
            disabled={isSigningOut}
            className="w-full text-center text-xs text-on-surface-variant underline-offset-2 transition-colors hover:text-secondary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete account
          </button>
        </div>
      ) : null}
    </aside>
  );
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
