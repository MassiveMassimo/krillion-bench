import { randomUUID } from "node:crypto";
import { mkdir, open } from "node:fs/promises";
import { join, resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { createKrillionClient, KrillionApiError } from "../src/krillion/client.ts";

import {
  evaluateQuestion,
  questionScore,
  selectQuestions,
  type Mode,
  type Effort,
  type Message,
  type Usage,
} from "../src/evaluation/records.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function counter(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

export function readUsage(value: unknown): Usage {
  const usage = isRecord(value) && isRecord(value.usage) ? value.usage : {};
  const reasoning = isRecord(usage.completion_tokens_details)
    ? usage.completion_tokens_details
    : {};
  const cache = isRecord(usage.prompt_tokens_details) ? usage.prompt_tokens_details : {};
  return {
    inputTokens: counter(usage.prompt_tokens),
    outputTokens: counter(usage.completion_tokens),
    reasoningTokens: counter(reasoning.reasoning_tokens),
    cachedInputTokens: counter(cache.cached_tokens),
  };
}

export function parseGeneration(value: unknown, expectedCount: number) {
  if (
    !isRecord(value) ||
    typeof value.model !== "string" ||
    !Array.isArray(value.choices) ||
    value.choices.length !== 1
  )
    throw new Error("Invalid chat response");
  const choice: unknown = value.choices[0];
  if (!isRecord(choice) || choice.finish_reason !== "stop")
    throw new Error("Incomplete generation finish reason");
  if (!isRecord(choice.message) || typeof choice.message.content !== "string")
    throw new Error("Missing answer content");
  const content: unknown = JSON.parse(choice.message.content);
  if (
    !isRecord(content) ||
    !Array.isArray(content.answers) ||
    content.answers.length !== expectedCount
  )
    throw new Error("Wrong answer count");
  const answers = content.answers.map((answer: unknown) => {
    if (typeof answer !== "string" || answer.trim().length === 0 || answer.length > 256)
      throw new Error("Invalid answer");
    return answer;
  });
  if (new Set(answers.map((answer) => answer.trim().toLowerCase())).size !== expectedCount)
    throw new Error("Duplicate answers");
  return { model: value.model, finishReason: choice.finish_reason, answers };
}

export function recordGeneration(value: unknown, expectedCount: number, elapsedMs: number) {
  const choice = isRecord(value) && Array.isArray(value.choices) ? value.choices[0] : null;
  const metadata = {
    model: isRecord(value) && typeof value.model === "string" ? value.model : null,
    finishReason:
      isRecord(choice) && typeof choice.finish_reason === "string" ? choice.finish_reason : null,
    usage: readUsage(value),
    elapsedMs,
  };
  try {
    return { ...metadata, ...parseGeneration(value, expectedCount), status: "complete" as const };
  } catch {
    return { ...metadata, status: "incomplete" as const };
  }
}

export function systemPrompt(mode: Mode): string {
  const count =
    mode === "ordered"
      ? "five distinct strings, ordered from your preferred answer to your last fallback"
      : "one string";
  return `Use only your internal knowledge. Do not search or use tools. Choose valid, obscure answers to the question. Return exactly a JSON object with ${count} in answers, for example {"answers":["answer"]}. Do not explain.`;
}

export function readOptions(args: string[]) {
  let effort: Effort = "low";
  let modes: Mode[] = ["sequential", "ordered"];
  let promptIds: string[] | undefined;
  const seen = new Set<string>();
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    if (seen.has(option)) throw new Error("Duplicate probe option");
    seen.add(option);
    if (option === "--effort" && (value === "low" || value === "medium" || value === "high")) {
      effort = value;
    } else if (
      option === "--mode" &&
      (value === "sequential" || value === "ordered" || value === "both")
    ) {
      modes = value === "both" ? ["sequential", "ordered"] : [value];
    } else if (option === "--prompt-ids" && value !== undefined) {
      const ids = value.split(",");
      if (ids.some((id) => !/^[A-Za-z0-9_-]+$/.test(id)) || new Set(ids).size !== ids.length)
        throw new Error("Invalid prompt IDs");
      promptIds = ids;
    } else {
      throw new Error(
        "Use --effort low|medium|high, --mode sequential|ordered|both, and --prompt-ids ID,ID",
      );
    }
  }
  return { effort, modes, ...(promptIds ? { promptIds } : {}) };
}

export async function createRunLog(directory: string) {
  await mkdir(directory, { recursive: true });
  const runId = randomUUID();
  const path = join(directory, `${runId}.jsonl`);
  const handle = await open(path, "wx");
  return {
    runId,
    path,
    write: async (event: unknown) => handle.writeFile(`${JSON.stringify(event)}\n`),
    close: () => handle.close(),
  };
}

export async function generateDevelopment(model: string, messages: Message[], effort: Effort) {
  const started = performance.now();
  const response = await fetch("http://127.0.0.1:8317/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model,
      stream: false,
      reasoning_effort: effort,
      max_tokens: 4096,
      messages,
    }),
  });
  if (!response.ok) throw new Error(`VibeProxy HTTP ${response.status}`);
  const raw: unknown = await response.json();
  return { raw, elapsedMs: Math.round(performance.now() - started) };
}

async function main() {
  const { effort, modes, promptIds } = readOptions(process.argv.slice(2));
  const game = createKrillionClient();
  const today = await game.getToday();
  const questions = selectQuestions(today, promptIds ?? [today.prompts[0].id]);
  const models = ["gpt-6.1-sol", "gpt-6-astra", "gpt-5.6-terra", "gpt-6-luna"];
  const playerId = randomUUID();
  const log = await createRunLog(resolve(".local/runs"));
  try {
    await log.write({
      type: "setup",
      schemaVersion: 1,
      protocolVersion: "development-v2",
      runId: log.runId,
      startedAt: new Date().toISOString(),
      questions,
      models,
      requestedSettings: { reasoning_effort: effort, max_tokens: 4096, stream: false },
      effectiveReasoningEffort: null,
      enforcedOutputCeiling: null,
      reasoningVerification: "proxy application unverified",
      systemPrompts: { sequential: systemPrompt("sequential"), ordered: systemPrompt("ordered") },
      order: modes,
      source: "development",
      provider: "local-vibeproxy",
      chargedUsd: null,
    });
    console.log(
      JSON.stringify({
        type: "setup",
        path: log.path,
        questionIds: questions.map((q) => q.promptId),
        effort,
        modes,
      }),
    );
    let completed = 0;
    let stopped = false;
    batch: for (const question of questions) {
      for (const model of models) {
        for (const mode of modes) {
          const identity = { question, model, mode, requestedEffort: effort };
          const result = await evaluateQuestion({
            ...identity,
            systemPrompt: systemPrompt(mode),
            generate: async (messages) => {
              await log.write({ type: "generation-request", ...identity, messages });
              const response = await generateDevelopment(model, messages, effort);
              const record = recordGeneration(
                response.raw,
                mode === "sequential" ? 1 : 5,
                response.elapsedMs,
              );
              await log.write({ type: "generation", ...identity, record });
              return record;
            },
            submit: async (answer) => {
              await log.write({ type: "submission-request", ...identity, answer });
              const verdict = await game.submit({
                date: question.date,
                promptId: question.promptId,
                answer,
                previewCorrection: true,
                playerId,
              });
              await log.write({ type: "verdict", ...identity, answer, verdict });
              await setTimeout(300);
              return verdict;
            },
          });
          await log.write({ type: "result", ...result, score: questionScore(result) });
          completed++;
          console.log(
            JSON.stringify({
              type: "result",
              promptId: question.promptId,
              model,
              mode,
              effort,
              outcome: result.outcome,
              score: questionScore(result),
              generations: result.generations.length,
              checks: result.checks.length,
            }),
          );
          if (result.failure) {
            stopped = true;
            process.exitCode = 1;
            break batch;
          }
        }
      }
    }
    const end = {
      type: "end",
      finishedAt: new Date().toISOString(),
      status: stopped ? "stopped" : "finished",
      recordedEvaluations: completed,
      expectedEvaluations: questions.length * models.length * modes.length,
    };
    await log.write(end);
    console.log(JSON.stringify(end));
  } finally {
    await log.close();
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        type: "failure",
        reason:
          error instanceof KrillionApiError
            ? error.reason
            : error instanceof Error && error.name === "TimeoutError"
              ? "timeout"
              : "probe-failure",
        message:
          error instanceof KrillionApiError ||
          (error instanceof Error && /^VibeProxy HTTP \d+$/.test(error.message))
            ? error.message
            : "Development probe stopped; no automatic retry",
      }),
    );
    process.exitCode = 1;
  });
}
