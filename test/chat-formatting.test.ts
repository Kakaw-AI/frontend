import assert from "node:assert/strict";
import test from "node:test";
import { humanizeDataLabel } from "../src/components/chat/chat-formatting.ts";

test("humanizeDataLabel converts SQL expressions and identifiers into user-facing labels", () => {
  assert.equal(humanizeDataLabel("count(DISTINCT performer_id)"), "Performer Count");
  assert.equal(humanizeDataLabel("alias_count"), "Alias Count");
  assert.equal(humanizeDataLabel("performerCountry"), "Performer Country");
});
