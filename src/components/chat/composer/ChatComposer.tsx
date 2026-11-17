"use client";

import { Brain, SendHorizontal } from "lucide-react";
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
  const isSending = useChatStore((s) => s.sendingKeys.includes(chatKey));
  const thinkingEnabled = useChatStore((s) => s.thinkingEnabled);
  const toggleThinking = useChatStore((s) => s.toggleThinking);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // On chatKey change: resize textarea to fit restored content
  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
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
        "flex flex-col rounded-xl border bg-surface-container-lowest transition-colors",
        !isEnabled || isComposerLocked
          ? "border-border opacity-80"
          : "border-outline-variant focus-within:border-on-surface-variant",
      ].join(" ")}
    >
      <textarea
        ref={textareaRef}
        dir="auto"
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
        aria-label="Message"
        className="w-full resize-none border-none bg-transparent px-3.5 pt-3 pb-1 text-sm leading-6 placeholder:text-on-surface-variant focus:outline-none focus:ring-0"
        style={{ minHeight: "36px", maxHeight: "200px", overflowY: "auto" }}
        placeholder={placeholder}
      />
      <div className="flex items-center gap-2 px-2.5 pb-2 pt-0.5">
        <button
          type="button"
          onClick={toggleThinking}
          aria-pressed={thinkingEnabled}
          title={thinkingEnabled ? "Thinking on: slower, better on hard questions" : "Thinking off: fastest replies"}
          className={[
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            thinkingEnabled
              ? "bg-accent text-on-surface"
              : "text-on-surface-variant hover:bg-accent/60",
          ].join(" ")}
        >
          <Brain size={13} />
          Think
        </button>
        <p className="min-w-0 truncate text-[11px] text-on-surface-variant">
          {isSending || hasStreamingAssistantMessage ? (
            "Responding…"
          ) : isPendingRuntimeUpdate ? (
            "Updating runtime…"
          ) : activeConversation && !isConversationRuntimeAvailable ? (
            "Read-only history"
          ) : (
            <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
          )}
        </p>
        <button
          type="button"
          onClick={handleSend}
          disabled={!isEnabled || !input.trim() || isComposerLocked}
          aria-label="Send"
          title="Send"
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary transition-colors hover:bg-on-surface-variant disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
        >
          <SendHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
