import assert from "node:assert/strict";
import { test } from "node:test";
import { displayEvaluation } from "../src/evaluation/display.ts";
import { syntheticDay } from "../src/evaluation/fixtures.ts";
import { continueEvaluation } from "../src/evaluation/records.ts";

test("daily rows use saved verdicts and stop at the first accepted attempt", () => {
  const rows = syntheticDay.evaluations.map(displayEvaluation);
  assert.deepEqual(
    rows.map((row) => row.points),
    [10, 85, null, 0, null],
  );
  assert.deepEqual(
    rows.map((row) => row.attempts),
    [1, 3, 1, 5, 0],
  );
  assert.equal(rows[1].answer, "Gooseberry");
  assert.deepEqual(
    rows[1].history.map((entry) => entry.answer),
    ["Purple", "Circle", "Gooseberry"],
  );
  const withLaterAnswer = structuredClone(syntheticDay.evaluations[0]);
  withLaterAnswer.checks.push({
    answer: "Later answer",
    verdict: { kind: "accepted", answer: "Later answer", tier: "krillion", score: 100 },
  });
  const first = displayEvaluation(withLaterAnswer);
  assert.equal(first.points, 10);
  assert.equal(first.answer, "Apple");
  assert.equal(first.attempts, 1);
});

test("verified correction stays in one displayed attempt and exposes its original and canonical wording", async () => {
  const original = syntheticDay.evaluations[2];
  const result = await continueEvaluation({
    evaluation: original,
    systemPrompt: "Synthetic instruction",
    review: {
      answer: "Kumqat",
      suggestion: "Kumquat",
      decision: "equivalent",
      evidence: "Synthetic spelling proof",
    },
    generate: async () => {
      throw new Error("No generation expected");
    },
    submit: async () => ({ kind: "accepted", answer: "Kumquat", tier: "rare", score: 60 }),
  });
  const row = displayEvaluation(result);
  assert.equal(row.points, 60);
  assert.equal(row.attempts, 1);
  assert.equal(row.answer, "Kumqat");
  assert.equal(row.history[0].canonicalAnswer, "Kumquat");
  assert.equal(row.history[0].correction, null);
  assert.equal(row.history[0].correctionReview?.decision, "equivalent");
});

test("canonical transport failure displays the attempted correction without a false score", async () => {
  const result = await continueEvaluation({
    evaluation: syntheticDay.evaluations[2],
    systemPrompt: "Synthetic instruction",
    review: {
      answer: "Kumqat",
      suggestion: "Kumquat",
      decision: "equivalent",
      evidence: "Synthetic spelling proof",
    },
    generate: async () => {
      throw new Error("No generation expected");
    },
    submit: async () => {
      throw new Error("Unknown submission outcome");
    },
  });
  const row = displayEvaluation(result);
  assert.equal(row.points, null);
  assert.equal(row.attempts, 1);
  assert.deepEqual(row.uncheckedAnswers, ["Kumquat"]);
  assert.equal(row.history[0].answer, "Kumqat");
});

test("pending corrections and interrupted submissions never become completed misses", () => {
  const review = displayEvaluation(syntheticDay.evaluations[2]);
  assert.equal(review.pointsLabel, "Pending");
  assert.equal(review.history[0].correction, "Kumquat");
  assert.equal(review.attempts, 1);
  const miss = displayEvaluation(syntheticDay.evaluations[3]);
  assert.equal(miss.pointsLabel, "0");
  assert.equal(miss.resultLabel, "Completed miss");
  const incomplete = displayEvaluation(syntheticDay.evaluations[4]);
  assert.equal(incomplete.pointsLabel, "Unscored");
  assert.equal(incomplete.answer, "Longan");
  assert.deepEqual(incomplete.uncheckedAnswers, ["Longan"]);
  assert.equal(incomplete.failureStage, "submission");
  assert.equal(incomplete.requestedThinking, "High");
  assert.equal(incomplete.effectiveThinking, "Unverified");
});

test("serialized evaluation records reproduce the daily view without changing source data", () => {
  const saved = JSON.parse(
    JSON.stringify(syntheticDay.evaluations),
  ) as typeof syntheticDay.evaluations;
  const before = structuredClone(saved);
  assert.deepEqual(saved.map(displayEvaluation), syntheticDay.evaluations.map(displayEvaluation));
  assert.deepEqual(saved, before);
  assert.equal(syntheticDay.source, "synthetic");
  assert.equal(syntheticDay.costUsd, null);
  assert.equal(syntheticDay.latencyMs, null);
});

test("a failed submission preserves the current unchecked candidate after earlier rejections", () => {
  for (const mode of ["sequential", "ordered"] as const) {
    const incomplete = structuredClone(syntheticDay.evaluations[4]);
    incomplete.mode = mode;
    incomplete.checks = [syntheticDay.evaluations[3].checks[0]];
    if (mode === "ordered") {
      const generation = incomplete.generations[0];
      if (generation.status !== "complete") throw new Error("Expected complete fixture");
      generation.answers = ["Blue", "Longan", "Unused A", "Unused B", "Unused C"];
    } else {
      incomplete.generations.unshift(syntheticDay.evaluations[3].generations[0]);
    }
    const row = displayEvaluation(incomplete);
    assert.equal(row.answer, "Longan");
    assert.deepEqual(row.uncheckedAnswers, ["Longan"]);
    assert.equal(row.attempts, 1);
    assert.equal(row.points, null);
  }
});
