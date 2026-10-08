import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyDevelopmentContinuations,
  parseDevelopmentRun,
} from "../src/evaluation/development-runs.ts";
import { syntheticDay } from "../src/evaluation/fixtures.ts";
import { questionScore } from "../src/evaluation/records.ts";

function journal() {
  const evaluation = syntheticDay.evaluations[0];
  return [
    {
      type: "setup",
      schemaVersion: 1,
      protocolVersion: "development-v2",
      runId: "synthetic-run",
      startedAt: "2026-10-01T12:00:00Z",
      source: "development",
      provider: "local-vibeproxy",
      chargedUsd: null,
      questions: [evaluation.question],
      models: [evaluation.model],
      requestedSettings: { reasoning_effort: "low" },
      systemPrompts: { private: "excluded-metadata" },
    },
    { type: "generation-request", messages: [{ content: "excluded-request" }] },
    {
      ...structuredClone(evaluation),
      type: "result",
      score: questionScore(evaluation),
      credential: "excluded-secret-field",
    },
    { type: "end", status: "finished", expectedEvaluations: 1, recordedEvaluations: 1 },
  ];
}
const encode = (events: unknown[]) => events.map((event) => JSON.stringify(event)).join("\n");

test("development display preserves normalized answers and excludes arbitrary journal metadata", () => {
  const run = parseDevelopmentRun(encode(journal()), "synthetic-run");
  assert.deepEqual(run.evaluations, [syntheticDay.evaluations[0]]);
  assert.deepEqual(run.questions, [syntheticDay.question]);
  assert.equal(JSON.stringify(run).includes("excluded-"), false);
});

test("continuation projection preserves original journals and validates original evidence", () => {
  const events = journal();
  const pending = {
    ...syntheticDay.evaluations[2],
    model: syntheticDay.evaluations[0].model,
    requestedEffort: "low",
  };
  Object.assign(events[2], pending, { score: null });
  const run = parseDevelopmentRun(encode(events), "synthetic-run");
  const corrected = structuredClone(run.evaluations[0]);
  corrected.outcome = "accepted";
  corrected.checks[0].correction = {
    suggestion: "Kumquat",
    decision: "equivalent",
    evidence: "Synthetic spelling proof",
    verdict: { kind: "accepted", answer: "Kumquat", tier: "rare", score: 60 },
  };
  const overlay = [
    {
      type: "continuation-setup",
      schemaVersion: 1,
      source: "development",
      provider: "local-vibeproxy",
      baseRunIds: [run.id],
    },
    { type: "continuation-result", baseRunId: run.id, evaluation: { ...corrected, score: 60 } },
  ];
  const projected = applyDevelopmentContinuations([run], encode(overlay));
  assert.equal(questionScore(projected[0].evaluations[0]), 60);
  assert.equal(run.evaluations[0].outcome, "needs-correction-review");
  assert.equal(run.evaluations[0].checks[0].correction, undefined);
  assert.throws(() => applyDevelopmentContinuations([run], encode([...overlay, overlay[1]])));
  for (const change of [
    { answer: "Different original" },
    { verdict: { kind: "correction", correction: "Different suggestion" } },
  ]) {
    const changed = structuredClone(overlay);
    Object.assign(changed[1].evaluation!.checks[0], change);
    assert.throws(() => applyDevelopmentContinuations([run], encode(changed)));
  }
});

test("a later substantive correction can be reviewed without replacing earlier evidence", () => {
  const events = journal();
  Object.assign(events[2], syntheticDay.evaluations[2], {
    model: syntheticDay.evaluations[0].model,
    requestedEffort: "low",
    score: null,
  });
  const run = parseDevelopmentRun(encode(events), "synthetic-run");
  const first = structuredClone(run.evaluations[0]);
  first.checks[0].correction = {
    suggestion: "Kumquat",
    decision: "different",
    evidence: "Synthetic distinct entity",
    verdict: { kind: "rejected" },
  };
  first.generations.push({
    ...first.generations[0],
    status: "complete",
    answers: ["orange fruit"],
  });
  first.checks.push({
    answer: "orange fruit",
    verdict: { kind: "correction", correction: "Orange" },
  });
  const second = structuredClone(first);
  second.outcome = "accepted";
  second.checks[1].correction = {
    suggestion: "Orange",
    decision: "equivalent",
    evidence: "Synthetic same fruit",
    verdict: { kind: "accepted", answer: "Orange", tier: "rare", score: 60 },
  };
  const overlay = [
    {
      type: "continuation-setup",
      schemaVersion: 1,
      source: "development",
      provider: "local-vibeproxy",
      baseRunIds: [run.id],
    },
    { type: "continuation-result", baseRunId: run.id, evaluation: { ...first, score: null } },
    { type: "continuation-result", baseRunId: run.id, evaluation: { ...second, score: 60 } },
  ];
  const projected = applyDevelopmentContinuations([run], encode(overlay));
  assert.equal(questionScore(projected[0].evaluations[0]), 60);
  assert.deepEqual(projected[0].evaluations[0].checks[0], first.checks[0]);
  assert.equal(run.evaluations[0].checks.length, 1);
  assert.throws(() => applyDevelopmentContinuations([run], encode([...overlay, overlay[2]])));
  const rewritten = structuredClone(overlay);
  rewritten[2].evaluation!.checks[0].correction!.evidence = "Replaced earlier proof";
  assert.throws(() => applyDevelopmentContinuations([run], encode(rewritten)));
});

test("wrong source, provider, run identity, or incomplete journal cannot enter development results", () => {
  for (const patch of [
    { source: "official" },
    { provider: "openrouter" },
    { runId: "different" },
    { schemaVersion: 2 },
  ]) {
    const events = journal();
    Object.assign(events[0], patch);
    assert.throws(() => parseDevelopmentRun(encode(events), "synthetic-run"), /Invalid saved/);
  }
  const events = journal();
  assert.throws(() => parseDevelopmentRun(encode(events.slice(0, -1)), "synthetic-run"));
  assert.throws(() => parseDevelopmentRun("malformed JSON", "synthetic-run"));
});

test("tampered native scores and mismatched configuration coverage are rejected", () => {
  for (const mutate of [
    (events: ReturnType<typeof journal>) => Object.assign(events[2], { score: 100 }),
    (events: ReturnType<typeof journal>) => Object.assign(events[2], { requestedEffort: "high" }),
    (events: ReturnType<typeof journal>) => Object.assign(events[2], { model: "unknown" }),
    (events: ReturnType<typeof journal>) =>
      Object.assign(events[2], {
        checks: [
          { answer: "A", verdict: { kind: "accepted", tier: "rare", score: 100, answer: "A" } },
        ],
      }),
  ]) {
    const events = journal();
    mutate(events);
    assert.throws(() => parseDevelopmentRun(encode(events), "synthetic-run"));
  }
});

test("correction review remains unscored and preserves the suggestion", () => {
  const events = journal();
  const evaluation = {
    ...syntheticDay.evaluations[2],
    model: syntheticDay.evaluations[0].model,
    requestedEffort: "low",
  };
  Object.assign(events[2], evaluation, { score: null });
  const run = parseDevelopmentRun(encode(events), "synthetic-run");
  assert.equal(questionScore(run.evaluations[0]), null);
  assert.equal(run.evaluations[0].checks[0].verdict.kind, "correction");
});
