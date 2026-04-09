# Ephemeral Chat & Draft Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Defer server-side conversation creation until the first message is sent, and persist unsent composer drafts (including source + LLM selection) in localStorage per chat.

**Architecture:** Add `pendingConversation` to `useChatStore` to hold an on-the-fly chat's runtime selection; a new `useDraftCache` hook reads/writes localStorage keyed by `chatKey` (`conversationId ?? "new"`); `ChatPageClient` orchestrates draft restore on startup, wires draft sync, and creates the conversation atomically on first send; `ChatComposer` gains a `chatKey` prop and enables itself when either a real conversation or pending state exists.

**Tech Stack:** React, Zustand, Next.js App Router, TanStack Query, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/chat/store/useChatStore.ts` | Modify | Add `pendingConversation` state + actions |
| `src/components/chat/hooks/useDraftCache.ts` | Create | localStorage read/write with debounce |
| `src/components/chat/composer/ChatComposer.tsx` | Modify | `chatKey` prop, draft sync effects, enabled condition, pending placeholder |
| `src/components/chat/ChatPageClient.tsx` | Modify | Picker callback, redirect guard, send flow, draft wiring, startup restore |

---

### Task 1: Add `pendingConversation` to `useChatStore`

**Files:**
- Modify: `src/components/chat/store/useChatStore.ts`

- [ ] **Step 1: Replace the file with the updated store**

Replace the entire contents of `src/components/chat/store/useChatStore.ts` with:

```ts
import { create } from "zustand";

export type PendingConversation = {
  databaseSourceId: string;
  llmConnectionId: string;
};

export interface ChatStoreState {
  // Connection picker
  isConnectionPickerOpen: boolean;
  pickerStartsInAddLlmMode: boolean;

  // Auth
  isSigningOut: boolean;

  // Composer
  composerInput: string;
  composerError: string | null;
  isSending: boolean;

  // Ephemeral / on-the-fly chat
  pendingConversation: PendingConversation | null;
}

export interface ChatStoreActions {
  openPicker: () => void;
  openAddLlmPicker: () => void;
  closePicker: () => void;

  beginSignOut: () => void;
  endSignOut: () => void;

  setComposerInput: (input: string) => void;
  setComposerError: (error: string | null) => void;
  setIsSending: (sending: boolean) => void;

  setPendingConversation: (p: PendingConversation | null) => void;
  clearPendingConversation: () => void;
}

export const useChatStore = create<ChatStoreState & ChatStoreActions>((set) => ({
  // Connection picker defaults
  isConnectionPickerOpen: false,
  pickerStartsInAddLlmMode: false,

  // Auth defaults
  isSigningOut: false,

  // Composer defaults
  composerInput: "",
  composerError: null,
  isSending: false,

  // Ephemeral defaults
  pendingConversation: null,

  // Actions
  openPicker: () =>
    set({
      isConnectionPickerOpen: true,
      pickerStartsInAddLlmMode: false,
      composerError: null,
    }),
  openAddLlmPicker: () =>
    set({
      isConnectionPickerOpen: true,
      pickerStartsInAddLlmMode: true,
      composerError: null,
    }),
  closePicker: () =>
    set({
      isConnectionPickerOpen: false,
      pickerStartsInAddLlmMode: false,
    }),

  beginSignOut: () => set({ isSigningOut: true }),
  endSignOut: () => set({ isSigningOut: false }),

  setComposerInput: (input) => set({ composerInput: input }),
  setComposerError: (error) => set({ composerError: error }),
  setIsSending: (sending) => set({ isSending: sending }),

  setPendingConversation: (p) => set({ pendingConversation: p }),
  clearPendingConversation: () => set({ pendingConversation: null }),
}));
```

- [ ] **Step 2: Type-check**

```bash
cd /home/nasr/kakaw/front && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to this file).

- [ ] **Step 3: Commit**

```bash
cd /home/nasr/kakaw/front && git add src/components/chat/store/useChatStore.ts && git commit -m "feat: add pendingConversation to useChatStore"
```

---

### Task 2: Create `useDraftCache` hook

**Files:**
- Create: `src/components/chat/hooks/useDraftCache.ts`

- [ ] **Step 1: Create the directory (if needed)**

```bash
mkdir -p /home/nasr/kakaw/front/src/components/chat/hooks
```

- [ ] **Step 2: Write the hook**

Create `src/components/chat/hooks/useDraftCache.ts`:

```ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PendingConversation } from "@/components/chat/store/useChatStore";

const STORAGE_PREFIX = "kakaw:draft:";

type NewDraftEntry = {
  text: string;
  databaseSourceId: string;
  llmConnectionId: string;
};

type ExistingDraftEntry = {
  text: string;
};

function readEntry(chatKey: string): NewDraftEntry | ExistingDraftEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + chatKey);
    if (!raw) return null;
    return JSON.parse(raw) as NewDraftEntry | ExistingDraftEntry;
  } catch {
    return null;
  }
}

function writeEntry(chatKey: string, entry: NewDraftEntry | ExistingDraftEntry): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + chatKey, JSON.stringify(entry));
  } catch {
    // storage unavailable or full — ignore
  }
}

function deleteEntry(chatKey: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + chatKey);
  } catch {
    // ignore
  }
}

/** Read the full on-the-fly draft entry from localStorage, including runtime selection. */
export function readNewChatDraft(): NewDraftEntry | null {
  const entry = readEntry("new");
  if (!entry || !("databaseSourceId" in entry)) return null;
  return entry as NewDraftEntry;
}

/**
 * useDraftCache — reads and writes an unsent composer draft to localStorage.
 *
 * chatKey: conversationId for existing chats, "new" for the ephemeral on-the-fly chat.
 * pendingConversation: required when chatKey === "new" to persist runtime selection.
 *
 * Returns:
 *   readDraftText() — reads current text from localStorage (call on mount / key change)
 *   setDraft(text)  — debounced (300ms) write to localStorage
 *   clearDraft()    — immediate delete, cancels any pending debounced write
 */
export function useDraftCache(
  chatKey: string,
  pendingConversation?: PendingConversation | null,
): {
  readDraftText: () => string;
  setDraft: (text: string) => void;
  clearDraft: () => void;
} {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref so the debounced closure always sees the latest pendingConversation
  const pendingRef = useRef(pendingConversation);
  useEffect(() => {
    pendingRef.current = pendingConversation;
  }, [pendingConversation]);

  const readDraftText = useCallback((): string => {
    return readEntry(chatKey)?.text ?? "";
  }, [chatKey]);

  const setDraft = useCallback(
    (text: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        if (chatKey === "new") {
          const pending = pendingRef.current;
          if (!pending) return; // no runtime selected — nothing to persist
          writeEntry("new", {
            text,
            databaseSourceId: pending.databaseSourceId,
            llmConnectionId: pending.llmConnectionId,
          });
        } else {
          writeEntry(chatKey, { text });
        }
      }, 300);
    },
    [chatKey],
  );

  const clearDraft = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    deleteEntry(chatKey);
  }, [chatKey]);

  // Cancel pending write on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { readDraftText, setDraft, clearDraft };
}
```

- [ ] **Step 3: Type-check**

```bash
cd /home/nasr/kakaw/front && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
cd /home/nasr/kakaw/front && git add src/components/chat/hooks/useDraftCache.ts && git commit -m "feat: add useDraftCache hook for localStorage draft persistence"
```

---

### Task 3: Update `ChatComposer`

**Files:**
- Modify: `src/components/chat/composer/ChatComposer.tsx`

Changes: add `chatKey` and `pendingLabel` props; add two `useEffect`s for draft sync; enable the composer when `pendingLabel` is present (pending state); update placeholder text.

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/components/chat/composer/ChatComposer.tsx` with:

```tsx
"use client";

import { SendHorizontal } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ConversationDetails } from "@/lib/queries/conversations";
import { useChatStore } from "../store/useChatStore";

export function ChatComposer({
  activeConversation,
  chatKey,
  pendingLabel,
  isComposerLocked,
  isConversationRuntimeAvailable,
  hasStreamingAssistantMessage,
  isPendingRuntimeUpdate,
  onDraftChange,
  onSendMessage,
}: {
  activeConversation: ConversationDetails | undefined;
  /** "new" for on-the-fly chats, conversationId for existing ones */
  chatKey: string;
  /** Resolved placeholder label for the pending (on-the-fly) state, e.g. "MyDB · gpt-4o" */
  pendingLabel: string | null;
  isComposerLocked: boolean;
  isConversationRuntimeAvailable: boolean;
  hasStreamingAssistantMessage: boolean;
  isPendingRuntimeUpdate: boolean;
  /** Called on every input change so the parent can persist the draft */
  onDraftChange: (text: string) => void;
  onSendMessage: () => void;
}) {
  const input = useChatStore((s) => s.composerInput);
  const setInput = useChatStore((s) => s.setComposerInput);
  const isSending = useChatStore((s) => s.isSending);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // On chatKey change: load the draft text from localStorage via the parent
  // (parent calls readDraftText and sets composerInput before rendering, so we
  // just need to resize the textarea to fit restored content)
  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatKey]);

  // On input change: notify parent to persist draft
  useEffect(() => {
    onDraftChange(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  function handleInput(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value);
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function handleSend() {
    onSendMessage();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  // Enabled when a real conversation exists OR when on-the-fly pending state is active
  const isEnabled = Boolean(activeConversation) || Boolean(pendingLabel);

  const placeholder = !isEnabled
    ? "Create a conversation first to start querying the selected database."
    : pendingLabel
      ? `Ask about ${pendingLabel}…`
      : isConversationRuntimeAvailable
        ? `Ask about ${activeConversation!.databaseSource.label} using ${activeConversation!.runtime.effectiveModel ?? "the selected runtime"}...`
        : (activeConversation!.runtime.warning ?? "This conversation is read-only until its runtime is restored.");

  return (
    <div
      className={[
        "flex flex-col rounded-3xl border bg-surface-container-low transition-shadow",
        !isEnabled || isComposerLocked
          ? "border-outline-variant/15"
          : "border-primary/40 shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]",
      ].join(" ")}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={handleInput}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        disabled={!isEnabled || isComposerLocked}
        className="w-full resize-none border-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-relaxed placeholder:text-on-surface/30 focus:ring-0"
        style={{ minHeight: "44px", maxHeight: "200px", overflowY: "auto" }}
        placeholder={placeholder}
      />
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
        <p className="text-[10px] text-on-surface/35">
          {isSending || hasStreamingAssistantMessage ? (
            "Responding…"
          ) : isPendingRuntimeUpdate ? (
            "Updating runtime…"
          ) : activeConversation && !isConversationRuntimeAvailable ? (
            "Read-only history"
          ) : (
            <>
              <kbd className="rounded border border-outline-variant/20 bg-surface-container px-1 py-0.5 font-mono text-[9px]">Enter</kbd>
              {" send · "}
              <kbd className="rounded border border-outline-variant/20 bg-surface-container px-1 py-0.5 font-mono text-[9px]">⇧ Enter</kbd>
              {" newline"}
            </>
          )}
        </p>
        <button
          type="button"
          onClick={handleSend}
          disabled={!isEnabled || !input.trim() || isComposerLocked}
          className="flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary shadow-sm shadow-primary/20 disabled:opacity-40"
        >
          <SendHorizontal size={13} />
          Send
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/nasr/kakaw/front && npx tsc --noEmit 2>&1 | head -30
```

Expected: TypeScript will report errors on `ChatPageClient.tsx` because it doesn't yet pass the new required props. That is expected — Task 4 fixes it.

- [ ] **Step 3: Commit**

```bash
cd /home/nasr/kakaw/front && git add src/components/chat/composer/ChatComposer.tsx && git commit -m "feat: add chatKey, pendingLabel, onDraftChange props to ChatComposer"
```

---

### Task 4: Update `ChatPageClient`

**Files:**
- Modify: `src/components/chat/ChatPageClient.tsx`

Changes: picker callback (set pending instead of create), redirect guard, draft wiring, startup restore, deferred send flow, pass new props to `ChatComposer`.

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/components/chat/ChatPageClient.tsx` with:

```tsx
"use client";

import { authClient } from "@/lib/auth-client";
import { chatOptionsQueryKey, chatOptionsQueryOptions, type ChatOptions } from "@/lib/queries/chat-options";
import {
  conversationDetailsQueryKey,
  conversationDetailsQueryOptions,
  conversationsQueryKey,
  conversationsQueryOptions,
  createConversationMutationOptions,
  streamConversationMessage,
  updateConversationRuntimeMutationOptions,
  type ConversationDetails,
  type ConversationSummary,
} from "@/lib/queries/conversations";
import {
  activateLlmConnectionMutationOptions,
  deactivateLlmConnectionMutationOptions,
  deleteLlmConnectionMutationOptions,
  saveLlmConnectionMutationOptions,
  type SaveLlmConnectionInput,
} from "@/lib/queries/llm-connections";
import { applyStreamEvent, createOptimisticUserMessage } from "@/components/chat/chat-stream-state";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useChatStore } from "./store/useChatStore";
import { useDraftCache, readNewChatDraft } from "./hooks/useDraftCache";
import { ChatSidebar } from "./layout/ChatSidebar";
import { ChatHeader } from "./layout/ChatHeader";
import { MessageList } from "./messages/MessageList";
import { ChatComposer } from "./composer/ChatComposer";
import { ComposerConnectionSelect } from "./composer/ComposerConnectionSelect";
import { ChatConnectionPicker } from "./picker/ChatConnectionPicker";

export function ChatPageClient() {
  const router = useRouter();
  const { conversationId: activeConversationId = null } = useParams<{ conversationId?: string }>();
  const queryClient = useQueryClient();

  const session = authClient.useSession();
  const user = session.data?.user;

  const chatOptionsQuery = useQuery(chatOptionsQueryOptions());
  const conversationsQuery = useQuery(conversationsQueryOptions());
  const activeConversationQuery = useQuery(conversationDetailsQueryOptions(activeConversationId ?? ""));

  const {
    composerInput,
    setComposerInput,
    setComposerError,
    setIsSending,
    beginSignOut,
    endSignOut,
    closePicker,
    pendingConversation,
    setPendingConversation,
    clearPendingConversation,
  } = useChatStore();

  // The localStorage key for the current chat: conversationId or "new" for on-the-fly
  const chatKey = activeConversationId ?? "new";

  const { readDraftText, setDraft, clearDraft } = useDraftCache(chatKey, pendingConversation);

  // On startup: restore on-the-fly state from localStorage if present
  useEffect(() => {
    if (!pendingConversation) {
      const saved = readNewChatDraft();
      if (saved) {
        setPendingConversation({
          databaseSourceId: saved.databaseSourceId,
          llmConnectionId: saved.llmConnectionId,
        });
      }
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On chatKey change: restore draft text into composer
  useEffect(() => {
    setComposerInput(readDraftText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatKey]);

  const createConversationMutation = useMutation({
    ...createConversationMutationOptions(),
    onSuccess(conversation) {
      queryClient.setQueryData<ConversationSummary[] | undefined>(
        conversationsQueryKey,
        (current) => [conversation, ...(current ?? [])],
      );
    },
  });

  const createLlmConnectionMutation = useMutation({
    ...saveLlmConnectionMutationOptions(),
    onSuccess(connection) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) => current ? { ...current, llmConnections: [connection, ...current.llmConnections] } : current,
      );
    },
  });

  const activateLlmConnectionMutation = useMutation({
    ...activateLlmConnectionMutationOptions(),
    onSuccess(connection) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) => current ? { ...current, llmConnections: current.llmConnections.map((item) => item.id === connection.id ? connection : item) } : current,
      );
    },
  });

  const deactivateLlmConnectionMutation = useMutation({
    ...deactivateLlmConnectionMutationOptions(),
    onSuccess(connection) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) => current ? { ...current, llmConnections: current.llmConnections.map((item) => item.id === connection.id ? connection : item) } : current,
      );
    },
  });

  const deleteLlmConnectionMutation = useMutation({
    ...deleteLlmConnectionMutationOptions(),
    onSuccess(result) {
      queryClient.setQueryData<ChatOptions | undefined>(
        chatOptionsQueryKey,
        (current) => current ? { ...current, llmConnections: current.llmConnections.filter((item) => item.id !== result.id) } : current,
      );
    },
  });

  const updateConversationRuntimeMutation = useMutation(updateConversationRuntimeMutationOptions());

  // Redirect /chat → first existing conversation, but only when there is no pending on-the-fly state
  useEffect(() => {
    if (!activeConversationId && !pendingConversation && conversationsQuery.data?.length) {
      router.replace("/chat/" + conversationsQuery.data[0].id);
    }
  }, [activeConversationId, pendingConversation, conversationsQuery.data, router]);

  const activeConversation = activeConversationQuery.data;
  const hasStreamingAssistantMessage = Boolean(
    activeConversation?.messages.some((message) => message.role === "assistant" && message.status === "STREAMING"),
  );
  const isConversationRuntimeAvailable = activeConversation?.runtime.isAvailableForChat ?? false;
  const runtimeWarning = activeConversation && !isConversationRuntimeAvailable ? activeConversation.runtime.warning : null;
  const isPendingRuntimeUpdate = updateConversationRuntimeMutation.isPending;
  const isSending = useChatStore((s) => s.isSending);
  const composerError = useChatStore((s) => s.composerError);

  const isComposerLocked = isSending || isPendingRuntimeUpdate || hasStreamingAssistantMessage || Boolean(activeConversation && !isConversationRuntimeAvailable);
  const visibleComposerError = runtimeWarning ?? composerError;

  const selectedSource = useMemo(() => activeConversation?.databaseSource ?? null, [activeConversation]);
  const selectedLlmConnection = useMemo(() => activeConversation?.llmConnection ?? null, [activeConversation]);

  // Resolve a human-readable label for the pending on-the-fly state
  const pendingLabel = useMemo(() => {
    if (!pendingConversation || !chatOptionsQuery.data) return null;
    const src = chatOptionsQuery.data.databaseSources.find(
      (s) => s.id === pendingConversation.databaseSourceId,
    );
    const llm = chatOptionsQuery.data.llmConnections.find(
      (c) => c.id === pendingConversation.llmConnectionId,
    );
    if (!src || !llm) return null;
    return `${src.label} · ${llm.model ?? "selected model"}`;
  }, [pendingConversation, chatOptionsQuery.data]);

  useEffect(() => {
    if (activeConversation?.runtime.isAvailableForChat) {
      setComposerError(null);
    }
  }, [activeConversation?.id, activeConversation?.runtime.isAvailableForChat, setComposerError]);

  async function invalidateConversationCaches(conversationId?: string | null) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: chatOptionsQueryKey }),
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
      ...(conversationId ? [queryClient.invalidateQueries({ queryKey: conversationDetailsQueryKey(conversationId) })] : []),
    ]);
  }

  async function handleLogout() {
    if (useChatStore.getState().isSigningOut) return;
    beginSignOut();
    try {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      endSignOut();
    }
  }

  async function handleSwitchConversationConnection(llmConnectionId: string | null) {
    if (!activeConversation || !llmConnectionId) return;

    setComposerError(null);
    const updatedConversation = await updateConversationRuntimeMutation.mutateAsync({
      conversationId: activeConversation.id,
      input: {
        llmConnectionId,
        llmModelOverride: activeConversation.llmModelOverride,
      },
    });

    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversation.id),
      updatedConversation,
    );
    await queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
  }

  function handleSuggestionClick(text: string) {
    setComposerInput(text);
  }

  async function handleSendMessage() {
    const content = composerInput.trim();
    if (!content || isComposerLocked) return;

    // ── On-the-fly path: create conversation first, then send ──────────────
    if (!activeConversationId && pendingConversation) {
      if (!pendingConversation.databaseSourceId) {
        setComposerError("No database source selected.");
        return;
      }

      setComposerError(null);
      setIsSending(true);
      setComposerInput("");

      let newConversationId: string;
      try {
        const conversation = await createConversationMutation.mutateAsync({
          databaseSourceId: pendingConversation.databaseSourceId,
          llmConnectionId: pendingConversation.llmConnectionId,
          title: "New chat",
        });
        newConversationId = conversation.id;
        clearPendingConversation();
        clearDraft(); // remove kakaw:draft:new
        // Navigate to the real conversation URL
        router.push("/chat/" + newConversationId);
      } catch (error) {
        setComposerError(error instanceof Error ? error.message : "Unable to create conversation.");
        setIsSending(false);
        // Restore the input so the user doesn't lose their message
        setComposerInput(content);
        return;
      }

      // Stream the first message on the newly created conversation
      queryClient.setQueryData<ConversationDetails | undefined>(
        conversationDetailsQueryKey(newConversationId),
        (current) => current ? { ...current, messages: [...current.messages, createOptimisticUserMessage(content)] } : current,
      );

      try {
        await streamConversationMessage(newConversationId, content, (event) => {
          queryClient.setQueryData<ConversationDetails | undefined>(
            conversationDetailsQueryKey(newConversationId),
            (current) => applyStreamEvent(current, event),
          );
        });
      } catch (error) {
        setComposerError(error instanceof Error ? error.message : "Unable to stream chat response.");
      } finally {
        setIsSending(false);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: conversationDetailsQueryKey(newConversationId) }),
          queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
        ]);
      }
      return;
    }

    // ── Existing conversation path ─────────────────────────────────────────
    if (!activeConversationId || isComposerLocked) {
      if (activeConversation && !isConversationRuntimeAvailable) {
        setComposerError(activeConversation.runtime.warning ?? "This conversation is read-only until its runtime is restored.");
      }
      return;
    }

    if (!selectedSource?.canStartChat) {
      setComposerError("The selected database is still indexing with the agent runtime.");
      return;
    }

    if (!isConversationRuntimeAvailable) {
      setComposerError(runtimeWarning ?? "This conversation is read-only until its runtime is restored.");
      return;
    }

    setComposerError(null);
    setIsSending(true);
    setComposerInput("");

    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversationId),
      (current) => current ? { ...current, messages: current.messages.map((msg) => ({ ...msg, suggestions: [] })) } : current,
    );

    queryClient.setQueryData<ConversationDetails | undefined>(
      conversationDetailsQueryKey(activeConversationId),
      (current) => current ? { ...current, messages: [...current.messages, createOptimisticUserMessage(content)] } : current,
    );

    try {
      await streamConversationMessage(activeConversationId, content, (event) => {
        queryClient.setQueryData<ConversationDetails | undefined>(
          conversationDetailsQueryKey(activeConversationId),
          (current) => applyStreamEvent(current, event),
        );
      });
      clearDraft(); // clear saved draft for this conversation after successful send
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : "Unable to stream chat response.");
    } finally {
      setIsSending(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationDetailsQueryKey(activeConversationId) }),
        queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
      ]);
    }
  }

  const readyConnections = chatOptionsQuery.data?.llmConnections.filter((c) => c.canStartChat) ?? [];

  return (
    <>
      <ChatConnectionPicker
        key={`${useChatStore((s) => s.isConnectionPickerOpen ? "open" : "closed")}:${useChatStore((s) => s.pickerStartsInAddLlmMode ? "add" : "pick")}:${activeConversationId ?? "none"}`}
        databaseSources={chatOptionsQuery.data?.databaseSources}
        llmConnections={chatOptionsQuery.data?.llmConnections}
        isLoading={chatOptionsQuery.isLoading}
        isRefreshing={chatOptionsQuery.isFetching && Boolean(chatOptionsQuery.data)}
        error={chatOptionsQuery.error instanceof Error ? chatOptionsQuery.error : null}
        activeSourceId={selectedSource?.id ?? null}
        activeLlmConnectionId={selectedLlmConnection?.id ?? null}
        isCreatingConversation={false}
        isCreatingLlmConnection={createLlmConnectionMutation.isPending}
        createLlmError={createLlmConnectionMutation.error instanceof Error ? createLlmConnectionMutation.error : null}
        onRetry={() => void chatOptionsQuery.refetch()}
        onCreateLlmConnection={async (input: SaveLlmConnectionInput) => {
          await createLlmConnectionMutation.mutateAsync(input);
          await chatOptionsQuery.refetch();
        }}
        onActivateLlmConnection={async (id) => {
          await activateLlmConnectionMutation.mutateAsync(id);
          await invalidateConversationCaches(activeConversationId);
        }}
        onDeactivateLlmConnection={async (id) => {
          await deactivateLlmConnectionMutation.mutateAsync(id);
          await invalidateConversationCaches(activeConversationId);
        }}
        onDeleteLlmConnection={async (id) => {
          await deleteLlmConnectionMutation.mutateAsync(id);
          await invalidateConversationCaches(activeConversationId);
        }}
        onConfirmSelection={(selection) => {
          // Deferred creation: store the selection, do NOT call the API yet
          setPendingConversation({
            databaseSourceId: selection.source.id,
            llmConnectionId: selection.llmConnection.id,
          });
          closePicker();
          // Navigate to /chat (no ID) so the on-the-fly state is active
          router.push("/chat");
        }}
      />

      <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface">
        <ChatSidebar
          user={user}
          activeConversationId={activeConversationId}
          conversations={conversationsQuery.data}
          onConversationClick={(id) => router.push("/chat/" + id)}
          onLogout={handleLogout}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-surface-container-lowest">
          <ChatHeader activeConversation={activeConversation} />

          <MessageList
            activeConversation={activeConversation}
            isLoading={activeConversationQuery.isLoading}
            isComposerLocked={isComposerLocked}
            onSuggestionClick={handleSuggestionClick}
          />

          <footer className="border-t border-outline-variant/15 px-8 py-4">
            {activeConversation ? (
              <ComposerConnectionSelect
                activeConnectionId={activeConversation.llmConnectionId}
                readyConnections={readyConnections}
                isPending={isPendingRuntimeUpdate}
                visibleComposerError={visibleComposerError}
                onSwitch={handleSwitchConversationConnection}
              />
            ) : null}

            <ChatComposer
              activeConversation={activeConversation}
              chatKey={chatKey}
              pendingLabel={pendingLabel}
              isComposerLocked={isComposerLocked}
              isConversationRuntimeAvailable={isConversationRuntimeAvailable}
              hasStreamingAssistantMessage={hasStreamingAssistantMessage}
              isPendingRuntimeUpdate={isPendingRuntimeUpdate}
              onDraftChange={setDraft}
              onSendMessage={handleSendMessage}
            />
          </footer>
        </main>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/nasr/kakaw/front && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors. If `llm.model` doesn't exist on the `LlmConnection` type, adjust the `pendingLabel` expression to use the correct field name (check `src/lib/queries/llm-connections.ts` for the right property).

- [ ] **Step 3: Verify in browser**

Run `npm run dev`, navigate to `/chat`. Test the following scenarios:

**Scenario A — On-the-fly draft survives refresh:**
1. Click "New Chat", pick a source + LLM, confirm
2. Type a message but do NOT send
3. Refresh the page
4. Expected: composer is pre-filled with your message, and source+LLM are restored

**Scenario B — First send creates the conversation:**
1. Click "New Chat", pick source + LLM, confirm  
2. Type a message, press Enter
3. Expected: conversation appears in sidebar, URL changes to `/chat/:id`, message streams normally

**Scenario C — Existing chat draft persists:**
1. Open an existing conversation
2. Type a partial message, navigate to another conversation, come back
3. Expected: the partial message is still in the composer

**Scenario D — Draft clears after successful send:**
1. Open an existing conversation, type a message, send it
2. Navigate away and back
3. Expected: composer is empty (draft was cleared)

- [ ] **Step 4: Commit**

```bash
cd /home/nasr/kakaw/front && git add src/components/chat/ChatPageClient.tsx && git commit -m "feat: defer conversation creation until first message, add draft restore on startup"
```
