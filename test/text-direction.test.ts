import { describe, expect, it } from "vitest";
import { textDirection } from "@/components/chat/chat-formatting";

describe("textDirection", () => {
  it("keeps an Arabic answer full of English names RTL", () => {
    expect(textDirection("- **Amber Bloom**: الأقل بـ **BMI 17.9** (وزن 50 كجم، طول 167 سم)")).toBe("rtl");
  });
  it("keeps English LTR", () => {
    expect(textDirection("The lowest BMI is Amber Bloom (17.9), قياسات aside.")).toBe("ltr");
    expect(textDirection("34 rows")).toBe("ltr");
  });
});
