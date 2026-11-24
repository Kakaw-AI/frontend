import { describe, expect, it } from "vitest";
import { repeatedChartTableIds } from "@/components/chat/chat-formatting";
import type { ConversationMessage, MessageArtifact } from "@/lib/queries/conversations";

const art = (id: string, type: MessageArtifact["type"], payload: unknown = {}): MessageArtifact => ({ id, type, payload, createdAt: "" });
const msg = (id: string, role: ConversationMessage["role"], artifacts: MessageArtifact[] = []) =>
  ({ id, role, artifacts }) as unknown as ConversationMessage;
const table = (id: string, column: string, values: number[]) =>
  art(id, "TABLE", { columns: ["month", column], rows: values.map((v, i) => ({ month: `2026-0${i + 7}`, [column]: v })) });

describe("repeatedChartTableIds", () => {
  const answer = msg("a1", "assistant", [table("t1", "total_revenue", [19169, 25792, 34634])]);

  it("folds the table of a chart follow-up that repeats the earlier rows", () => {
    const chart = msg("a2", "assistant", [art("c2", "CHART"), table("t2", "revenue", [19169, 25792, 34634])]);
    const map = repeatedChartTableIds([msg("u1", "user"), answer, msg("u2", "user"), chart]);
    expect(map.get("a2")).toBe("t2");
    expect(map.has("a1")).toBe(false);
  });

  it("keeps a chart answer's table open when its rows are new", () => {
    const chart = msg("a2", "assistant", [art("c2", "CHART"), table("t2", "revenue", [1, 2, 3])]);
    expect(repeatedChartTableIds([answer, chart]).size).toBe(0);
  });

  it("keeps the first chart answer open even without an earlier table", () => {
    const chart = msg("a1", "assistant", [art("c1", "CHART"), table("t1", "revenue", [1, 2, 3])]);
    expect(repeatedChartTableIds([chart]).size).toBe(0);
  });
});
