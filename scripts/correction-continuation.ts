import { randomUUID } from "node:crypto";
import { readFile, open } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { createKrillionClient } from "../src/krillion/client.ts";
import {
  applyDevelopmentContinuations,
  continuationFilename,
  developmentRunIds,
  parseDevelopmentRun,
} from "../src/evaluation/development-runs.ts";
import {
  continueEvaluation,
  questionScore,
  type CorrectionReview,
  type Evaluation,
} from "../src/evaluation/records.ts";
import { generateDevelopment, recordGeneration, systemPrompt } from "./protocol-cost-probe.ts";

export const correctionPlan = [
  {
    baseRunId: developmentRunIds[0],
    model: "gpt-6.1-sol",
    promptId: "p2",
    review: {
      answer: "A sandblasting cabinet",
      suggestion: "Sandblaster",
      decision: "equivalent",
      evidence:
        "Same blasting equipment in this context; Cyclone uses sandblaster for its abrasive cabinet. https://www.cycloneblasters.com/documentation-troubleshooting.php",
    },
  },
  {
    baseRunId: developmentRunIds[0],
    model: "gpt-5.6-terra",
    promptId: "p2",
    review: {
      answer: "vacuum belt filter",
      suggestion: "Dewatering plant",
      decision: "different",
      evidence:
        "Equipment and plant are different referents; ANDRITZ describes plants containing multiple filter units. https://www.andritz.com/products-en/group/separation/drains-presses/horizontal-vacuum-belt-filter-hvbf",
    },
  },
  {
    baseRunId: developmentRunIds[1],
    model: "gpt-6-astra",
    promptId: "p3",
    review: {
      answer: "Gauntlet placket",
      suggestion: "Sleeve placket",
      decision: "equivalent",
      evidence:
        "Same shirt opening above the cuff; Turnbull & Asser identifies gauntlet as sleeve placket. https://turnbullandasser.com/products/blue-multi-check-cashmerello-fabric",
    },
  },
  {
    baseRunId: developmentRunIds[1],
    model: "gpt-5.6-terra",
    promptId: "p3",
    review: {
      answer: "armscye",
      suggestion: "Armhole",
      decision: "equivalent",
      evidence:
        "Dictionary.com defines armscye as the garment armhole opening. https://www.dictionary.com/browse/armscye",
    },
  },
  {
    baseRunId: developmentRunIds[1],
    model: "gpt-6-luna",
    promptId: "p3",
    review: {
      answer: "gauntlet",
      suggestion: "Sleeve placket",
      decision: "equivalent",
      evidence:
        "In this shirt-part context, gauntlet names the sleeve placket; Turnbull & Asser uses that synonym. https://turnbullandasser.com/products/blue-multi-check-cashmerello-fabric",
    },
  },
] satisfies { baseRunId: string; model: string; promptId: string; review: CorrectionReview }[];

export function selectCorrections(runs: ReturnType<typeof parseDevelopmentRun>[]) {
  return correctionPlan.map((item) => {
    const evaluation = runs
      .find((run) => run.id === item.baseRunId)
      ?.evaluations.find(
        (row) => row.model === item.model && row.question.promptId === item.promptId,
      );
    const last = evaluation?.checks.at(-1);
    if (
      !evaluation ||
      evaluation.outcome !== "needs-correction-review" ||
      last?.verdict.kind !== "correction" ||
      last.answer !== item.review.answer ||
      last.verdict.correction !== item.review.suggestion
    )
      throw new Error("Saved record does not match the frozen correction plan");
    return { ...item, evaluation };
  });
}

async function main() {
  const action = process.argv[2];
  if (process.argv.length !== 3 || !["plan", "run", "finish-filter"].includes(action))
    throw new Error("Use plan, run, or finish-filter");
  const runs = await Promise.all(
    developmentRunIds.map(async (id) =>
      parseDevelopmentRun(await readFile(resolve(".local/runs", `${id}.jsonl`), "utf8"), id),
    ),
  );
  const selected = selectCorrections(runs);
  if (action === "plan") {
    console.log(
      JSON.stringify({
        reviews: correctionPlan,
        maximumNewModelCalls: 16,
        maximumCanonicalSubmissions: 4,
      }),
    );
    return;
  }
  const game = createKrillionClient();
  const today = await game.getToday();
  if (
    runs.some((run) =>
      run.questions.some(
        (question) =>
          question.date !== today.date ||
          !today.prompts.some(
            (prompt) => prompt.id === question.promptId && prompt.text === question.text,
          ),
      ),
    )
  )
    throw new Error("Current game does not match saved question identities");
  if (action === "finish-filter") {
    const journalPath = resolve(".local/runs", continuationFilename);
    const contents = await readFile(journalPath, "utf8");
    const events = contents
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    if (events.some((event) => event.type === "filter-followup-request"))
      throw new Error("Filter follow-up was already dispatched; do not retry");
    const evaluation = applyDevelopmentContinuations(runs, contents)[0].evaluations.find(
      (row) => row.model === "gpt-5.6-terra" && row.question.promptId === "p2",
    );
    const last = evaluation?.checks.at(-1);
    if (
      !evaluation ||
      evaluation.checks.length !== 5 ||
      evaluation.outcome !== "needs-correction-review" ||
      last?.answer !== "industrial dust collector" ||
      last.verdict.kind !== "correction" ||
      last.verdict.correction !== "Dust collector" ||
      last.correction ||
      typeof events[0].playerId !== "string"
    )
      throw new Error("Saved fifth answer does not match the filter review");
    // Atomically claim this one-off dispatch. Keep the claim after success or uncertainty.
    await (await open(`${journalPath}.filter-dispatched`, "wx")).close();
    const handle = await open(journalPath, "a");
    const write = async (event: unknown) => {
      await handle.writeFile(`${JSON.stringify(event)}\n`);
      await handle.sync();
    };
    const identity = {
      baseRunId: developmentRunIds[0],
      model: evaluation.model,
      promptId: evaluation.question.promptId,
    };
    try {
      const result = await continueEvaluation({
        evaluation,
        systemPrompt: systemPrompt(evaluation.mode),
        review: {
          answer: "industrial dust collector",
          suggestion: "Dust collector",
          decision: "equivalent",
          evidence:
            "Same device with the industrial qualifier removed; Cyclone documents filters inside its dust collector. https://www.cycloneblasters.com/documentation-troubleshooting.php",
        },
        generate: async () => {
          throw new Error("No sixth model answer is allowed");
        },
        submit: async (answer) => {
          await write({ type: "filter-followup-request", ...identity, answer });
          const verdict = await game.submit({
            ...evaluation.question,
            answer,
            previewCorrection: true,
            playerId: events[0].playerId,
          });
          await write({ type: "verdict", ...identity, answer, verdict });
          return verdict;
        },
      });
      await write({
        type: "continuation-result",
        ...identity,
        evaluation: { ...result, score: questionScore(result) },
      });
      console.log(
        JSON.stringify({
          ...identity,
          outcome: result.outcome,
          score: questionScore(result),
          attempts: result.checks.length,
          newGenerations: 0,
        }),
      );
    } finally {
      await handle.close();
    }
    return;
  }
  // An exclusive journal prevents accidental reruns. Persist every dispatch before making it.
  const handle = await open(resolve(".local/runs", continuationFilename), "wx");
  const write = async (event: unknown) => {
    await handle.writeFile(`${JSON.stringify(event)}\n`);
    await handle.sync();
  };
  const playerId = randomUUID();
  let completed = 0;
  try {
    await write({
      type: "continuation-setup",
      schemaVersion: 1,
      source: "development",
      provider: "local-vibeproxy",
      baseRunIds: developmentRunIds,
      startedAt: new Date().toISOString(),
      reviews: correctionPlan,
      playerId,
      chargedUsd: null,
      protocolVersion: "development-correction-v1",
      originalPlayerIdAvailable: false,
    });
    for (const item of selected) {
      const identity = { baseRunId: item.baseRunId, model: item.model, promptId: item.promptId };
      const result: Evaluation = await continueEvaluation({
        evaluation: item.evaluation,
        review: item.review,
        systemPrompt: systemPrompt(item.evaluation.mode),
        generate: async (messages) => {
          await write({ type: "generation-request", ...identity, messages });
          const response = await generateDevelopment(
            item.model,
            messages,
            item.evaluation.requestedEffort,
          );
          const record = recordGeneration(response.raw, 1, response.elapsedMs);
          await write({ type: "generation", ...identity, record });
          return record;
        },
        submit: async (answer) => {
          await write({ type: "submission-request", ...identity, answer });
          const verdict = await game.submit({
            ...item.evaluation.question,
            answer,
            previewCorrection: true,
            playerId,
          });
          await write({ type: "verdict", ...identity, answer, verdict });
          await setTimeout(300);
          return verdict;
        },
      });
      await write({
        type: "continuation-result",
        ...identity,
        evaluation: { ...result, score: questionScore(result) },
      });
      completed++;
      console.log(
        JSON.stringify({
          ...identity,
          outcome: result.outcome,
          score: questionScore(result),
          attempts: result.checks.length,
          newGenerations: result.generations.length - item.evaluation.generations.length,
        }),
      );
      if (result.outcome === "incomplete") break;
    }
    await write({
      type: "continuation-end",
      recordedEvaluations: completed,
      expectedEvaluations: selected.length,
      finishedAt: new Date().toISOString(),
    });
  } finally {
    await handle.close();
  }
}

if (import.meta.url === new URL(process.argv[1] ?? "", "file:").href)
  main().catch(() => {
    console.error(
      "Correction continuation stopped; inspect the local journal. No automatic retry.",
    );
    process.exitCode = 1;
  });
