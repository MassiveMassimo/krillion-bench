import assert from "node:assert/strict";
import { test } from "node:test";
import { KrillionApiError, type Verdict } from "../src/krillion/client.ts";
import {
  continueEvaluation,
  questionScore,
  type Evaluation,
  type Generation,
  type Message,
  type Mode,
} from "../src/evaluation/records.ts";

const systemPrompt = "Synthetic no-search instruction";
const feedback =
  "Not accepted. Give a different valid, obscure answer. Return the same JSON format.";
const review = {
  answer: "Kumqat",
  suggestion: "Kumquat",
  decision: "equivalent" as const,
  evidence: "Synthetic spelling evidence confirms the same entity.",
};
const accepted: Verdict = { kind: "accepted", answer: "Kumquat", tier: "rare", score: 60 };

function generation(answers: string[]): Generation {
  return {
    status: "complete",
    model: "synthetic-model",
    finishReason: "stop",
    answers,
    usage: { inputTokens: 50, outputTokens: 20, reasoningTokens: 10, cachedInputTokens: 0 },
    elapsedMs: 100,
  };
}

function pending(mode: Mode = "sequential", count = 1): Evaluation {
  const checked = Array.from({ length: count - 1 }, (_, i) => `Wrong ${i + 1}`);
  const answers = [...checked, review.answer];
  return {
    question: { date: "2026-10-08", promptId: "synthetic-1", text: "Synthetic question" },
    model: "synthetic-model",
    mode,
    requestedEffort: "high",
    effectiveEffort: null,
    outcome: "needs-correction-review",
    generations:
      mode === "sequential"
        ? answers.map((answer) => generation([answer]))
        : [
            generation([
              ...answers,
              ...Array.from({ length: 5 - count }, (_, i) => `Tail ${i + 1}`),
            ]),
          ],
    checks: [
      ...checked.map((answer) => ({ answer, verdict: { kind: "rejected" as const } })),
      { answer: review.answer, verdict: { kind: "correction", correction: review.suggestion } },
    ],
  };
}

function freezeEvaluation(evaluation: Evaluation): Evaluation {
  const freeze = (value: unknown): void => {
    if (value !== null && typeof value === "object") {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
  };
  freeze(evaluation);
  return evaluation;
}

async function unexpectedGeneration(): Promise<Generation> {
  throw new Error("Unexpected model generation");
}

async function unexpectedSubmission(): Promise<Verdict> {
  throw new Error("Unexpected game submission");
}

test("an accepted equivalent correction scores the original attempt and preserves immutable history", async () => {
  const input = freezeEvaluation(pending("sequential", 3));
  const before = structuredClone(input);
  const submissions: string[] = [];
  const result = await continueEvaluation({
    evaluation: input,
    systemPrompt,
    review,
    generate: unexpectedGeneration,
    submit: async (answer) => {
      submissions.push(answer);
      return accepted;
    },
  });
  assert.deepEqual(submissions, [review.suggestion]);
  assert.equal(result.outcome, "accepted");
  assert.equal(questionScore(result), 60);
  assert.equal(result.checks.length, 3);
  assert.deepEqual(result.checks.slice(0, 2), before.checks.slice(0, 2));
  assert.deepEqual(result.checks[2], {
    ...before.checks[2],
    correction: {
      suggestion: review.suggestion,
      decision: "equivalent",
      evidence: review.evidence,
      verdict: accepted,
    },
  });
  assert.deepEqual(result.generations, before.generations);
  assert.deepEqual(
    [result.question, result.model, result.mode, result.requestedEffort, result.effectiveEffort],
    [before.question, before.model, before.mode, before.requestedEffort, before.effectiveEffort],
  );
  assert.deepEqual(input, before);
  assert.equal(questionScore(JSON.parse(JSON.stringify(result)) as Evaluation), 60);
});

test("a different-entity review resumes the sequential conversation without revealing the suggestion", async () => {
  const input = freezeEvaluation(pending("sequential", 2));
  const conversations: Message[][] = [];
  const submissions: string[] = [];
  const result = await continueEvaluation({
    evaluation: input,
    systemPrompt,
    review: { ...review, decision: "different" },
    generate: async (messages) => {
      conversations.push(structuredClone(messages));
      return generation(["New candidate"]);
    },
    submit: async (answer) => {
      submissions.push(answer);
      return accepted;
    },
  });
  assert.deepEqual(conversations, [
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.question.text },
      { role: "assistant", content: '{"answers":["Wrong 1"]}' },
      { role: "user", content: feedback },
      { role: "assistant", content: '{"answers":["Kumqat"]}' },
      { role: "user", content: feedback },
    ],
  ]);
  assert.deepEqual(submissions, ["New candidate"]);
  assert.equal(JSON.stringify(conversations).includes(review.suggestion), false);
  assert.equal(JSON.stringify(conversations).includes(review.evidence), false);
  assert.deepEqual(result.checks[1], {
    ...input.checks[1],
    correction: {
      suggestion: review.suggestion,
      decision: "different",
      evidence: review.evidence,
      verdict: { kind: "rejected" },
    },
  });
  assert.equal(result.checks.length, 3);
  assert.equal(result.generations.length, 3);
  assert.equal(result.outcome, "accepted");
});

test("a rejected equivalent correction resumes with generic feedback and costs no extra substantive check", async () => {
  const conversations: Message[][] = [];
  const submissions: string[] = [];
  const result = await continueEvaluation({
    evaluation: pending(),
    systemPrompt,
    review,
    generate: async (messages) => {
      conversations.push(structuredClone(messages));
      return generation(["New candidate"]);
    },
    submit: async (answer) => {
      submissions.push(answer);
      return answer === review.suggestion ? { kind: "rejected" } : accepted;
    },
  });
  assert.deepEqual(submissions, [review.suggestion, "New candidate"]);
  assert.equal(result.checks.length, 2);
  assert.equal(result.generations.length, 2);
  assert.deepEqual(result.checks[0].correction?.verdict, { kind: "rejected" });
  assert.equal(conversations[0].at(-1)?.content, feedback);
  assert.equal(conversations[0].at(-2)?.content, '{"answers":["Kumqat"]}');
  assert.equal(JSON.stringify(conversations).includes(review.suggestion), false);
});

test("ordered continuation checks the remaining original candidates and stops at first acceptance", async () => {
  const input = freezeEvaluation(pending("ordered", 2));
  const submissions: string[] = [];
  const result = await continueEvaluation({
    evaluation: input,
    systemPrompt,
    review: { ...review, decision: "different" },
    generate: unexpectedGeneration,
    submit: async (answer) => {
      submissions.push(answer);
      return answer === "Tail 2" ? accepted : { kind: "rejected" };
    },
  });
  assert.deepEqual(submissions, ["Tail 1", "Tail 2"]);
  assert.equal(result.outcome, "accepted");
  assert.equal(result.checks.length, 4);
  assert.deepEqual(result.generations, input.generations);
  assert.equal(questionScore(result), 60);
});

test("ordered equivalent rejection checks the original tail without regenerating or resubmitting earlier answers", async () => {
  const submissions: string[] = [];
  const result = await continueEvaluation({
    evaluation: pending("ordered", 3),
    systemPrompt,
    review,
    generate: unexpectedGeneration,
    submit: async (answer) => {
      submissions.push(answer);
      return { kind: "rejected" };
    },
  });
  assert.deepEqual(submissions, [review.suggestion, "Tail 1", "Tail 2"]);
  assert.equal(result.outcome, "miss");
  assert.equal(result.checks.length, 5);
  assert.equal(result.generations.length, 1);
  assert.equal(questionScore(result), 0);
});

test("a reviewed different suggestion can reach a completed zero after exactly five sequential answers", async () => {
  const conversations: Message[][] = [];
  const submissions: string[] = [];
  const result = await continueEvaluation({
    evaluation: pending(),
    systemPrompt,
    review: { ...review, decision: "different" },
    generate: async (messages) => {
      conversations.push(structuredClone(messages));
      return generation([`Next ${conversations.length}`]);
    },
    submit: async (answer) => {
      submissions.push(answer);
      return { kind: "rejected" };
    },
  });
  assert.deepEqual(submissions, ["Next 1", "Next 2", "Next 3", "Next 4"]);
  assert.equal(result.outcome, "miss");
  assert.equal(result.checks.length, 5);
  assert.equal(result.generations.length, 5);
  assert.equal(questionScore(result), 0);
  assert.deepEqual(conversations[3].slice(-2), [
    { role: "assistant", content: '{"answers":["Next 3"]}' },
    { role: "user", content: feedback },
  ]);
});

test("the fifth answer can accept an equivalent correction without starting a sixth attempt", async () => {
  const result = await continueEvaluation({
    evaluation: pending("sequential", 5),
    systemPrompt,
    review,
    generate: unexpectedGeneration,
    submit: async () => accepted,
  });
  assert.equal(result.outcome, "accepted");
  assert.equal(result.checks.length, 5);
  assert.equal(result.generations.length, 5);
  assert.equal(questionScore(result), 60);
});

test("reviewing the fifth correction as different completes a zero without further work in either mode", async () => {
  for (const mode of ["sequential", "ordered"] as const) {
    const result = await continueEvaluation({
      evaluation: pending(mode, 5),
      systemPrompt,
      review: { ...review, decision: "different" },
      generate: unexpectedGeneration,
      submit: unexpectedSubmission,
    });
    assert.equal(result.outcome, "miss");
    assert.equal(result.checks.length, 5);
    assert.equal(questionScore(result), 0);
  }
});

test("a later substantive correction remains pending and can itself be reviewed", async () => {
  const submissions: string[] = [];
  const first = await continueEvaluation({
    evaluation: pending(),
    systemPrompt,
    review: { ...review, decision: "different" },
    generate: async () => generation(["New variant"]),
    submit: async (answer) => {
      submissions.push(answer);
      return { kind: "correction", correction: "New canonical" };
    },
  });
  assert.deepEqual(submissions, ["New variant"]);
  assert.equal(first.outcome, "needs-correction-review");
  assert.equal(first.checks.length, 2);
  assert.equal(questionScore(first), null);
  const second = await continueEvaluation({
    evaluation: freezeEvaluation(first),
    systemPrompt,
    review: {
      answer: "New variant",
      suggestion: "New canonical",
      decision: "equivalent",
      evidence: "Synthetic second spelling evidence.",
    },
    generate: unexpectedGeneration,
    submit: async (answer) => {
      submissions.push(answer);
      return accepted;
    },
  });
  assert.deepEqual(submissions, ["New variant", "New canonical"]);
  assert.equal(second.checks.length, 2);
  assert.equal(questionScore(second), 60);
  assert.deepEqual(second.checks[0], first.checks[0]);
});

test("a correction in the remaining ordered tail stops before any later candidates", async () => {
  const submissions: string[] = [];
  const result = await continueEvaluation({
    evaluation: pending("ordered", 2),
    systemPrompt,
    review: { ...review, decision: "different" },
    generate: unexpectedGeneration,
    submit: async (answer) => {
      submissions.push(answer);
      return { kind: "correction", correction: "Tail canonical" };
    },
  });
  assert.deepEqual(submissions, ["Tail 1"]);
  assert.equal(result.outcome, "needs-correction-review");
  assert.equal(result.checks.length, 3);
  assert.equal(result.generations.length, 1);
  assert.equal(questionScore(result), null);
});

test("a second canonical correction is preserved without an automatic correction loop", async () => {
  const submissions: string[] = [];
  const nextVerdict: Verdict = { kind: "correction", correction: "Another canonical" };
  const result = await continueEvaluation({
    evaluation: pending(),
    systemPrompt,
    review,
    generate: unexpectedGeneration,
    submit: async (answer) => {
      submissions.push(answer);
      return nextVerdict;
    },
  });
  assert.deepEqual(submissions, [review.suggestion]);
  assert.equal(result.outcome, "needs-correction-review");
  assert.equal(result.checks.length, 1);
  assert.deepEqual(result.checks[0].verdict, { kind: "correction", correction: review.suggestion });
  assert.deepEqual(result.checks[0].correction, {
    suggestion: review.suggestion,
    decision: "equivalent",
    evidence: review.evidence,
    verdict: nextVerdict,
  });
  assert.equal(questionScore(result), null);
  await assert.rejects(
    continueEvaluation({
      evaluation: result,
      systemPrompt,
      review,
      generate: unexpectedGeneration,
      submit: unexpectedSubmission,
    }),
  );
});

test("canonical submission failure retains evidence and ends incomplete without retries", async () => {
  const input = freezeEvaluation(pending("ordered", 2));
  const submissions: string[] = [];
  let generations = 0;
  const result = await continueEvaluation({
    evaluation: input,
    systemPrompt,
    review,
    generate: async () => {
      generations++;
      return generation(["Unexpected"]);
    },
    submit: async (answer) => {
      submissions.push(answer);
      throw new KrillionApiError("http", "Private response text", 429);
    },
  });
  assert.deepEqual(submissions, [review.suggestion]);
  assert.equal(generations, 0);
  assert.equal(result.outcome, "incomplete");
  assert.deepEqual(result.failure, { stage: "submission", reason: "http", status: 429 });
  assert.equal(result.checks.length, 2);
  assert.deepEqual(result.checks[1].verdict, input.checks[1].verdict);
  assert.deepEqual(result.checks[1].correction, {
    suggestion: review.suggestion,
    decision: "equivalent",
    evidence: review.evidence,
  });
  assert.deepEqual(result.generations, input.generations);
  assert.equal(questionScore(result), null);
  assert.equal(JSON.stringify(result).includes("Private response text"), false);
});

test("a resumed generation failure preserves the reviewed check and stops incomplete", async () => {
  let calls = 0;
  const input = pending("sequential", 2);
  const result = await continueEvaluation({
    evaluation: input,
    systemPrompt,
    review: { ...review, decision: "different" },
    generate: async () => {
      calls++;
      throw new Error("Private provider data");
    },
    submit: unexpectedSubmission,
  });
  assert.equal(calls, 1);
  assert.equal(result.outcome, "incomplete");
  assert.deepEqual(result.failure, { stage: "generation", reason: "request-failure" });
  assert.equal(result.checks.length, 2);
  assert.deepEqual(result.checks[1].correction?.verdict, { kind: "rejected" });
  assert.deepEqual(result.generations, input.generations);
  assert.equal(questionScore(result), null);
  assert.equal(JSON.stringify(result).includes("Private provider data"), false);
});

test("a resumed answer submission failure preserves usage and does not retry or award zero", async () => {
  let calls = 0;
  const result = await continueEvaluation({
    evaluation: pending("sequential", 4),
    systemPrompt,
    review: { ...review, decision: "different" },
    generate: async () => generation(["Fifth candidate"]),
    submit: async () => {
      calls++;
      throw new KrillionApiError("timeout", "Private timeout text");
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.outcome, "incomplete");
  assert.deepEqual(result.failure, { stage: "submission", reason: "timeout" });
  assert.equal(result.generations.length, 5);
  assert.equal(result.generations[4].usage.outputTokens, 20);
  assert.equal(result.checks.length, 4);
  assert.equal(questionScore(result), null);
});

test("invalid resumed candidate counts stay incomplete without any answer submission", async () => {
  for (const answers of [[], ["Candidate A", "Candidate B"]]) {
    let submissions = 0;
    const result = await continueEvaluation({
      evaluation: pending(),
      systemPrompt,
      review: { ...review, decision: "different" },
      generate: async () => generation(answers),
      submit: async () => {
        submissions++;
        return accepted;
      },
    });
    assert.equal(result.outcome, "incomplete");
    assert.equal(result.generations.length, 2);
    assert.equal(result.checks.length, 1);
    assert.equal(questionScore(result), null);
    assert.equal(submissions, 0);
  }
});

test("an incomplete resumed generation retains finish reason and usage without submission", async () => {
  const record: Generation = {
    status: "incomplete",
    model: "synthetic-model",
    finishReason: "length",
    usage: { inputTokens: 50, outputTokens: 20, reasoningTokens: 10, cachedInputTokens: 0 },
    elapsedMs: 100,
  };
  let submissions = 0;
  const result = await continueEvaluation({
    evaluation: pending(),
    systemPrompt,
    review: { ...review, decision: "different" },
    generate: async () => record,
    submit: async () => {
      submissions++;
      return accepted;
    },
  });
  assert.equal(result.outcome, "incomplete");
  assert.equal(result.checks.length, 1);
  assert.equal(result.generations.length, 2);
  assert.deepEqual(result.generations[1], record);
  assert.equal(submissions, 0);
  assert.equal(questionScore(result), null);
});

test("continuation rejects nonpending outcomes and mismatched review identity before external calls", async () => {
  const invalid: { evaluation: Evaluation; review: typeof review }[] = [];
  for (const outcome of ["accepted", "miss", "incomplete"] as const)
    invalid.push({ evaluation: { ...pending(), outcome }, review });
  invalid.push(
    { evaluation: pending(), review: { ...review, answer: "Another answer" } },
    { evaluation: pending(), review: { ...review, suggestion: "Another suggestion" } },
  );
  let calls = 0;
  for (const entry of invalid) {
    const input = freezeEvaluation(entry.evaluation);
    const before = structuredClone(input);
    await assert.rejects(
      continueEvaluation({
        evaluation: input,
        systemPrompt,
        review: entry.review,
        generate: async () => {
          calls++;
          return generation(["Unexpected"]);
        },
        submit: async () => {
          calls++;
          return accepted;
        },
      }),
    );
    assert.deepEqual(input, before);
  }
  assert.equal(calls, 0);
});
