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
