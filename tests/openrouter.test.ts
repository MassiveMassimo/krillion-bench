import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { test } from "node:test";
import { createPilotBudget, type BudgetSnapshot } from "../src/evaluation/budget.ts";
import {
  createOpenRouterClient,
  maximumCallCost,
  OpenRouterError,
  selectPilotRoute,
} from "../src/providers/openrouter.ts";

const model = "openai/gpt-5-mini";
const catalog = {
  models: {
    data: [{ id: model, canonical_slug: model, reasoning: { supported_efforts: ["low", "high"] } }],
  },
  endpoints: {
    data: {
      id: model,
      endpoints: [
        {
          tag: "openai",
          provider_name: "OpenAI",
          status: 0,
          context_length: 400_000,
          max_completion_tokens: 128_000,
          supported_parameters: ["reasoning", "max_tokens", "response_format"],
          pricing: { prompt: "0.00000025", completion: "0.000002" },
        },
      ],
    },
  },
};
const route = selectPilotRoute({ ...catalog, model, effort: "high" });
const messages = [
  { role: "user" as const, content: "Return JSON with an answers array. Name a fruit." },
];
const completion = {
  id: "gen-test",
  model,
  choices: [{ finish_reason: "stop", message: { content: '{"answers":["Gooseberry"]}' } }],
  usage: {
    cost: 0.002,
    is_byok: false,
    prompt_tokens: 100,
    completion_tokens: 200,
    completion_tokens_details: { reasoning_tokens: 150 },
    prompt_tokens_details: { cached_tokens: 10 },
  },
};
const metadata = {
  data: { id: "gen-test", model, provider_name: "OpenAI", total_cost: 0.002, num_fetches: 0 },
};

async function withServer(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
  run: (baseUrl: string) => Promise<void>,
) {
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}/api/v1/`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("rejects unsupported controls, route substitutions, output limits, and request fees before dispatch", () => {
  assert.equal(maximumCallCost(route), 356_000_000n);
  assert.equal(route.maxTokens, 8192);
  assert.throws(() => selectPilotRoute({ ...catalog, model, effort: "medium" }));
  assert.throws(() => selectPilotRoute({ ...catalog, model, effort: "high", maxTokens: 128001 }));
  const endpoint = catalog.endpoints.data.endpoints[0];
  for (const change of [
    { tag: "azure" },
    { provider_name: "Azure" },
    { status: 1 },
    { supported_parameters: ["reasoning"] },
    { pricing: { ...endpoint.pricing, request: "0.01" } },
  ]) {
    assert.throws(() =>
      selectPilotRoute({
        ...catalog,
        model,
        effort: "high",
        endpoints: { data: { id: model, endpoints: [{ ...endpoint, ...change }] } },
      }),
    );
  }
});

test("pins the route, persists before dispatch, and records one charge with reasoning as a subset", async () => {
  const budget = createPilotBudget();
  const saved: BudgetSnapshot[] = [];
  let body: Record<string, unknown> | undefined;
  let calls = 0;
  await withServer(
    (request, response) => {
      calls += 1;
      assert.equal(request.headers.authorization, "Bearer fixture-key");
      assert.equal(saved[0].reservedNanos, "356000000");
      if (request.method === "POST") {
        let text = "";
        request.on("data", (chunk) => (text += chunk));
        request.on("end", () => {
          body = JSON.parse(text);
          response.end(JSON.stringify(completion));
        });
      } else {
        assert.equal(request.url, "/api/v1/generation?id=gen-test");
        response.end(JSON.stringify(metadata));
      }
    },
    async (baseUrl) => {
      const client = createOpenRouterClient({
        apiKey: "fixture-key",
        budget,
        baseUrl,
        persistBudget: async (snapshot) => {
          saved.push(snapshot);
        },
      });
      const result = await client.complete(route, messages);
      assert.equal(result.costNanos, "2000000");
      assert.equal(result.actualModel, model);
      assert.equal(result.providerName, "OpenAI");
      assert.equal(result.reportedSearchResults, null);
      assert.equal(result.effectiveEffort, null);
      assert.deepEqual(result.usage, {
        inputTokens: 100,
        outputTokens: 200,
        reasoningTokens: 150,
        cachedInputTokens: 10,
      });
      assert.deepEqual(body?.provider, {
        only: ["openai"],
        order: ["openai"],
        allow_fallbacks: false,
        require_parameters: true,
        max_price: { prompt: 0.25, completion: 2, request: 0 },
      });
      assert.deepEqual(body?.reasoning, { effort: "high", exclude: true });
      assert.equal(body?.max_tokens, 8192);
      assert.equal(body?.tools, undefined);
      assert.equal(body?.plugins, undefined);
      assert.equal(budget.snapshot().spentNanos, "2000000");
      assert.equal(budget.snapshot().reservedNanos, "0");
      assert.equal(calls, 2);
    },
  );
});

for (const [label, payload] of [
  ["unknown cost", { ...completion, usage: { ...completion.usage, cost: null } }],
  ["malformed JSON", "{broken"],
  ["HTTP failure", null],
] as const) {
  test(`stops on ${label}, retains its reservation, and does not retry`, async () => {
    const budget = createPilotBudget();
    let calls = 0;
    await withServer(
      (_request, response) => {
        calls += 1;
        if (payload === null) response.writeHead(429);
        response.end(typeof payload === "string" ? payload : JSON.stringify(payload));
      },
      async (baseUrl) => {
        const client = createOpenRouterClient({
          apiKey: "fixture-key",
          budget,
          baseUrl,
          persistBudget: async () => {},
        });
        await assert.rejects(client.complete(route, messages), OpenRouterError);
        assert.equal(budget.snapshot().reservedNanos, "356000000");
        assert.equal(budget.snapshot().halted, true);
        await assert.rejects(
          client.complete(route, messages),
          (error) => error instanceof OpenRouterError && error.reason === "budget",
        );
        assert.equal(calls, 1);
      },
    );
  });
}

test("timeout after response headers retains the reservation and makes one request", async () => {
  const budget = createPilotBudget();
  let calls = 0;
  await withServer(
    (_request, response) => {
      calls += 1;
      response.writeHead(200);
      response.flushHeaders();
    },
    async (baseUrl) => {
      const client = createOpenRouterClient({
        apiKey: "fixture-key",
        budget,
        baseUrl,
        timeoutMs: 50,
        persistBudget: async () => {},
      });
      await assert.rejects(
        client.complete(route, messages),
        (error) => error instanceof OpenRouterError && error.reason === "timeout",
      );
      assert.equal(calls, 1);
      assert.equal(budget.snapshot().reservedNanos, "356000000");
    },
  );
});

for (const [label, change] of [
  ["unexpected provider", { provider_name: "Azure" }],
  ["unexpected model", { model: "other/model" }],
  ["web fetch", { num_fetches: 1 }],
  ["web search without fetches", { num_fetches: 0, num_search_results: 1 }],
  ["inconsistent charge", { total_cost: 0.003 }],
] as const) {
  test(`stops on ${label} while retaining the known charge`, async () => {
    const budget = createPilotBudget();
    let calls = 0;
    await withServer(
      (request, response) => {
        calls += 1;
        response.end(
          JSON.stringify(
            request.method === "POST" ? completion : { data: { ...metadata.data, ...change } },
          ),
        );
      },
      async (baseUrl) => {
        const client = createOpenRouterClient({
          apiKey: "fixture-key",
          budget,
          baseUrl,
          persistBudget: async () => {},
        });
        await assert.rejects(
          client.complete(route, messages),
          (error) => error instanceof OpenRouterError && error.reason === "contract",
        );
        assert.equal(
          budget.snapshot().spentNanos,
          label === "inconsistent charge" ? "3000000" : "2000000",
        );
        assert.equal(budget.snapshot().reservedNanos, "0");
        await assert.rejects(client.complete(route, messages));
        assert.equal(calls, 2);
      },
    );
  });
}

test("metadata failure preserves the returned charge and does not retry the paid request", async () => {
  const budget = createPilotBudget();
  await withServer(
    (request, response) => {
      if (request.method === "POST") response.end(JSON.stringify(completion));
      else {
        response.writeHead(404);
        response.end("{}");
      }
    },
    async (baseUrl) => {
      const client = createOpenRouterClient({
        apiKey: "fixture-key",
        budget,
        baseUrl,
        persistBudget: async () => {},
      });
      await assert.rejects(
        client.complete(route, messages),
        (error) => error instanceof OpenRouterError && error.status === 404,
      );
      assert.equal(budget.snapshot().spentNanos, "2000000");
      assert.equal(budget.snapshot().halted, true);
    },
  );
});

test("empty length-limited content remains charged and cannot become a knowledge miss", async () => {
  const budget = createPilotBudget();
  await withServer(
    (request, response) =>
      response.end(
        JSON.stringify(
          request.method === "POST"
            ? { ...completion, choices: [{ finish_reason: "length", message: { content: null } }] }
            : metadata,
        ),
      ),
    async (baseUrl) => {
      const client = createOpenRouterClient({
        apiKey: "fixture-key",
        budget,
        baseUrl,
        persistBudget: async () => {},
      });
      const result = await client.complete(route, messages);
      assert.equal(result.content, null);
      assert.equal(result.finishReason, "length");
      assert.equal(result.costNanos, "2000000");
    },
  );
});

test("exhausted budget and failed journal persistence make no HTTP request", async () => {
  let calls = 0;
  await withServer(
    (_request, response) => {
      calls += 1;
      response.end("{}");
    },
    async (baseUrl) => {
      const budget = createPilotBudget({
        capNanos: "10000000000",
        spentNanos: "9999999999",
        reservedNanos: "0",
        halted: false,
      });
      const exhausted = createOpenRouterClient({
        apiKey: "fixture-key",
        budget,
        baseUrl,
        persistBudget: async () => {},
      });
      await assert.rejects(exhausted.complete(route, messages));
      const journal = createOpenRouterClient({
        apiKey: "fixture-key",
        budget: createPilotBudget(),
        baseUrl,
        persistBudget: async () => {
          throw new Error("Fixture persistence failure");
        },
      });
      await assert.rejects(
        journal.complete(route, messages),
        (error) => error instanceof OpenRouterError && error.reason === "journal",
      );
      assert.equal(calls, 0);
    },
  );
});
