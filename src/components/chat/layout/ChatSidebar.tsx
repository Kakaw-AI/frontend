"use client";

import { AlertTriangle, ChevronRight, Database, LogOut, Plus, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { ProfileDialog } from "@/components/chat/layout/ProfileDialog";
import type { ConversationSummary } from "@/lib/queries/conversations";
import { useChatStore } from "../store/useChatStore";

const navItem =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-on-surface-variant transition-colors hover:bg-accent/60 hover:text-on-surface pointer-coarse:min-h-11";

// A mouse shows a row's delete button on hover; a touch screen cannot hover,
// so there it is always shown, at a size a finger can hit. The variants are
// written out in full: Tailwind only generates classes it finds as literals.

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    // Mobile: off-canvas drawer toggled by the header hamburger. Desktop (lg+):
    // a static in-flow column — the lg: utilities fully neutralize the drawer.
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 max-w-[85vw] flex-col gap-3 border-r border-border bg-sidebar p-3 transition-transform duration-300 lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:shrink-0 lg:transition-none ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="px-2 pt-0.5">
        <Logo className="text-xl" />
      </div>

      {/* The sidebar's main action, so the one filled button in it. */}
      <Link href="/chat" onClick={closeSidebar} className="pod-btn w-full py-2.5 pointer-coarse:min-h-11">
        <Plus size={15} aria-hidden />
        New chat
      </Link>

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
        <div className="space-y-1">
          {groupByDatabase(conversations).map((group) => (
            // Native disclosure: collapses with no state of its own. Open by default.
            <details key={group.id} open className="group/db">
              <summary
                title={group.label}
                className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-on-surface transition-colors hover:bg-accent/60 pointer-coarse:min-h-10 [&::-webkit-details-marker]:hidden"
              >
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
                {group.conversations.map((conversation) => {
                  const untitled = isPlaceholderTitle(conversation.title);
                  const runtimeMissing = !conversation.runtime.isAvailableForChat;
                  return (
                    <div
                      key={conversation.id}
                      className={`group flex items-center rounded-md ${
                        activeConversationId === conversation.id ? "bg-accent" : "hover:bg-accent/60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onConversationClick(conversation.id);
                          closeSidebar();
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pl-2 pr-1 text-left pointer-coarse:min-h-11"
                      >
                        {/* Reads in its own direction but starts on the left edge like every other title. */}
                        <span
                          className={`min-w-0 flex-1 truncate text-left text-[13px] [unicode-bidi:plaintext] ${
                            untitled ? "text-on-surface-variant" : "font-medium text-on-surface"
                          }`}
                        >
                          {untitled ? "New chat" : conversation.title}
                        </span>
                        {runtimeMissing ? (
                          <AlertTriangle
                            size={12}
                            className="shrink-0 text-secondary"
                            aria-label={conversation.runtime.warning ?? "Model unavailable"}
                          >
                            <title>{conversation.runtime.warning ?? "Model unavailable"}</title>
                          </AlertTriangle>
                        ) : null}
                        <time
                          dateTime={conversation.lastMessageAt ?? undefined}
                          className={`shrink-0 text-[11px] tabular-nums text-on-surface-variant [@media(hover:hover)]:group-hover:hidden [@media(hover:hover)]:group-focus-within:hidden`}
                        >
                          {formatRelativeTime(conversation.lastMessageAt)}
                        </time>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${untitled ? "this chat" : conversation.title}`}
                        title="Delete chat"
                        disabled={deletingConversationId === conversation.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        className={`mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-secondary-container hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:h-11 pointer-coarse:w-10 [@media(hover:hover)]:hidden [@media(hover:hover)]:group-hover:flex [@media(hover:hover)]:group-focus-within:flex`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}

          {!conversations?.length ? (
            <p className="px-2 py-3 text-[13px] text-on-surface-variant">No conversations yet.</p>
          ) : null}
        </div>
      </div>

      {user ? (
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              aria-label="Open profile"
              title="Profile and usage"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-accent/60"
            >
              {user.image ? (
                // GitHub/Google avatar hosts are whitelisted in next.config images.
                <Image
                  src={user.image}
                  alt=""
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
            </button>
            <button
              type="button"
              onClick={onLogout}
              disabled={isSigningOut}
              aria-label={isSigningOut ? "Signing out" : "Log out"}
              title="Log out"
              className="flex shrink-0 items-center justify-center rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-accent/60 hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <LogOut size={14} />
            </button>
          </div>

          <ProfileDialog
            open={isProfileOpen}
            user={user}
            initials={getInitials(user.name, user.email)}
            onClose={() => setIsProfileOpen(false)}
            onLogout={onLogout}
            onDeleteAccount={onDeleteAccount}
          />
        </div>
      ) : null}
    </aside>
  );
}

/** Titles nobody chose: the client's "New chat" and the backend's fallbacks. */
function isPlaceholderTitle(title: string) {
  const trimmed = title.trim();
  return trimmed === "" || trimmed === "New chat" || trimmed.startsWith("New chat · ") || /^\d{4}-\d{2}-\d{2}T/.test(trimmed);
}

const weekday = new Intl.DateTimeFormat("en", { weekday: "short" });
const monthDay = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const monthDayYear = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

/** "now", "4 min", "3 h", "Yesterday", "Mon", "Nov 16": short enough never to be cut. */
export function formatRelativeTime(iso: string | null, now = Date.now()): string {
  if (!iso) return "";
  const then = new Date(iso);
  const minutes = Math.floor((now - then.getTime()) / 60_000);
  if (Number.isNaN(minutes)) return "";
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes} min`;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (then >= startOfToday) return `${Math.floor(minutes / 60)} h`;
  const days = Math.ceil((startOfToday.getTime() - then.getTime()) / 86_400_000);
  if (days <= 1) return "Yesterday";
  if (days < 7) return weekday.format(then);
  return then.getFullYear() === new Date(now).getFullYear() ? monthDay.format(then) : monthDayYear.format(then);
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
