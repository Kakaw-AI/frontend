import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { conversationDetailsQueryKey, conversationsQueryKey } from "@/lib/queries/conversations";

describe("conversation query keys", () => {
  it("refreshing the list leaves a conversation's details alone", async () => {
    // A details refetch mid-stream replaces the live steps with the server copy,
    // which has none until the reply finishes.
    const client = new QueryClient();
    client.setQueryData(conversationsQueryKey, []);
    client.setQueryData(conversationDetailsQueryKey("c1"), { id: "c1" });

    await client.invalidateQueries({ queryKey: conversationsQueryKey });

    expect(client.getQueryState(conversationsQueryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(conversationDetailsQueryKey("c1"))?.isInvalidated).toBe(false);
  });
});
