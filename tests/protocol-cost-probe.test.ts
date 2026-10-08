import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseGeneration,
  readUsage,
  recordGeneration,
  readOptions,
  createRunLog,
} from "../scripts/protocol-cost-probe.ts";

const reply = {
  model: "test-model",
  choices: [{ finish_reason: "stop", message: { content: '{"answers":["Example brand"]}' } }],
};

test("preserves low-effort two-mode defaults", () => {
  assert.deepEqual(readOptions([]), { effort: "low", modes: ["sequential", "ordered"] });
});

test("selects high effort and one mode for a matched comparison", () => {
  assert.deepEqual(readOptions(["--effort", "high", "--mode", "sequential"]), {
    effort: "high",
    modes: ["sequential"],
  });
});

test("rejects invalid, incomplete, and duplicate options before live calls", () => {
  for (const args of [
    ["--effort", "unknown"],
    ["--mode"],
    ["--effort", "low", "--effort", "high"],
    ["--url", "other"],
  ]) {
    assert.throws(() => readOptions(args));
  }
});

test("selects a frozen multi-question set from explicit IDs", () => {
  assert.deepEqual(readOptions(["--prompt-ids", "p1,p2,p3"]), {
    effort: "low",
    modes: ["sequential", "ordered"],
    promptIds: ["p1", "p2", "p3"],
  });
});

test("rejects duplicate and empty prompt IDs before live calls", () => {
  for (const value of ["", "p1,p1", "p1,", " p1"])
    assert.throws(() => readOptions(["--prompt-ids", value]));
});

test("parses one substantive answer without executing imported probe code", () => {
  assert.deepEqual(parseGeneration(reply, 1), {
    model: "test-model",
    finishReason: "stop",
    answers: ["Example brand"],
  });
});

test("preserves the order of five candidates", () => {
  const answers = ["Brand A", "Brand B", "Brand C", "Brand D", "Brand E"];
  assert.deepEqual(
    parseGeneration(
      {
        ...reply,
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ answers }) } }],
      },
      5,
    ).answers,
    answers,
  );
});

for (const [label, content] of [
  ["empty answer", '{"answers":[""]}'],
  ["wrong count", '{"answers":["A","B"]}'],
  ["non-string answer", '{"answers":[12]}'],
  ["malformed JSON", "not JSON"],
]) {
  test(`reports ${label} as a generation format failure`, () => {
    assert.throws(() =>
      parseGeneration({ ...reply, choices: [{ finish_reason: "stop", message: { content } }] }, 1),
    );
  });
}

test("does not interpret truncated output as a factual miss", () => {
  assert.throws(
    () =>
      parseGeneration(
        { ...reply, choices: [{ finish_reason: "length", message: { content: '{"answers":' } }] },
        1,
      ),
    /finish reason/,
  );
});

test("keeps missing usage unknown instead of zero", () => {
  assert.deepEqual(readUsage({}), {
    inputTokens: null,
    outputTokens: null,
    reasoningTokens: null,
    cachedInputTokens: null,
  });
});

test("reads reported reasoning separately without adding it twice to output", () => {
  assert.deepEqual(
    readUsage({
      usage: {
        prompt_tokens: 100,
        completion_tokens: 30,
        completion_tokens_details: { reasoning_tokens: 20 },
        prompt_tokens_details: { cached_tokens: 40 },
      },
    }),
    { inputTokens: 100, outputTokens: 30, reasoningTokens: 20, cachedInputTokens: 40 },
  );
});

test("discards invalid usage counters", () => {
  assert.deepEqual(readUsage({ usage: { prompt_tokens: -1, completion_tokens: "30" } }), {
    inputTokens: null,
    outputTokens: null,
    reasoningTokens: null,
    cachedInputTokens: null,
  });
});

test("retains actual model and finish reason when a generation is truncated", () => {
  const record = recordGeneration(
    {
      model: "actual-provider-model",
      choices: [{ finish_reason: "length", message: { content: '{"answers":' } }],
      usage: { prompt_tokens: 50, completion_tokens: 400 },
    },
    1,
    250,
  );
  assert.equal(record.status, "incomplete");
  assert.equal(record.model, "actual-provider-model");
  assert.equal(record.finishReason, "length");
  assert.equal(record.usage.outputTokens, 400);
  assert.equal(record.elapsedMs, 250);
});

test("retains envelope metadata when answer JSON is malformed", () => {
  const record = recordGeneration(
    { ...reply, choices: [{ finish_reason: "stop", message: { content: "not JSON" } }] },
    1,
    50,
  );
  assert.equal(record.status, "incomplete");
  assert.equal(record.model, "test-model");
  assert.equal(record.finishReason, "stop");
});

test("run journals preserve partial records and use distinct files", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "krillion-run-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const first = await createRunLog(directory);
  await first.write({ type: "setup", source: "development" });
  await first.write({ type: "generation-request", model: "synthetic-model" });
  await first.close();
  const second = await createRunLog(directory);
  await second.write({ type: "setup", source: "development" });
  await second.close();
  assert.notEqual(first.path, second.path);
  assert.deepEqual(
    (await readFile(first.path, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line)),
    [
      { type: "setup", source: "development" },
      { type: "generation-request", model: "synthetic-model" },
    ],
  );
});
