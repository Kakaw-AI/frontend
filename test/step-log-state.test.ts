import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIdleStepMessage,
  shouldCollapseCompletedSteps,
} from "../src/components/chat/step-log-state.ts";

test("completed messages keep steps expanded by default", () => {
  assert.equal(shouldCollapseCompletedSteps("COMPLETED"), false);
  assert.equal(shouldCollapseCompletedSteps("FAILED"), false);
});

test("idle step message uses refined current step copy", () => {
  assert.equal(buildIdleStepMessage(), "Refining current step...");
});
