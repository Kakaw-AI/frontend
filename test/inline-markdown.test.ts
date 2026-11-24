import { describe, expect, it } from "vitest";
import { parseInlineMarkdown } from "@/components/chat/chat-formatting";

const types = (s: string) => parseInlineMarkdown(s).map((t) => `${t.type}:${t.text}`);

describe("parseInlineMarkdown", () => {
  it("renders italics around quoted titles", () => {
    expect(types('include *"Celtic Iron"*, and *"Best Job"* [15].')).toEqual([
      "text:include ",
      'em:"Celtic Iron"',
      "text:, and ",
      'em:"Best Job"',
      "text: [15].",
    ]);
  });

  it("keeps bold, code and links", () => {
    expect(types("**Total:** `SUM(x)` see [docs](https://example.com/a)")).toEqual([
      "strong:Total:",
      "text: ",
      "code:SUM(x)",
      "text: see ",
      "link:docs",
    ]);
    expect(parseInlineMarkdown("[a](https://x.io)")[0]).toMatchObject({ href: "https://x.io" });
  });

  it("leaves arithmetic and stray asterisks alone", () => {
    expect(types("5 * 3 = 15")).toEqual(["text:5 * 3 = 15"]);
    expect(types("a * b * c")).toEqual(["text:a * b * c"]);
  });

  it("does not turn javascript: links into anchors", () => {
    expect(types("[x](javascript:alert(1))")).toEqual(["text:[x](javascript:alert(1))"]);
  });
});
