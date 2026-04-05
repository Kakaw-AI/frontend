"use client";

import { SendHorizontal } from "lucide-react";
import { useRef } from "react";
import type { ConversationDetails } from "@/lib/queries/conversations";
import { useChatStore } from "../store/useChatStore";

export function ChatComposer({
  activeConversation,
  isComposerLocked,
  isConversationRuntimeAvailable,
  hasStreamingAssistantMessage,
  isPendingRuntimeUpdate,
  onSendMessage,
}: {
  activeConversation: ConversationDetails | undefined;
  isComposerLocked: boolean;
  isConversationRuntimeAvailable: boolean;
  hasStreamingAssistantMessage: boolean;
  isPendingRuntimeUpdate: boolean;
  onSendMessage: () => void;
}) {
  const input = useChatStore((s) => s.composerInput);
  const setInput = useChatStore((s) => s.setComposerInput);
  const isSending = useChatStore((s) => s.isSending);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div
      className={[
        "flex flex-col rounded-3xl border bg-surface-container-low transition-shadow",
        !activeConversation || isComposerLocked
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
        disabled={!activeConversation || isComposerLocked}
        className="w-full resize-none border-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-relaxed placeholder:text-on-surface/30 focus:ring-0"
        style={{ minHeight: "44px", maxHeight: "200px", overflowY: "auto" }}
        placeholder={
          !activeConversation
            ? "Create a conversation first to start querying the selected database."
            : isConversationRuntimeAvailable
              ? `Ask about ${activeConversation.databaseSource.label} using ${activeConversation.runtime.effectiveModel ?? "the selected runtime"}...`
              : activeConversation.runtime.warning ??
                "This conversation is read-only until its runtime is restored."
        }
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
          disabled={!activeConversation || !input.trim() || isComposerLocked}
          className="flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary shadow-sm shadow-primary/20 disabled:opacity-40"
        >
          <SendHorizontal size={13} />
          Send
        </button>
      </div>
    </div>
  );
}
