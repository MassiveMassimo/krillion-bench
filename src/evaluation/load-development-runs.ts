import { readFile } from "node:fs/promises";
import { aggregateEvaluations } from "./aggregate.ts";
import {
  applyDevelopmentContinuations,
  continuationFilename,
  developmentRunIds,
  parseDevelopmentRun,
} from "./development-runs.ts";

// Only server pages use this loader. The opt-in applies before any journal read.
export async function readDevelopmentResults() {
  if (process.env.KRILLION_DEV_RESULTS !== "1") return null;
  try {
    let runs = await Promise.all(
      developmentRunIds.map(async (id) =>
        parseDevelopmentRun(await readFile(`${process.cwd()}/.local/runs/${id}.jsonl`, "utf8"), id),
      ),
    );
    try {
      runs = applyDevelopmentContinuations(
        runs,
        await readFile(`${process.cwd()}/.local/runs/${continuationFilename}`, "utf8"),
      );
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    const questions = runs[0].questions;
    const evaluations = runs.flatMap((run) => run.evaluations);
    return { questions, evaluations, rows: aggregateEvaluations(evaluations, questions) };
  } catch {
    return null;
  }
}
