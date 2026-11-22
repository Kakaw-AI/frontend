/** A finished answer folds its steps into one line; a failed one keeps them open to show where it stopped. */
export function shouldCollapseCompletedSteps(status: string) {
  return status === "COMPLETED";
}

export function buildIdleStepMessage() {
  return "Refining current step...";
}
