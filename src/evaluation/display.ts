import type { Tier } from "../krillion/client.ts";
import { effectiveVerdict, questionScore, type Evaluation } from "./records.ts";

export const tierLabels: Record<Tier, string> = {
  plankton: "Plankton",
  tooclever: "Too clever",
  schooler: "Schooler",
  rare: "Rare",
  deepcut: "Deep cut",
  krillion: "Krillion",
};

const resultLabels = {
  accepted: "Accepted",
  miss: "Completed miss",
  "needs-correction-review": "Correction review",
  incomplete: "Incomplete",
} as const;

export function displayEvaluation(evaluation: Evaluation) {
  const firstAccepted = evaluation.checks.findIndex(
    (check) => effectiveVerdict(check).kind === "accepted",
  );
  const checks =
    firstAccepted < 0 ? evaluation.checks : evaluation.checks.slice(0, firstAccepted + 1);
  const last = checks.at(-1);
  const lastVerdict = last ? effectiveVerdict(last) : null;
  const points = questionScore(evaluation);
  const generation = evaluation.generations.at(-1);
  const uncheckedAnswers =
    last?.correction?.decision === "equivalent" &&
    !last.correction.verdict &&
    evaluation.failure?.stage === "submission"
      ? [last.correction.suggestion]
      : evaluation.outcome === "incomplete" &&
          evaluation.failure?.stage === "submission" &&
          generation?.status === "complete"
        ? generation.answers.slice(
            evaluation.mode === "ordered" ? checks.length : 0,
            evaluation.mode === "ordered" ? checks.length + 1 : 1,
          )
        : [];
  return {
    model: evaluation.model,
    requestedThinking:
      evaluation.requestedEffort[0].toUpperCase() + evaluation.requestedEffort.slice(1),
    effectiveThinking: "Unverified",
    mode: evaluation.mode,
    outcome: evaluation.outcome,
    resultLabel: resultLabels[evaluation.outcome],
    answer: uncheckedAnswers[0] ?? last?.answer ?? null,
    tier: lastVerdict?.kind === "accepted" ? tierLabels[lastVerdict.tier] : null,
    canonicalAnswer: lastVerdict?.kind === "accepted" ? lastVerdict.answer : null,
    points,
    pointsLabel:
      points !== null
        ? String(points)
        : evaluation.outcome === "needs-correction-review"
          ? "Pending"
          : "Unscored",
    attempts: checks.length,
    history: checks.map((check, index) => {
      const verdict = effectiveVerdict(check);
      return {
        attempt: index + 1,
        answer: check.answer,
        result:
          verdict.kind === "accepted"
            ? `${tierLabels[verdict.tier]} · ${verdict.score} points`
            : verdict.kind === "correction"
              ? "Pending correction review"
              : "Not accepted",
        correction: verdict.kind === "correction" ? verdict.correction : null,
        canonicalAnswer: verdict.kind === "accepted" ? verdict.answer : null,
        correctionReview: check.correction
          ? {
              suggestion: check.correction.suggestion,
              decision: check.correction.decision,
              evidence: check.correction.evidence,
            }
          : null,
      };
    }),
    uncheckedAnswers,
    failureStage: evaluation.failure?.stage ?? null,
  };
}

export type DailyResult = ReturnType<typeof displayEvaluation>;
