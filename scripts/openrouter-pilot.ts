import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { setTimeout } from "node:timers/promises";
import { createPilotBudget, usdToNanos } from "../src/evaluation/budget.ts";
import {
  evaluateQuestion,
  questionScore,
  selectQuestions,
  type Generation,
} from "../src/evaluation/records.ts";
import { createKrillionClient, type Today } from "../src/krillion/client.ts";
import {
  createOpenRouterClient,
  maximumCallCost,
  selectPilotRoute,
  OpenRouterError,
} from "../src/providers/openrouter.ts";
import { parseGeneration, systemPrompt } from "./protocol-cost-probe.ts";

export const PILOT_MODELS = ["openai/gpt-6-luna", "openai/gpt-5-nano"] as const;
const PILOT_EFFORTS = ["low", "high"] as const;

export function buildPilotPlan(input: {
  today: Today;
  models: unknown;
  endpoints: unknown[];
  promptIds?: string[];
}) {
  const questions = selectQuestions(
    input.today,
    input.promptIds ?? input.today.prompts.slice(0, 3).map((prompt) => prompt.id),
  );
  if (questions.length !== 3 || input.endpoints.length !== 2)
    throw new Error("Invalid pilot selection");
  const routes = PILOT_MODELS.flatMap((model, index) =>
    PILOT_EFFORTS.map((effort) =>
      selectPilotRoute({
        models: input.models,
        endpoints: input.endpoints[index],
        model,
        effort,
      }),
    ),
  );
  const jobs = questions.flatMap((question, index) =>
    routes.flatMap((route) =>
      (index === 0 ? (["ordered", "sequential"] as const) : (["ordered"] as const)).map((mode) => ({
        question,
        route,
        mode,
      })),
    ),
  );
  const maximumNanos = jobs.reduce(
    (sum, job) => sum + maximumCallCost(job.route) * (job.mode === "sequential" ? 5n : 1n),
    0n,
  );
  if (maximumNanos > 10_000_000_000n) throw new Error("Pilot plan exceeds cap");
  return {
    protocolVersion: "openrouter-pilot-v1",
    source: "official-pilot",
    questions,
    routes,
    jobs,
    maximumCalls: jobs.reduce((sum, job) => sum + (job.mode === "sequential" ? 5 : 1), 0),
    maximumNanos: String(maximumNanos),
    systemPrompts: { ordered: systemPrompt("ordered"), sequential: systemPrompt("sequential") },
  };
}

export function pilotOptions(args: string[]) {
  if (args[0] !== "prepare" && args[0] !== "run") throw new Error("Use prepare or run");
  if (args.length === 1) return { command: args[0] };
  if (args[0] !== "prepare" || args.length !== 3 || args[1] !== "--prompt-ids")
    throw new Error("Use prepare --prompt-ids ID,ID,ID");
  const promptIds = args[2].split(",");
  if (
    promptIds.length !== 3 ||
    new Set(promptIds).size !== 3 ||
    promptIds.some((id) => !/^[\w-]+$/.test(id))
  )
    throw new Error("Invalid pilot question IDs");
  return { command: args[0], promptIds };
}

export async function openPilotJournal(directory: string) {
  await mkdir(directory, { recursive: true });
  const path = join(directory, "openrouter-pilot.jsonl");
  // One fixed, exclusively created journal prevents fresh allowances on restart.
  const handle = await open(path, "wx", 0o600);
  return {
    path,
    async write(event: unknown) {
      await handle.writeFile(`${JSON.stringify(event)}\n`);
      await handle.sync();
    },
    close: () => handle.close(),
  };
}

export async function executePilot(
  plan: ReturnType<typeof buildPilotPlan>,
  dependencies: {
    provider: Pick<ReturnType<typeof createOpenRouterClient>, "complete">;
    game: Pick<ReturnType<typeof createKrillionClient>, "submit">;
    write: (event: unknown) => Promise<void>;
  },
) {
  let recorded = 0;
  for (const { question, route, mode } of plan.jobs) {
    const identity = { question, model: route.model, mode, requestedEffort: route.requestedEffort };
    const playerId = randomUUID();
    const result = await evaluateQuestion({
      ...identity,
      systemPrompt: plan.systemPrompts[mode],
      generate: async (messages) => {
        await dependencies.write({ type: "generation-request", ...identity, messages });
        const started = performance.now();
        try {
          const response = await dependencies.provider.complete(route, messages);
          const metadata = {
            model: response.actualModel,
            finishReason: response.finishReason,
            usage: response.usage,
            elapsedMs: Math.round(performance.now() - started),
          };
          let generation: Generation;
          try {
            const parsed = parseGeneration(
              {
                model: response.actualModel,
                choices: [
                  { finish_reason: response.finishReason, message: { content: response.content } },
                ],
              },
              mode === "sequential" ? 1 : 5,
            );
            generation = { ...metadata, ...parsed, status: "complete" };
          } catch {
            generation = { ...metadata, status: "incomplete" };
          }
          await dependencies.write({ type: "generation", ...identity, response, generation });
          return generation;
        } catch (error) {
          await dependencies.write({
            type: "provider-failure",
            ...identity,
            reason: error instanceof OpenRouterError ? error.reason : "request-failure",
          });
          throw error;
        }
      },
      submit: async (answer) => {
        await dependencies.write({ type: "submission-request", ...identity, answer });
        const verdict = await dependencies.game.submit({
          date: question.date,
          promptId: question.promptId,
          answer,
          previewCorrection: true,
          playerId,
        });
        await dependencies.write({ type: "verdict", ...identity, answer, verdict });
        return verdict;
      },
    });
    await dependencies.write({ type: "result", ...result, score: questionScore(result) });
    recorded++;
    if (result.outcome === "incomplete")
      return { status: "stopped", recorded, expected: plan.jobs.length };
  }
  return { status: "finished", recorded, expected: plan.jobs.length };
}

async function publicJson(path: string) {
  const response = await fetch(`https://openrouter.ai/api/v1/${path}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Catalog request failed");
  return (await response.json()) as unknown;
}

async function getInputs(promptIds?: string[]) {
  const [today, models, ...endpoints] = await Promise.all([
    createKrillionClient().getToday(),
    publicJson("models"),
    ...PILOT_MODELS.map((model) => publicJson(`models/${model}/endpoints`)),
  ]);
  // Only the selected model catalog entries are retained in the private manifest.
  if (
    typeof models !== "object" ||
    models === null ||
    !("data" in models) ||
    !Array.isArray(models.data)
  )
    throw new Error("Invalid catalog");
  const selected = {
    data: models.data.filter(
      (model: unknown) =>
        typeof model === "object" &&
        model !== null &&
        "id" in model &&
        PILOT_MODELS.some((id) => id === model.id),
    ),
  };
  const inputs = { today: today as Today, models: selected, endpoints, promptIds };
  return { inputs, plan: buildPilotPlan(inputs) };
}

async function credential(): Promise<string> {
  const services = process.env.OPENROUTER_KEYCHAIN_SERVICE
    ? [process.env.OPENROUTER_KEYCHAIN_SERVICE]
    : [
        "openrouter",
        "OpenRouter",
        "OPENROUTER_API_KEY",
        "krillion-bench-openrouter",
        "openrouter.ai",
        "https://openrouter.ai",
        "OpenRouter API Key",
        "OpenRouter API",
      ];
  for (const service of services) {
    try {
      const { stdout } = await promisify(execFile)("security", [
        "find-generic-password",
        "-s",
        service,
        "-w",
      ]);
      if (stdout.trim()) return stdout.trim();
    } catch {
      /* Do not expose Keychain output. */
    }
  }
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  throw new Error("OpenRouter credential unavailable");
}

async function main() {
  const options = pilotOptions(process.argv.slice(2));
  const directory = resolve(".local/runs");
  const manifestPath = join(directory, "openrouter-pilot-plan.json");
  if (options.command === "prepare") {
    const prepared = await getInputs(options.promptIds);
    await mkdir(directory, { recursive: true });
    const handle = await open(manifestPath, "wx", 0o600);
    try {
      await handle.writeFile(
        JSON.stringify({ ...prepared, preparedAt: new Date().toISOString() }, null, 2),
      );
      await handle.sync();
    } finally {
      await handle.close();
    }
    console.log(
      JSON.stringify({
        type: "prepared",
        path: manifestPath,
        maximumCalls: prepared.plan.maximumCalls,
        maximumNanos: prepared.plan.maximumNanos,
        questionIds: prepared.plan.questions.map((question) => question.promptId),
      }),
    );
    return;
  }
  const saved: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  if (
    typeof saved !== "object" ||
    saved === null ||
    !("plan" in saved) ||
    typeof saved.plan !== "object" ||
    saved.plan === null ||
    !("questions" in saved.plan) ||
    !Array.isArray(saved.plan.questions)
  )
    throw new Error("Invalid saved pilot plan");
  const ids = saved.plan.questions.map((question: unknown) => {
    if (
      typeof question !== "object" ||
      question === null ||
      !("promptId" in question) ||
      typeof question.promptId !== "string"
    )
      throw new Error("Invalid saved pilot question");
    return question.promptId;
  });
  const fresh = await getInputs(ids);
  if (JSON.stringify(fresh.plan) !== JSON.stringify(saved.plan))
    throw new Error("Saved pilot plan is stale");
  const key = await credential();
  const credits = await fetch("https://openrouter.ai/api/v1/credits", {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  if (!credits.ok) throw new Error("OpenRouter credit check failed");
  const account: unknown = await credits.json();
  if (
    typeof account !== "object" ||
    account === null ||
    !("data" in account) ||
    typeof account.data !== "object" ||
    account.data === null ||
    !("total_credits" in account.data) ||
    !("total_usage" in account.data) ||
    typeof account.data.total_credits !== "number" ||
    typeof account.data.total_usage !== "number"
  )
    throw new Error("OpenRouter credits unknown");
  if (
    usdToNanos(account.data.total_credits) - usdToNanos(account.data.total_usage) <
    BigInt(fresh.plan.maximumNanos)
  )
    throw new Error("Insufficient existing OpenRouter credits");
  const log = await openPilotJournal(directory);
  const budget = createPilotBudget();
  try {
    await log.write({
      type: "setup",
      ...fresh,
      startedAt: new Date().toISOString(),
      budget: budget.snapshot(),
    });
    const provider = createOpenRouterClient({
      apiKey: key,
      budget,
      persistBudget: (snapshot) => log.write({ type: "budget", snapshot }),
    });
    const end = await executePilot(fresh.plan, {
      provider,
      game: {
        async submit(answer) {
          const verdict = await createKrillionClient().submit(answer);
          await setTimeout(300);
          return verdict;
        },
      },
      write: log.write,
    });
    await log.write({
      type: "end",
      ...end,
      budget: budget.snapshot(),
      finishedAt: new Date().toISOString(),
    });
    console.log(JSON.stringify({ ...end, path: log.path, budget: budget.snapshot() }));
    if (end.status === "stopped") process.exitCode = 1;
  } finally {
    await log.close();
  }
}

if (import.meta.main)
  main().catch(() => {
    console.error(
      "OpenRouter pilot stopped. Check the saved plan, existing journal, credential, and credits. No automatic retry or funding purchase.",
    );
    process.exitCode = 1;
  });
