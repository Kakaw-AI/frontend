import { describe, expect, it } from "vitest";
import {
  applyRetryReset,
  applyStreamEvent,
} from "@/components/chat/chat-stream-state";
import type {
  ConversationDetails,
  ConversationMessage,
} from "@/lib/queries/conversations";

function message(overrides: Partial<ConversationMessage>): ConversationMessage {
  return {
    id: "m",
    role: "assistant",
    status: "COMPLETED",
    content: "",
    error: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    artifacts: [],
    tokenUsage: null,
    suggestions: [],
    ...overrides,
  };
}

function conversation(messages: ConversationMessage[]): ConversationDetails {
  return { id: "c1", messages } as unknown as ConversationDetails;
}

describe("applyStreamEvent", () => {
  it("adds a streaming assistant message once, even if the start event repeats", () => {
    const started = { type: "message_started", data: { messageId: "a1" } };
    const once = applyStreamEvent(conversation([]), started);
    const twice = applyStreamEvent(once, started);

    expect(twice?.messages).toHaveLength(1);
    expect(twice?.messages[0]).toMatchObject({ id: "a1", status: "STREAMING" });
  });

  it("appends deltas to the message that is streaming", () => {
    let state = applyStreamEvent(conversation([]), {
      type: "message_started",
      data: { messageId: "a1" },
    });
    state = applyStreamEvent(state, { type: "message_delta", data: { delta: "Hello" } });
    state = applyStreamEvent(state, { type: "message_delta", data: { delta: " world" } });

    expect(state?.messages[0].content).toBe("Hello world");
  });

  it("marks earlier steps done as new ones arrive, and all of them on completion", () => {
    let state = applyStreamEvent(conversation([]), {
      type: "message_started",
      data: { messageId: "a1" },
    });
    state = applyStreamEvent(state, { type: "agent_step", data: { text: "Reading schema" } });
    state = applyStreamEvent(state, { type: "agent_step", data: { text: "Writing SQL" } });

    expect(state?.messages[0].steps?.map((step) => step.done)).toEqual([true, false]);

    state = applyStreamEvent(state, {
      type: "message_completed",
      data: { messageId: "a1", content: "Done." },
    });

    expect(state?.messages[0]).toMatchObject({ status: "COMPLETED", content: "Done." });
    expect(state?.messages[0].steps?.every((step) => step.done)).toBe(true);
  });

  it("fails the message named by the event, not just the latest one", () => {
    const state = applyStreamEvent(
      conversation([
        message({ id: "old", status: "STREAMING" }),
        message({ id: "new", status: "COMPLETED", content: "fine" }),
      ]),
      {
        type: "message_failed",
        data: {
          messageId: "old",
          errorInfo: { message: "Too many requests.", retryable: true },
        },
      },
    );

    expect(state?.messages[0]).toMatchObject({
      status: "FAILED",
      error: "Too many requests.",
      errorRetryable: true,
    });
    expect(state?.messages[1]).toMatchObject({ status: "COMPLETED", content: "fine" });
  });

  it("ignores events when there is nothing to apply them to", () => {
    const empty = conversation([]);

    expect(applyStreamEvent(undefined, { type: "message_delta" })).toBeUndefined();
    expect(applyStreamEvent(empty, { type: "message_delta", data: { delta: "x" } })).toBe(empty);
    expect(applyStreamEvent(empty, { type: "unknown" })).toBe(empty);
  });
});

describe("applyRetryReset", () => {
  it("reuses the failed bubble as a fresh streaming message", () => {
    const state = applyRetryReset(
      conversation([
        message({
          id: "a1",
          status: "FAILED",
          content: "partial",
          error: "boom",
          suggestions: ["again?"],
        }),
      ]),
      "a1",
    );

    expect(state?.messages[0]).toMatchObject({
      id: "a1",
      status: "STREAMING",
      content: "",
      error: null,
      suggestions: [],
    });
  });
});

describe("re-attaching to a running reply", () => {
  it("rebuilds the message from the replayed log without doubling steps or text", () => {
    const halfShown = conversation([
      message({ id: "a1", status: "STREAMING", content: "Hel", steps: [{ seq: 0, text: "Reading schema", done: false }] }),
    ]);
    const log = [
      { type: "message_started", data: { messageId: "a1" } },
      { type: "agent_step", data: { text: "Reading schema" } },
      { type: "agent_step", data: { text: "Writing SQL" } },
      { type: "message_delta", data: { delta: "Hel" } },
      { type: "message_delta", data: { delta: "lo" } },
    ];

    const rebuilt = log.reduce(
      (current, event) => applyStreamEvent(current, event),
      applyRetryReset(halfShown, "a1"),
    );

    expect(rebuilt?.messages[0]).toMatchObject({
      status: "STREAMING",
      content: "Hello",
      steps: [
        { seq: 0, text: "Reading schema", done: true },
        { seq: 1, text: "Writing SQL", done: false },
      ],
    });
  });
});
