import assert from "node:assert/strict";
import { test } from "node:test";
import { getSavedDay, savedDates, savedDays } from "../src/evaluation/saved-days.ts";
import { questionScore } from "../src/evaluation/records.ts";

test("saved example routes preserve provenance, question identity, and recorded scores", () => {
  assert.equal(new Set(savedDates).size, savedDays.length);
  for (const day of savedDays) {
    assert.equal(day.source, "synthetic");
    assert.equal(day.costUsd, null);
    assert.equal(day.latencyMs, null);
    assert.equal(getSavedDay(day.question.date), day);
    for (const evaluation of day.evaluations) assert.deepEqual(evaluation.question, day.question);
    assert.deepEqual(day.evaluations.map(questionScore), [10, 85, null, 0, null]);
  }
});

test("missing and invalid dates do not fall back to another day's answers", () => {
  for (const date of ["2026-10-02", "2026-02-30", "not-a-date", "2026-10-01/extra", ""])
    assert.equal(getSavedDay(date), undefined);
});
