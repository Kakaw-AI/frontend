import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "../src/components/chat/layout/ChatSidebar";

describe("formatRelativeTime", () => {
  // Local noon, so "today" and "yesterday" hold in any time zone.
  const now = new Date(2026, 10, 22, 12, 0).getTime();
  const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

  it("is short enough for a sidebar row", () => {
    expect(formatRelativeTime(ago(0), now)).toBe("now");
    expect(formatRelativeTime(ago(4), now)).toBe("4 min");
    expect(formatRelativeTime(ago(180), now)).toBe("3 h");
    expect(formatRelativeTime(ago(13 * 60), now)).toBe("Yesterday");
    expect(formatRelativeTime(new Date(2026, 10, 19, 9, 0).toISOString(), now)).toBe("Thu");
    expect(formatRelativeTime(new Date(2026, 10, 2, 9, 0).toISOString(), now)).toBe("Nov 2");
    expect(formatRelativeTime(new Date(2025, 10, 2, 9, 0).toISOString(), now)).toBe("Nov 2, 2025");
  });

  it("is empty without a time", () => {
    expect(formatRelativeTime(null, now)).toBe("");
  });
});
