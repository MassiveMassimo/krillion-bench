import assert from "node:assert/strict";
import { test } from "node:test";
import { KrillionApiError, type Today, type Verdict } from "../src/krillion/client.ts";
import {
  evaluateQuestion,
  questionScore,
  selectQuestions,
  type Generation,
  type Message,
} from "../src/evaluation/records.ts";

const today: Today = {
  date: "2026-10-08",
  dayNumber: 85,
  resetsAt: "2026-10-09T04:00:00Z",
  prompts: Array.from({ length: 7 }, (_, i) => ({
    id: `p${i + 1}`,
    text: `Synthetic question ${i + 1}`,
  })),
};
const question = { date: today.date, promptId: "p1", text: today.prompts[0].text };
const settings = {
  question,
  model: "synthetic-model",
  requestedEffort: "low" as const,
  mode: "sequential" as const,
  systemPrompt: "Synthetic instruction",
};
const accepted: Verdict = { kind: "accepted", answer: "Canonical answer", tier: "rare", score: 60 };
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

test("freezes a selected question set in explicit order", () => {
  const frozen = selectQuestions(today, ["p3", "p1"]);
  today.prompts[2].text = "Later mutation";
  assert.deepEqual(frozen, [
    { date: today.date, promptId: "p3", text: "Synthetic question 3" },
    question,
  ]);
  today.prompts[2].text = "Synthetic question 3";
});

test("rejects missing, duplicate, and empty question selections", () => {
  for (const ids of [["missing"], ["p1", "p1"], []])
    assert.throws(() => selectQuestions(today, ids));
});

test("stops at the first accepted sequential answer and preserves generic feedback", async () => {
  const conversations: Message[][] = [];
  const result = await evaluateQuestion({
    ...settings,
    generate: async (messages) => {
      conversations.push(structuredClone(messages));
      return generation([conversations.length === 1 ? "Wrong" : "Valid"]);
    },
    submit: async (answer) => (answer === "Wrong" ? { kind: "rejected" } : accepted),
  });
  assert.equal(result.outcome, "accepted");
  assert.equal(result.checks.length, 2);
  assert.equal(result.generations.length, 2);
  assert.equal(questionScore(result), 60);
  assert.equal(
    conversations[1].some(
      (m) => m.content.includes("Canonical answer") || m.content.includes("rare"),
    ),
    false,
  );
  assert.equal(conversations[1][2].content, '{"answers":["Wrong"]}');
});

test("checks ordered candidates in order and never selects a later higher score", async () => {
  const submitted: string[] = [];
  const result = await evaluateQuestion({
    ...settings,
    mode: "ordered",
    generate: async () => generation(["Wrong A", "Wrong B", "Valid", "Later A", "Later B"]),
    submit: async (answer) => {
      submitted.push(answer);
      return answer === "Valid" ? accepted : { kind: "rejected" };
    },
  });
  assert.deepEqual(submitted, ["Wrong A", "Wrong B", "Valid"]);
  assert.equal(result.generations.length, 1);
  assert.equal(questionScore(result), 60);
});

test("five rejected sequential candidates produce a completed zero", async () => {
  let calls = 0;
  const result = await evaluateQuestion({
    ...settings,
    generate: async () => generation([`Wrong ${++calls}`]),
    submit: async () => ({ kind: "rejected" }),
  });
  assert.equal(calls, 5);
  assert.equal(result.outcome, "miss");
  assert.equal(questionScore(result), 0);
});

test("a correction stops for review within one substantive attempt", async () => {
  const result = await evaluateQuestion({
    ...settings,
    generate: async () => generation(["Variant"]),
    submit: async () => ({ kind: "correction", correction: "Suggested entity" }),
  });
  assert.equal(result.outcome, "needs-correction-review");
  assert.equal(result.generations.length, 1);
  assert.equal(result.checks.length, 1);
  assert.equal(questionScore(result), null);
});

test("a model transport failure is incomplete and is not retried", async () => {
  let calls = 0;
  const result = await evaluateQuestion({
    ...settings,
    generate: async () => {
      calls++;
      throw new Error("request includes private data");
    },
    submit: async () => {
      throw new Error("Unexpected submission");
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.outcome, "incomplete");
  assert.equal(result.failure?.stage, "generation");
  assert.equal(questionScore(result), null);
  assert.equal(JSON.stringify(result).includes("private data"), false);
});

test("submission rate limits retain generation usage and stop without awarding zero", async () => {
  const result = await evaluateQuestion({
    ...settings,
    generate: async () => generation(["Answer"]),
    submit: async () => {
      throw new KrillionApiError("http", "Krillion HTTP 429", 429);
    },
  });
  assert.equal(result.outcome, "incomplete");
  assert.deepEqual(result.failure, { stage: "submission", reason: "http", status: 429 });
  assert.equal(result.generations[0].usage.outputTokens, 20);
  assert.equal(result.checks.length, 0);
  assert.equal(questionScore(result), null);
});

test("truncation preserves finish reason and unknown settings", async () => {
  const truncated: Generation = { ...generation([]), status: "incomplete", finishReason: "length" };
  let submissions = 0;
  const result = await evaluateQuestion({
    ...settings,
    requestedEffort: "high",
    generate: async () => truncated,
    submit: async () => {
      submissions++;
      return accepted;
    },
  });
  assert.equal(result.outcome, "incomplete");
  assert.equal(result.generations[0].finishReason, "length");
  assert.equal(result.requestedEffort, "high");
  assert.equal(result.effectiveEffort, null);
  assert.equal(questionScore(result), null);
  assert.equal(submissions, 0);
});

test("each question starts with a fresh conversation and scores survive serialization", async () => {
  const starts: Message[][] = [];
  const run = async (promptId: string) =>
    evaluateQuestion({
      ...settings,
      question: { ...question, promptId },
      generate: async (messages) => {
        starts.push(structuredClone(messages));
        return generation(["Answer"]);
      },
      submit: async () => accepted,
    });
  const results = [await run("p1"), await run("p2")];
  assert.deepEqual(
    starts.map((m) => m.map((x) => x.role)),
    [
      ["system", "user"],
      ["system", "user"],
    ],
  );
  const saved = JSON.parse(JSON.stringify(results)) as typeof results;
  assert.deepEqual(saved.map(questionScore), [60, 60]);
});

test("invalid candidate counts cannot exceed five substantive attempts", async () => {
  for (const mode of ["sequential", "ordered"] as const) {
    let submissions = 0;
    const result = await evaluateQuestion({
      ...settings,
      mode,
      generate: async () => generation(["A", "B", "C", "D", "E", "F"]),
      submit: async () => {
        submissions++;
        return { kind: "rejected" };
      },
    });
    assert.equal(result.outcome, "incomplete");
    assert.equal(result.checks.length, 0);
    assert.equal(submissions, 0);
  }
});
