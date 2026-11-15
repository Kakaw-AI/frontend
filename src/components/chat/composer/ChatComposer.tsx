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
        "flex flex-col rounded-3xl border-2 bg-surface-container-lowest transition-shadow",
        !isEnabled || isComposerLocked
          ? "border-primary/25"
          : "pod-shadow border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-surface",
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
        aria-label="Message"
        className="w-full resize-none border-none bg-transparent px-5 pt-4 pb-2 text-base leading-relaxed placeholder:text-on-surface-variant focus:outline-none focus:ring-0"
        style={{ minHeight: "44px", maxHeight: "200px", overflowY: "auto" }}
        placeholder={placeholder}
      />
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
        <p className="text-xs text-on-surface-variant">
          {isSending || hasStreamingAssistantMessage ? (
            "Responding…"
          ) : isPendingRuntimeUpdate ? (
            "Updating runtime…"
          ) : activeConversation && !isConversationRuntimeAvailable ? (
            "Read-only history"
          ) : (
            <span className="hidden sm:inline">
              <kbd className="rounded-md border border-primary/30 bg-surface-container px-1.5 py-0.5 font-mono text-[11px]">Enter</kbd>
              {" to send · "}
              <kbd className="rounded-md border border-primary/30 bg-surface-container px-1.5 py-0.5 font-mono text-[11px]">⇧ Enter</kbd>
              {" for a new line"}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={toggleThinking}
          aria-pressed={thinkingEnabled}
          title={thinkingEnabled ? "Thinking on (local models)" : "Thinking off (local models)"}
          className={[
            "ml-auto flex items-center gap-1.5 rounded-full border-2 px-3 py-2 text-sm font-bold transition-colors",
            thinkingEnabled
              ? "border-primary/40 text-on-surface"
              : "border-primary/25 bg-surface-container text-on-surface-variant line-through",
          ].join(" ")}
        >
          <Brain size={14} />
          Think
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!isEnabled || !input.trim() || isComposerLocked}
          className="flex items-center gap-1.5 rounded-full border-2 border-primary bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-colors disabled:cursor-not-allowed disabled:border-primary/25 disabled:bg-surface-container disabled:text-on-surface-variant"
        >
          <SendHorizontal size={14} />
          Send
        </button>
      </div>
    </div>
  );
}
