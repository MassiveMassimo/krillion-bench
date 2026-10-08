import { questionScore, type Evaluation, type Question } from "./records.ts";

const questionKey = (question: Question) => JSON.stringify([question.date, question.promptId]);

// This is a coverage-safe development summary. The public protocol is not frozen.
export function aggregateEvaluations(evaluations: Evaluation[], questions: Question[]) {
  const expected = new Map(questions.map((question) => [questionKey(question), question.text]));
  if (expected.size === 0 || expected.size !== questions.length)
    throw new Error("Expected questions must be nonempty and unique");
  const groups = new Map<string, Evaluation[]>();
  for (const evaluation of evaluations) {
    if (expected.get(questionKey(evaluation.question)) !== evaluation.question.text)
      throw new Error("Evaluation is outside the shared question set");
    const key = JSON.stringify([evaluation.model, evaluation.requestedEffort, evaluation.mode]);
    const group = groups.get(key) ?? [];
    if (group.some((record) => questionKey(record.question) === questionKey(evaluation.question)))
      throw new Error("Duplicate evaluation for a model configuration and question");
    group.push(evaluation);
    groups.set(key, group);
  }
  const rows = [...groups.values()].map((group) => {
    const scores = group.map(questionScore);
    const scored = scores.filter((score) => score !== null);
    const complete = scored.length === expected.size;
    return {
      model: group[0].model,
      requestedEffort: group[0].requestedEffort,
      mode: group[0].mode,
      expected: expected.size,
      recorded: group.length,
      scored: scored.length,
      accepted: group.filter((record) => record.outcome === "accepted").length,
      pending: group.filter((record) => record.outcome === "needs-correction-review").length,
      incomplete: group.filter((record) => record.outcome === "incomplete").length,
      missing: expected.size - group.length,
      meanPoints: complete ? scored.reduce((sum, score) => sum + score, 0) / expected.size : null,
      rank: null as number | null,
    };
  });
  // No final ranks when any configuration lacks a score on the shared set.
  if (rows.length > 0 && rows.every((row) => row.meanPoints !== null))
    for (const row of rows)
      row.rank = 1 + rows.filter((other) => other.meanPoints! > row.meanPoints!).length;
  return rows;
}
