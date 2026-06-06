"use client";

import { Database, LogOut, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
}) {
  const openPicker = useChatStore((s) => s.openPicker);
  const openAddLlmPicker = useChatStore((s) => s.openAddLlmPicker);
  const isSigningOut = useChatStore((s) => s.isSigningOut);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col gap-5 border-r border-outline-variant/15 bg-surface-container-low p-4">
      <div className="flex items-center gap-3 px-2">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-primary">
          <Image src="/mascot.png" alt="Kakaw AI" fill sizes="36px" className="object-cover" />
        </div>
        <div>
          <h1 className="font-headline text-xl font-bold italic text-primary">Kakaw AI</h1>
          <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface/45">Your AI data analyst</p>
        </div>
      </div>

      <button
        type="button"
        onClick={openPicker}
        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-sm shadow-primary/20"
      >
        <Plus size={16} />
        New Chat
      </button>

      <div className="grid gap-2">
        <Link
          href="/onboarding/database"
          className="flex items-center justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface/75 transition-colors hover:border-primary/25 hover:text-primary"
        >
          <span className="inline-flex items-center gap-3">
            <Database size={16} />
            Add Database
          </span>
          <Plus size={14} />
        </Link>

        <button
          type="button"
          onClick={openAddLlmPicker}
          className="flex items-center justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface/75 transition-colors hover:border-primary/25 hover:text-primary"
        >
          <span className="inline-flex items-center gap-3">
            <Sparkles size={16} />
            Connect LLM
          </span>
          <Plus size={14} />
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/35" />
        <input
          className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-lowest py-2 pr-4 pl-10 text-sm placeholder:text-on-surface/30"
          placeholder="Search conversations"
          type="text"
          readOnly
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface/35">
          Conversations
        </p>

        <div className="space-y-2">
          {conversations?.map((conversation) => (
            <div
              key={conversation.id}
              className={
                activeConversationId === conversation.id
                  ? "group relative rounded-2xl border border-primary/20 bg-white shadow-sm"
                  : "group relative rounded-2xl border border-transparent bg-surface-container-lowest"
              }
            >
              <button
                type="button"
                onClick={() => onConversationClick(conversation.id)}
                className="w-full rounded-2xl px-4 py-3 pr-10 text-left"
              >
                <p className="truncate text-sm font-semibold text-on-surface">{conversation.title}</p>
                <p className="mt-1 text-xs text-on-surface/55">{describeConversationRuntime(conversation)}</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
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
                className="absolute right-2 top-2 rounded-lg p-1.5 text-on-surface/35 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {!conversations?.length ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-lowest px-4 py-5 text-sm text-on-surface/60">
              No conversations yet.
            </div>
          ) : null}
        </div>
      </div>

      {user ? (
        <div className="space-y-3 border-t border-outline-variant/15 pt-4">
          <div className="flex items-center gap-3 px-2">
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(user.name, user.email)}
              </div>
            )}
            <div className="min-w-0">
              {user.name ? (
                <p className="truncate text-sm font-semibold text-on-surface">{user.name}</p>
              ) : null}
              {user.email ? (
                <p className="truncate text-xs text-on-surface/55">{user.email}</p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={isSigningOut}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface/70 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={14} className="transition-colors group-hover:text-rose-600" />
            {isSigningOut ? "Signing Out" : "Log Out"}
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
