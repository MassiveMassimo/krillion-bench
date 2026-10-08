import { TIER_POINTS, type Tier, type Verdict } from "../krillion/client.ts";
import type { Effort, Evaluation, Generation } from "./records.ts";

const question = { date: "2026-10-01", promptId: "example-fruit", text: "Name a fruit" };
function generation(model: string, answer: string): Generation {
  return {
    status: "complete",
    model,
    finishReason: "stop",
    answers: [answer],
    elapsedMs: 0,
    usage: {
      inputTokens: null,
      outputTokens: null,
      reasoningTokens: null,
      cachedInputTokens: null,
    },
  };
}
function rejected(answers: string[]): Evaluation["checks"] {
  return answers.map((answer) => ({ answer, verdict: { kind: "rejected" } }));
}
function accepted(answer: string, tier: Tier): { answer: string; verdict: Verdict } {
  return { answer, verdict: { kind: "accepted", answer, tier, score: TIER_POINTS[tier] } };
}
function record(
  model: string,
  requestedEffort: Effort,
  outcome: Evaluation["outcome"],
  checks: Evaluation["checks"],
): Evaluation {
  return {
    question: { ...question },
    model,
    requestedEffort,
    effectiveEffort: null,
    mode: "sequential",
    outcome,
    checks,
    generations: checks.map((check) => generation(model, check.answer)),
  };
}

// These are invented records. They were not submitted to Krillion or a model.
const interrupted = record("Example model D", "high", "incomplete", []);
interrupted.generations.push(generation(interrupted.model, "Longan"));
interrupted.failure = { stage: "submission", reason: "http", status: 429 };

export const syntheticDay = {
  source: "synthetic" as const,
  question,
  costUsd: null,
  latencyMs: null,
  evaluations: [
    record("Example model A", "low", "accepted", [accepted("Apple", "plankton")]),
    record("Example model A", "high", "accepted", [
      ...rejected(["Purple", "Circle"]),
      accepted("Gooseberry", "deepcut"),
    ]),
    record("Example model B", "high", "needs-correction-review", [
      { answer: "Kumqat", verdict: { kind: "correction", correction: "Kumquat" } },
    ]),
    record("Example model C", "low", "miss", rejected(["Blue", "Round", "Sweet", "Plant", "Tree"])),
    interrupted,
  ],
};
