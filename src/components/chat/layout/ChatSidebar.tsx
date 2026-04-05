"use client";

import { Bird, Database, LogOut, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatConversationTime } from "@/components/chat/chat-formatting";
import { describeConversationRuntime, type ConversationSummary } from "@/lib/queries/conversations";
import { useChatStore } from "../store/useChatStore";

export function ChatSidebar({
  user,
  activeConversationId,
  conversations,
  onConversationClick,
  onLogout,
}: {
  user: any;
  activeConversationId: string | null;
  conversations: ConversationSummary[] | undefined;
  onConversationClick: (id: string) => void;
  onLogout: () => void;
}) {
  const openPicker = useChatStore((s) => s.openPicker);
  const openAddLlmPicker = useChatStore((s) => s.openAddLlmPicker);
  const isSigningOut = useChatStore((s) => s.isSigningOut);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col gap-5 border-r border-outline-variant/15 bg-surface-container-low p-4">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
          <Bird size={18} />
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
            <button
              key={conversation.id}
              type="button"
              onClick={() => onConversationClick(conversation.id)}
              className={
                activeConversationId === conversation.id
                  ? "w-full rounded-2xl border border-primary/20 bg-white px-4 py-3 text-left shadow-sm"
                  : "w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-left"
              }
            >
              <p className="truncate text-sm font-semibold text-on-surface">{conversation.title}</p>
              <p className="mt-1 text-xs text-on-surface/55">{describeConversationRuntime(conversation)}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/35">
                {formatConversationTime(conversation.lastMessageAt)}
              </p>
            </button>
          ))}

          {!conversations?.length ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-lowest px-4 py-5 text-sm text-on-surface/60">
              No conversations yet.
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 border-t border-outline-variant/15 pt-4">
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            disabled={isSigningOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface/70"
          >
            <LogOut size={14} />
            {isSigningOut ? "Signing Out" : "Log Out"}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
