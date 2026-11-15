"use client";

import { useCallback, useEffect, useRef } from "react";

const STORAGE_PREFIX = "kakaw:draft:";

function readText(chatKey: string): string {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + chatKey);
    if (!raw) return "";
    return (JSON.parse(raw) as { text?: string }).text ?? "";
  } catch {
    return "";
  }
}

/**
 * Persists the unsent composer text per chat in localStorage.
 * chatKey: conversationId, or "new" for the new-chat screen.
 * setDraft is debounced (300ms); clearDraft cancels any pending write.
 */
export function useDraftCache(chatKey: string) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readDraftText = useCallback(() => readText(chatKey), [chatKey]);

  const setDraft = useCallback(
    (text: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_PREFIX + chatKey, JSON.stringify({ text }));
        } catch {
          // storage unavailable or full
        }
      }, 300);
    },
    [chatKey],
  );

  const clearDraft = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    try {
      localStorage.removeItem(STORAGE_PREFIX + chatKey);
    } catch {
      // ignore
    }
  }, [chatKey]);

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  return { readDraftText, setDraft, clearDraft };
}
