import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  buildPilotPlan,
  executePilot,
  openPilotJournal,
  pilotOptions,
  PILOT_MODELS,
} from "../scripts/openrouter-pilot.ts";
import type { OpenRouterCompletion, PilotRoute } from "../src/providers/openrouter.ts";
import { OpenRouterError } from "../src/providers/openrouter.ts";
import type { Evaluation, Message } from "../src/evaluation/records.ts";

const today = {
  date: "2026-10-08",
  dayNumber: 85,
  resetsAt: "2026-10-09T04:00:00Z",
  prompts: Array.from({ length: 7 }, (_, index) => ({
    id: `p${index + 1}`,
    text: `Synthetic ${index + 1}`,
  })),
};
const models = {
  data: PILOT_MODELS.map((id) => ({
    id,
    canonical_slug: `${id}-snapshot`,
    reasoning: { supported_efforts: ["low", "high"] },
  })),
};
const endpoints = PILOT_MODELS.map((id, index) => ({
  data: {
    id,
    endpoints: [
      {
        tag: "openai",
        provider_name: "OpenAI",
        status: 0,
        context_length: index === 0 ? 1_050_000 : 400_000,
        max_completion_tokens: 128_000,
        supported_parameters: ["reasoning", "response_format", "max_tokens"],
        pricing:
          index === 0
            ? { prompt: "0.0000001", completion: "0.0000005" }
            : { prompt: "0.00000005", completion: "0.0000004" },
      },
    ],
  },
}));
const plan = buildPilotPlan({ today, models, endpoints });

function reply(
  route: PilotRoute,
  messages: Message[],
  content?: string | null,
): OpenRouterCompletion {
  const ordered = messages[0].content.includes("five distinct");
  return {
    id: "gen-fixture",
    requestedModel: route.model,
    actualModel: route.model,
    providerName: "OpenAI",
    requestedEffort: route.requestedEffort,
    effectiveEffort: null,
    reportedSearchResults: null,
    content:
      content === undefined
        ? JSON.stringify({ answers: ordered ? ["A", "B", "C", "D", "E"] : ["A"] })
        : content,
    finishReason: "stop",
    usage: { inputTokens: 5, outputTokens: 5, reasoningTokens: 3, cachedInputTokens: null },
    costNanos: "1000",
  };
}

test("freezes the selected model-setting slice, matched questions, and 32-call bound", () => {
  assert.equal(plan.jobs.length, 16);
  assert.equal(plan.maximumCalls, 32);
  assert.equal(plan.maximumNanos, "3843200000");
  assert.deepEqual(
    plan.questions.map((question) => question.promptId),
    ["p1", "p2", "p3"],
  );
  assert.equal(plan.jobs.filter((job) => job.mode === "sequential").length, 4);
  assert.ok(
    plan.jobs
      .filter((job) => job.mode === "sequential")
      .every((job) => job.question.promptId === "p1"),
  );
  const reversed = buildPilotPlan({ today, models, endpoints, promptIds: ["p3", "p2", "p1"] });
  assert.equal(reversed.jobs[0].question.promptId, "p3");
  assert.throws(() => buildPilotPlan({ today, models, endpoints, promptIds: ["p1"] }));
  assert.throws(() => buildPilotPlan({ today, models, endpoints, promptIds: ["p1", "p1", "p3"] }));
  const expensive = endpoints.map((item) => ({
    data: {
      ...item.data,
      endpoints: item.data.endpoints.map((endpoint) => ({
        ...endpoint,
        pricing: { prompt: "0.00001", completion: "0.00005" },
      })),
    },
  }));
  assert.throws(() => buildPilotPlan({ today, models, endpoints: expensive }), /exceeds cap/);
});

test("rejects unplanned CLI changes before credentials or HTTP requests", () => {
  assert.deepEqual(pilotOptions(["prepare"]), { command: "prepare" });
  assert.deepEqual(pilotOptions(["run"]), { command: "run" });
  assert.deepEqual(pilotOptions(["prepare", "--prompt-ids", "p1,p2,p3"]), {
    command: "prepare",
    promptIds: ["p1", "p2", "p3"],
  });
  for (const args of [
    [],
    ["run", "--model", "other/model"],
    ["prepare", "--prompt-ids", "p1,p1,p2"],
    ["run", "extra"],
  ])
    assert.throws(() => pilotOptions(args));
});

test("writes a durable exclusive journal that survives closure and cannot restart a fresh allowance", async () => {
  const directory = await mkdtemp(join(tmpdir(), "krillion-pilot-test-"));
  try {
    const journal = await openPilotJournal(directory);
    await journal.write({
      type: "budget",
      snapshot: {
        capNanos: "10000000000",
        spentNanos: "0",
        reservedNanos: "169000000",
        halted: false,
      },
    });
    const path = journal.path;
    await journal.close();
    assert.equal(
      JSON.parse((await readFile(path, "utf8")).trim()).snapshot.reservedNanos,
      "169000000",
    );
    await assert.rejects(
      openPilotJournal(directory),
      (error: NodeJS.ErrnoException) => error.code === "EEXIST",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("records each configuration with fresh conversations and first acceptance", async () => {
  const events: unknown[] = [];
  let generations = 0;
  const end = await executePilot(plan, {
    provider: {
      async complete(route, messages) {
        generations++;
        assert.equal(messages.length, 2);
        return reply(route, messages);
      },
    },
    game: {
      async submit() {
        return { kind: "accepted", answer: "A", tier: "rare", score: 60 };
      },
    },
    write: async (event) => {
      events.push(event);
    },
  });
  assert.equal(generations, 16);
  assert.deepEqual(end, { status: "finished", recorded: 16, expected: 16 });
  const results = events.filter(
    (event) =>
      typeof event === "object" && event !== null && "type" in event && event.type === "result",
  ) as (Evaluation & { score: number })[];
  assert.equal(results.length, 16);
  assert.ok(
    results.every(
      (result) =>
        result.score === 60 && result.checks.length === 1 && result.effectiveEffort === null,
    ),
  );
});

test("records charged malformed output as incomplete and stops before any submission or next generation", async () => {
  let generations = 0;
  let submissions = 0;
  const events: unknown[] = [];
  const end = await executePilot(plan, {
    provider: {
      async complete(route, messages) {
        generations++;
        return reply(route, messages, "broken");
      },
    },
    game: {
      async submit() {
        submissions++;
        return { kind: "rejected" };
      },
    },
    write: async (event) => {
      events.push(event);
    },
  });
  assert.equal(end.status, "stopped");
  assert.equal(generations, 1);
  assert.equal(submissions, 0);
  assert.ok(
    events.some(
      (event) =>
        typeof event === "object" &&
        event !== null &&
        "type" in event &&
        event.type === "generation" &&
        "response" in event,
    ),
  );
});

test("provider failure stops the runner without a retry and logs a sanitized reason", async () => {
  let calls = 0;
  const events: unknown[] = [];
  const end = await executePilot(plan, {
    provider: {
      async complete() {
        calls++;
        throw new OpenRouterError("timeout");
      },
    },
    game: {
      async submit() {
        throw new Error("Must not submit");
      },
    },
    write: async (event) => {
      events.push(event);
    },
  });
  assert.equal(end.status, "stopped");
  assert.equal(calls, 1);
  assert.ok(
    events.some(
      (event) =>
        typeof event === "object" &&
        event !== null &&
        "type" in event &&
        event.type === "provider-failure" &&
        "reason" in event &&
        event.reason === "timeout",
    ),
  );
});

test("corrections stay provisional and do not submit a suggested answer automatically", async () => {
  let submitted = 0;
  const events: unknown[] = [];
  await executePilot(
    { ...plan, jobs: plan.jobs.slice(0, 1) },
    {
      provider: {
        async complete(route, messages) {
          return reply(route, messages);
        },
      },
      game: {
        async submit() {
          submitted++;
          return { kind: "correction", correction: "Equivalent?" };
        },
      },
      write: async (event) => {
        events.push(event);
      },
    },
  );
  assert.equal(submitted, 1);
  assert.ok(
    events.some(
      (event) =>
        typeof event === "object" &&
        event !== null &&
        "outcome" in event &&
        event.outcome === "needs-correction-review" &&
        "score" in event &&
        event.score === null,
    ),
  );
});
