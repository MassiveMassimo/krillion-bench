import assert from "node:assert/strict";
import { test } from "node:test";
import { aggregateEvaluations } from "../src/evaluation/aggregate.ts";
import { syntheticDay } from "../src/evaluation/fixtures.ts";
import type { Evaluation } from "../src/evaluation/records.ts";

const question = syntheticDay.question;
const second = { ...question, promptId: "second" };
const accepted = syntheticDay.evaluations[0];
const miss = syntheticDay.evaluations[3];
const record = (model: string, result: Evaluation, next = question): Evaluation => ({
  ...result,
  model,
  question: next,
  requestedEffort: "low",
  mode: "sequential",
});

test("shared means include completed misses and preserve equal-rank ties", () => {
  const rows = aggregateEvaluations(
    [
      record("A", accepted),
      record("A", miss, second),
      record("B", miss),
      record("B", accepted, second),
      record("C", accepted),
      record("C", accepted, second),
    ],
    [question, second],
  );
  assert.deepEqual(
    rows.map((row) => [row.meanPoints, row.rank]),
    [
      [5, 2],
      [5, 2],
      [10, 1],
    ],
  );
  assert.equal(rows[0].scored, 2);
  assert.equal(rows[0].accepted, 1);
});

test("pending, incomplete, and missing questions cannot become zeros or final ranks", () => {
  const rows = aggregateEvaluations(
    [
      record("complete", accepted),
      record("complete", accepted, second),
      record("pending", accepted),
      record("pending", syntheticDay.evaluations[2], second),
      record("incomplete", accepted),
      record("incomplete", syntheticDay.evaluations[4], second),
      record("missing", accepted),
    ],
    [question, second],
  );
  assert.deepEqual(
    rows.map((row) => row.rank),
    [null, null, null, null],
  );
  assert.deepEqual(
    rows.map((row) => row.meanPoints),
    [10, null, null, null],
  );
  assert.equal(rows[1].pending, 1);
  assert.equal(rows[2].incomplete, 1);
  assert.equal(rows[3].missing, 1);
  assert.equal(rows[3].recorded, 1);
});

test("thinking and generation policies remain separate configurations", () => {
  const rows = aggregateEvaluations(
    [accepted, { ...accepted, requestedEffort: "high" }, { ...accepted, mode: "ordered" }],
    [question],
  );
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((row) => row.rank),
    [1, 1, 1],
  );
});

test("duplicate or mismatched coverage is rejected rather than biasing means", () => {
  assert.throws(() => aggregateEvaluations([accepted, accepted], [question]), /Duplicate/);
  assert.throws(() => aggregateEvaluations([accepted], [second]), /shared question/);
  assert.throws(
    () => aggregateEvaluations([accepted], [{ ...question, text: "Changed" }]),
    /shared question/,
  );
  assert.throws(() => aggregateEvaluations([], [question, question]), /unique/);
  assert.throws(() => aggregateEvaluations([], []), /nonempty/);
});

test("an empty evaluation set produces no invented model entries", () => {
  assert.deepEqual(aggregateEvaluations([], [question]), []);
});
