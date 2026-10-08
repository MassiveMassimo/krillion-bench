import { KrillionApiError, type Today, type Verdict } from "../krillion/client.ts";

export type Mode = "sequential" | "ordered";
export type Effort = "low" | "medium" | "high";
export type Message = { role: "system" | "user" | "assistant"; content: string };
export type Usage = {
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  cachedInputTokens: number | null;
};
export type Generation = {
  model: string | null;
  finishReason: string | null;
  usage: Usage;
  elapsedMs: number;
} & ({ status: "complete"; answers: string[] } | { status: "incomplete" });
export type Question = { date: string; promptId: string; text: string };
export type CorrectionReview = {
  answer: string;
  suggestion: string;
  decision: "equivalent" | "different";
  evidence: string;
};
export type EvaluationCheck = {
  answer: string;
  verdict: Verdict;
  correction?: Omit<CorrectionReview, "answer"> & { verdict?: Verdict };
};
export type Evaluation = {
  question: Question;
  model: string;
  mode: Mode;
  requestedEffort: Effort;
  effectiveEffort: null;
  outcome: "accepted" | "miss" | "needs-correction-review" | "incomplete";
  generations: Generation[];
  checks: EvaluationCheck[];
  failure?: { stage: "generation" | "submission"; reason: string; status?: number };
};

export function selectQuestions(today: Today, ids: string[]): Question[] {
  if (ids.length === 0 || new Set(ids).size !== ids.length)
    throw new Error("Invalid question selection");
  return ids.map((id) => {
    const prompt = today.prompts.find((prompt) => prompt.id === id);
    if (!prompt) throw new Error("Unknown question ID");
    return { date: today.date, promptId: prompt.id, text: prompt.text };
  });
}

export function questionScore(result: Evaluation): number | null {
  if (result.outcome === "accepted") {
    const accepted = result.checks
      .map(effectiveVerdict)
      .find((verdict) => verdict.kind === "accepted");
    if (accepted?.kind !== "accepted") throw new Error("Missing accepted verdict");
    return accepted.score;
  }
  if (result.outcome === "miss") {
    if (
      result.checks.length !== 5 ||
      result.checks.some((check) => effectiveVerdict(check).kind !== "rejected")
    )
      throw new Error("Incomplete rejection history");
    return 0;
  }
  return null;
}

export function effectiveVerdict(check: EvaluationCheck): Verdict {
  return check.correction?.verdict ?? check.verdict;
}

type EvaluationIO = {
  generate: (messages: Message[]) => Promise<Generation>;
  submit: (answer: string) => Promise<Verdict>;
};
const rejectionFeedback: Message = {
  role: "user",
  content: "Not accepted. Give a different valid, obscure answer. Return the same JSON format.",
};

function recordFailure(result: Evaluation, stage: "generation" | "submission", error: unknown) {
  result.outcome = "incomplete";
  result.failure = {
    stage,
    reason:
      error instanceof KrillionApiError
        ? error.reason
        : error instanceof Error && error.name === "TimeoutError"
          ? "timeout"
          : "request-failure",
  };
  if (error instanceof KrillionApiError && error.status !== undefined)
    result.failure.status = error.status;
}

async function runRemaining(result: Evaluation, input: EvaluationIO, messages: Message[]) {
  let stage: "generation" | "submission" = "generation";
  try {
    while (result.checks.length < 5) {
      stage = "generation";
      let record = result.mode === "ordered" ? result.generations[0] : undefined;
      let answers: string[];
      if (record?.status === "complete") {
        answers = record.answers.slice(result.checks.length);
      } else {
        record = await input.generate(messages);
        result.generations.push(record);
        if (
          record.status === "incomplete" ||
          record.answers.length !== (result.mode === "sequential" ? 1 : 5)
        )
          return result;
        answers = record.answers;
      }
      for (const answer of answers) {
        stage = "submission";
        const verdict = await input.submit(answer);
        result.checks.push({ answer, verdict });
        if (verdict.kind === "accepted") {
          result.outcome = "accepted";
          return result;
        }
        if (verdict.kind === "correction") {
          result.outcome = "needs-correction-review";
          return result;
        }
      }
      if (result.mode === "ordered") break;
      messages.push(
        { role: "assistant", content: JSON.stringify({ answers: record.answers }) },
        { ...rejectionFeedback },
      );
    }
    result.outcome = "miss";
  } catch (error) {
    recordFailure(result, stage, error);
  }
  return result;
}

export async function continueEvaluation(
  input: EvaluationIO & {
    evaluation: Evaluation;
    systemPrompt: string;
    review: CorrectionReview;
  },
): Promise<Evaluation> {
  const original = input.evaluation;
  const last = original.checks.at(-1);
  if (
    original.outcome !== "needs-correction-review" ||
    original.failure ||
    !last ||
    last.correction ||
    last.verdict.kind !== "correction" ||
    last.answer !== input.review.answer ||
    last.verdict.correction !== input.review.suggestion ||
    !input.review.evidence.trim() ||
    !["equivalent", "different"].includes(input.review.decision) ||
    original.checks.length > 5 ||
    original.checks.slice(0, -1).some((check) => effectiveVerdict(check).kind !== "rejected") ||
    original.generations.some((generation) => generation.status !== "complete") ||
    (original.mode === "sequential" &&
      (original.generations.length !== original.checks.length ||
        original.generations.some(
          (generation, index) =>
            generation.status !== "complete" ||
            generation.answers.length !== 1 ||
            generation.answers[0] !== original.checks[index].answer,
        ))) ||
    (original.mode === "ordered" &&
      (original.generations.length !== 1 ||
        original.generations[0].status !== "complete" ||
        original.generations[0].answers.length !== 5 ||
        original.checks.some(
          (check, index) =>
            original.generations[0].status !== "complete" ||
            original.generations[0].answers[index] !== check.answer,
        )))
  )
    throw new Error("Invalid correction continuation");
  const result = structuredClone(original);
  result.outcome = "incomplete";
  const check = result.checks.at(-1)!;
  const { suggestion, decision, evidence } = input.review;
  check.correction = { suggestion, decision, evidence };
  if (decision === "equivalent") {
    try {
      const verdict = await input.submit(suggestion);
      check.correction.verdict = verdict;
      if (verdict.kind === "accepted") {
        result.outcome = "accepted";
        return result;
      }
      if (verdict.kind === "correction") {
        result.outcome = "needs-correction-review";
        return result;
      }
    } catch (error) {
      recordFailure(result, "submission", error);
      return result;
    }
  } else {
    check.correction.verdict = { kind: "rejected" };
  }
  const messages: Message[] = [
    { role: "system", content: input.systemPrompt },
    { role: "user", content: result.question.text },
  ];
  if (result.mode === "sequential")
    for (const generation of result.generations) {
      if (generation.status === "complete")
        messages.push(
          { role: "assistant", content: JSON.stringify({ answers: generation.answers }) },
          { ...rejectionFeedback },
        );
    }
  return runRemaining(result, input, messages);
}

export async function evaluateQuestion(input: {
  question: Question;
  model: string;
  mode: Mode;
  requestedEffort: Effort;
  systemPrompt: string;
  generate: (messages: Message[]) => Promise<Generation>;
  submit: (answer: string) => Promise<Verdict>;
}): Promise<Evaluation> {
  const result: Evaluation = {
    question: { ...input.question },
    model: input.model,
    mode: input.mode,
    requestedEffort: input.requestedEffort,
    effectiveEffort: null,
    outcome: "incomplete",
    generations: [],
    checks: [],
  };
  const messages: Message[] = [
    { role: "system", content: input.systemPrompt },
    { role: "user", content: input.question.text },
  ];
  return runRemaining(result, input, messages);
}
