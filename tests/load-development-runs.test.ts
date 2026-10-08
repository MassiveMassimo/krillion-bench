import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { readDevelopmentResults } from "../src/evaluation/load-development-runs.ts";
import { developmentRunIds, continuationFilename } from "../src/evaluation/development-runs.ts";
import { syntheticDay } from "../src/evaluation/fixtures.ts";
import { questionScore, type Evaluation } from "../src/evaluation/records.ts";

test("shared server loader requires opt-in and rejects invalid local evidence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "krillion-home-test-"));
  const previous = process.env.KRILLION_DEV_RESULTS;
  const previousDirectory = process.cwd();
  try {
    const journalDirectory = join(directory, ".local/runs");
    await mkdir(journalDirectory, { recursive: true });
    process.chdir(directory);
    for (const [index, id] of developmentRunIds.entries()) {
      const effort = index === 0 ? "low" : "high";
      const evaluation: Evaluation = { ...syntheticDay.evaluations[0], requestedEffort: effort };
      const events = [
        {
          type: "setup",
          schemaVersion: 1,
          protocolVersion: "development-v2",
          runId: id,
          startedAt: "2026-10-01T12:00:00Z",
          source: "development",
          provider: "local-vibeproxy",
          chargedUsd: null,
          questions: [evaluation.question],
          models: [evaluation.model],
          requestedSettings: { reasoning_effort: effort },
        },
        { ...evaluation, type: "result", score: questionScore(evaluation) },
        { type: "end", status: "finished", expectedEvaluations: 1, recordedEvaluations: 1 },
      ];
      await writeFile(
        join(journalDirectory, id + ".jsonl"),
        events.map((event) => JSON.stringify(event)).join("\n"),
      );
    }
    for (const flag of [undefined, "0", "true"]) {
      if (flag === undefined) delete process.env.KRILLION_DEV_RESULTS;
      else process.env.KRILLION_DEV_RESULTS = flag;
      assert.equal(await readDevelopmentResults(), null);
    }
    process.env.KRILLION_DEV_RESULTS = "1";
    const results = await readDevelopmentResults();
    assert.equal(results?.evaluations.length, 2);
    assert.deepEqual(
      results?.rows.map((row) => [row.requestedEffort, row.meanPoints]),
      [
        ["low", 10],
        ["high", 10],
      ],
    );
    await writeFile(join(journalDirectory, continuationFilename), "invalid overlay");
    assert.equal(await readDevelopmentResults(), null);
    await rm(join(journalDirectory, continuationFilename));
    await rm(join(journalDirectory, developmentRunIds[0] + ".jsonl"));
    assert.equal(await readDevelopmentResults(), null);
  } finally {
    process.chdir(previousDirectory);
    if (previous === undefined) delete process.env.KRILLION_DEV_RESULTS;
    else process.env.KRILLION_DEV_RESULTS = previous;
    await rm(directory, { recursive: true, force: true });
  }
});
