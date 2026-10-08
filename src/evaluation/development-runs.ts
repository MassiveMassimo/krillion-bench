import { TIER_POINTS, type Tier, type Verdict } from "../krillion/client.ts";
import { aggregateEvaluations } from "./aggregate.ts";
import {
  effectiveVerdict,
  questionScore,
  type Evaluation,
  type EvaluationCheck,
  type Generation,
  type Question,
} from "./records.ts";

export const developmentRunIds = [
  "e0dfe205-51ad-44c6-8ded-c9db904b4148",
  "04cf25c4-3eb2-42ee-a856-59b9db07598c",
] as const;

function requireValue(condition: unknown): asserts condition {
  if (!condition) throw new Error("Invalid saved development run");
}
function object(value: unknown): Record<string, unknown> {
  requireValue(typeof value === "object" && value !== null && !Array.isArray(value));
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  requireValue(typeof value === "string" && value.trim().length > 0);
  return value;
}
function array(value: unknown): unknown[] {
  requireValue(Array.isArray(value));
  return value;
}
function count(value: unknown): number {
  requireValue(typeof value === "number" && Number.isSafeInteger(value) && value >= 0);
  return value;
}
function parseQuestion(value: unknown): Question {
  const row = object(value);
  const date = text(row.date);
  requireValue(/^\d{4}-\d{2}-\d{2}$/.test(date));
  return { date, promptId: text(row.promptId), text: text(row.text) };
}
function parseVerdict(value: unknown): Verdict {
  const row = object(value);
  if (row.kind === "rejected") return { kind: "rejected" };
  if (row.kind === "correction") return { kind: "correction", correction: text(row.correction) };
  requireValue(
    row.kind === "accepted" && typeof row.tier === "string" && Object.hasOwn(TIER_POINTS, row.tier),
  );
  const tier = row.tier as Tier;
  requireValue(row.score === TIER_POINTS[tier]);
  return { kind: "accepted", answer: text(row.answer), tier, score: TIER_POINTS[tier] };
}
function parseGeneration(value: unknown): Generation {
  const row = object(value);
  const usage = object(row.usage);
  const base = {
    model: row.model === null ? null : text(row.model),
    finishReason: row.finishReason === null ? null : text(row.finishReason),
    elapsedMs: count(row.elapsedMs),
    usage: {
      inputTokens: usage.inputTokens === null ? null : count(usage.inputTokens),
      outputTokens: usage.outputTokens === null ? null : count(usage.outputTokens),
      reasoningTokens: usage.reasoningTokens === null ? null : count(usage.reasoningTokens),
      cachedInputTokens: usage.cachedInputTokens === null ? null : count(usage.cachedInputTokens),
    },
  };
  if (row.status === "incomplete") return { ...base, status: "incomplete" };
  requireValue(row.status === "complete");
  const answers = array(row.answers).map(text);
  requireValue(answers.length > 0 && answers.length <= 5);
  return { ...base, status: "complete", answers };
}
function parseEvaluation(row: Record<string, unknown>): Evaluation {
  requireValue(row.mode === "sequential" || row.mode === "ordered");
  requireValue(
    row.requestedEffort === "low" ||
      row.requestedEffort === "medium" ||
      row.requestedEffort === "high",
  );
  requireValue(row.effectiveEffort === null);
  requireValue(
    ["accepted", "miss", "needs-correction-review", "incomplete"].includes(text(row.outcome)),
  );
  const checks = array(row.checks).map((value) => {
    const check = object(value);
    const parsed: EvaluationCheck = {
      answer: text(check.answer),
      verdict: parseVerdict(check.verdict),
    };
    if (check.correction !== undefined) {
      const correction = object(check.correction);
      requireValue(
        parsed.verdict.kind === "correction" &&
          correction.suggestion === parsed.verdict.correction &&
          (correction.decision === "equivalent" || correction.decision === "different"),
      );
      parsed.correction = {
        suggestion: text(correction.suggestion),
        decision: correction.decision,
        evidence: text(correction.evidence),
      };
      if (correction.verdict !== undefined)
        parsed.correction.verdict = parseVerdict(correction.verdict);
      if (correction.decision === "different")
        requireValue(parsed.correction.verdict?.kind === "rejected");
    }
    return parsed;
  });
  requireValue(
    checks.length <= 5 &&
      checks.slice(0, -1).every((check) => effectiveVerdict(check).kind === "rejected"),
  );
  const result: Evaluation = {
    question: parseQuestion(row.question),
    model: text(row.model),
    mode: row.mode,
    requestedEffort: row.requestedEffort,
    effectiveEffort: null,
    outcome: row.outcome as Evaluation["outcome"],
    generations: array(row.generations).map(parseGeneration),
    checks,
  };
  if (row.failure !== undefined) {
    const failure = object(row.failure);
    requireValue(failure.stage === "generation" || failure.stage === "submission");
    result.failure = { stage: failure.stage, reason: text(failure.reason) };
    if (failure.status !== undefined) result.failure.status = count(failure.status);
  }
  if (result.outcome === "needs-correction-review")
    requireValue(checks.length > 0 && effectiveVerdict(checks.at(-1)!).kind === "correction");
  if (result.outcome === "accepted")
    requireValue(checks.length > 0 && effectiveVerdict(checks.at(-1)!).kind === "accepted");
  requireValue(questionScore(result) === row.score);
  return result;
}

// Whitelist display fields. Request messages, prompts, and arbitrary metadata are discarded.
export function parseDevelopmentRun(contents: string, expectedId: string) {
  const events = contents
    .trim()
    .split("\n")
    .map((line) => object(JSON.parse(line)));
  const setup = events[0];
  const end = events.at(-1);
  requireValue(
    setup?.type === "setup" &&
      setup.schemaVersion === 1 &&
      setup.protocolVersion === "development-v2",
  );
  requireValue(
    setup.runId === expectedId &&
      setup.source === "development" &&
      setup.provider === "local-vibeproxy",
  );
  requireValue(setup.chargedUsd === null);
  const startedAt = text(setup.startedAt);
  requireValue(Number.isFinite(Date.parse(startedAt)));
  const questions = array(setup.questions).map(parseQuestion);
  const models = array(setup.models).map(text);
  const modelSet = new Set(models);
  const settings = object(setup.requestedSettings);
  const evaluations = events.filter((event) => event.type === "result").map(parseEvaluation);
  const expected = questions.length * models.length;
  requireValue(expected > 0 && modelSet.size === models.length);
  requireValue(
    end?.type === "end" &&
      end.status === "finished" &&
      end.expectedEvaluations === expected &&
      end.recordedEvaluations === expected &&
      evaluations.length === expected,
  );
  requireValue(
    evaluations.every(
      (evaluation) =>
        modelSet.has(evaluation.model) &&
        evaluation.mode === "sequential" &&
        evaluation.requestedEffort === settings.reasoning_effort,
    ),
  );
  const summaries = aggregateEvaluations(evaluations, questions);
  requireValue(
    summaries.length === models.length &&
      summaries.every((row) => row.recorded === questions.length),
  );
  return { id: expectedId, startedAt, questions, evaluations };
}

export type DevelopmentRun = ReturnType<typeof parseDevelopmentRun>;
export const continuationFilename = "correction-continuation.jsonl";

export function applyDevelopmentContinuations(runs: DevelopmentRun[], contents: string) {
  const events = contents
    .trim()
    .split("\n")
    .map((line) => object(JSON.parse(line)));
  const setup = events[0];
  requireValue(
    setup?.type === "continuation-setup" &&
      setup.schemaVersion === 1 &&
      setup.source === "development" &&
      setup.provider === "local-vibeproxy" &&
      JSON.stringify(setup.baseRunIds) === JSON.stringify(runs.map((run) => run.id)),
  );
  const projected = structuredClone(runs);
  const runById = new Map(projected.map((run) => [run.id, run]));
  const seen = new Set<string>();
  // Completed result events remain useful even if a later request did not finish.
  for (const event of events.filter((row) => row.type === "continuation-result")) {
    const run = runById.get(event.baseRunId as string);
    requireValue(run);
    const evaluation = parseEvaluation(object(event.evaluation));
    const index = run.evaluations.findIndex(
      (row) =>
        row.model === evaluation.model &&
        row.requestedEffort === evaluation.requestedEffort &&
        row.mode === evaluation.mode &&
        JSON.stringify(row.question) === JSON.stringify(evaluation.question),
    );
    requireValue(index >= 0);
    const original = run.evaluations[index];
    const identity = JSON.stringify([
      run.id,
      evaluation.model,
      evaluation.requestedEffort,
      evaluation.question.promptId,
      original.checks.length,
    ]);
    requireValue(
      !seen.has(identity) &&
        original.outcome === "needs-correction-review" &&
        !original.checks.at(-1)?.correction,
    );
    seen.add(identity);
    requireValue(
      evaluation.checks.length >= original.checks.length &&
        evaluation.generations.length >= original.generations.length &&
        JSON.stringify(evaluation.generations.slice(0, original.generations.length)) ===
          JSON.stringify(original.generations),
    );
    for (let i = 0; i < original.checks.length; i++) {
      const previous = original.checks[i];
      const next = evaluation.checks[i];
      requireValue(
        next.answer === previous.answer &&
          JSON.stringify(next.verdict) === JSON.stringify(previous.verdict),
      );
      if (i < original.checks.length - 1)
        requireValue(JSON.stringify(next) === JSON.stringify(previous));
      else requireValue(next.correction);
    }
    run.evaluations[index] = evaluation;
  }
  return projected;
}
