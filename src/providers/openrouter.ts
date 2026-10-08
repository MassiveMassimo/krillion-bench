import { createPilotBudget, usdToNanos, type BudgetSnapshot } from "../evaluation/budget.ts";
import type { Effort, Message, Usage } from "../evaluation/records.ts";

export class OpenRouterError extends Error {
  reason: "http" | "timeout" | "network" | "contract" | "budget" | "journal";
  status?: number;

  constructor(reason: OpenRouterError["reason"], status?: number) {
    super(`OpenRouter ${reason} failure`);
    this.name = "OpenRouterError";
    this.reason = reason;
    this.status = status;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireShape(condition: unknown): asserts condition {
  if (!condition) throw new OpenRouterError("contract");
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function tokenCount(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  requireShape(typeof value === "number" && Number.isSafeInteger(value) && value >= 0);
  return value;
}

export type PilotRoute = Readonly<{
  model: string;
  canonicalSlug: string;
  requestedEffort: Effort;
  providerTag: "openai";
  providerName: "OpenAI";
  contextLength: number;
  outputCapacity: number;
  maxTokens: number;
  inputPrice: string;
  outputPrice: string;
}>;

/** Select the standard OpenAI endpoint from fresh public catalog responses. */
export function selectPilotRoute(input: {
  models: unknown;
  endpoints: unknown;
  model: string;
  effort: Effort;
  maxTokens?: number;
}): PilotRoute {
  requireShape(record(input.models) && Array.isArray(input.models.data));
  const model = input.models.data.find((value) => record(value) && value.id === input.model);
  requireShape(record(model) && typeof model.canonical_slug === "string");
  requireShape(record(model.reasoning) && Array.isArray(model.reasoning.supported_efforts));
  requireShape(model.reasoning.supported_efforts.includes(input.effort));
  requireShape(record(input.endpoints) && record(input.endpoints.data));
  requireShape(
    input.endpoints.data.id === input.model && Array.isArray(input.endpoints.data.endpoints),
  );
  const endpoint = input.endpoints.data.endpoints.find(
    (value) => record(value) && value.tag === "openai",
  );
  requireShape(record(endpoint) && endpoint.provider_name === "OpenAI" && endpoint.status === 0);
  const parameters = endpoint.supported_parameters;
  requireShape(Array.isArray(parameters));
  requireShape(
    ["max_tokens", "reasoning", "response_format"].every((parameter) =>
      parameters.includes(parameter),
    ),
  );
  requireShape(
    positiveInteger(endpoint.context_length) && positiveInteger(endpoint.max_completion_tokens),
  );
  requireShape(record(endpoint.pricing));
  const { prompt, completion, request } = endpoint.pricing;
  requireShape(typeof prompt === "string" && typeof completion === "string");
  requireShape(
    request === undefined || (typeof request === "string" && usdToNanos(request) === 0n),
  );
  requireShape(usdToNanos(prompt) > 0n && usdToNanos(completion) > 0n);
  const maxTokens = input.maxTokens ?? 8192;
  requireShape(positiveInteger(maxTokens) && maxTokens <= endpoint.max_completion_tokens);
  return Object.freeze({
    model: input.model,
    canonicalSlug: model.canonical_slug,
    requestedEffort: input.effort,
    providerTag: "openai",
    providerName: "OpenAI",
    contextLength: endpoint.context_length,
    outputCapacity: endpoint.max_completion_tokens,
    maxTokens,
    inputPrice: prompt,
    outputPrice: completion,
  });
}

/** Full endpoint capacities bound the reserve; requested output is not the bound. */
export function maximumCallCost(route: PilotRoute): bigint {
  return (
    BigInt(route.contextLength) * usdToNanos(route.inputPrice) +
    BigInt(route.outputCapacity) * usdToNanos(route.outputPrice)
  );
}

export type OpenRouterCompletion = {
  id: string;
  requestedModel: string;
  actualModel: string;
  providerName: string;
  reportedSearchResults: number | null;
  requestedEffort: Effort;
  effectiveEffort: null;
  content: string | null;
  finishReason: string | null;
  usage: Usage;
  costNanos: string;
};

export function createOpenRouterClient(input: {
  apiKey: string;
  budget: ReturnType<typeof createPilotBudget>;
  persistBudget: (snapshot: BudgetSnapshot) => Promise<void>;
  baseUrl?: string;
  timeoutMs?: number;
}) {
  const baseUrl = input.baseUrl ?? "https://openrouter.ai/api/v1/";
  async function request(path: string, body?: unknown): Promise<unknown> {
    try {
      const response = await fetch(new URL(path, baseUrl), {
        method: body ? "POST" : "GET",
        headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        redirect: "error",
        signal: AbortSignal.timeout(input.timeoutMs ?? 120_000),
      });
      if (!response.ok) throw new OpenRouterError("http", response.status);
      return await response.json();
    } catch (error) {
      if (error instanceof OpenRouterError) throw error;
      throw new OpenRouterError(
        error instanceof SyntaxError
          ? "contract"
          : error instanceof Error && error.name === "TimeoutError"
            ? "timeout"
            : "network",
      );
    }
  }

  async function persist() {
    try {
      await input.persistBudget(input.budget.snapshot());
    } catch {
      throw new OpenRouterError("journal");
    }
  }

  return {
    async complete(route: PilotRoute, messages: Message[]): Promise<OpenRouterCompletion> {
      requireShape(
        messages.length > 0 &&
          messages.every(
            (message) =>
              ["system", "user", "assistant"].includes(message.role) &&
              typeof message.content === "string" &&
              message.content.length > 0,
          ),
      );
      try {
        input.budget.reserve(maximumCallCost(route));
      } catch {
        throw new OpenRouterError("budget");
      }
      let knownCharge: bigint | null = null;
      try {
        await persist();
        const response = await request("chat/completions", {
          model: route.model,
          messages,
          stream: false,
          max_tokens: route.maxTokens,
          reasoning: { effort: route.requestedEffort, exclude: true },
          response_format: { type: "json_object" },
          provider: {
            only: [route.providerTag],
            order: [route.providerTag],
            allow_fallbacks: false,
            require_parameters: true,
            max_price: {
              prompt: Number(route.inputPrice) * 1_000_000,
              completion: Number(route.outputPrice) * 1_000_000,
              request: 0,
            },
          },
        });
        requireShape(record(response) && record(response.usage));
        requireShape(
          typeof response.usage.cost === "number" &&
            Number.isFinite(response.usage.cost) &&
            response.usage.cost >= 0 &&
            response.usage.is_byok !== true,
        );
        const cost = usdToNanos(response.usage.cost);
        knownCharge = cost;
        requireShape(typeof response.id === "string" && /^gen-[\w-]+$/.test(response.id));
        requireShape(typeof response.model === "string");
        requireShape(Array.isArray(response.choices) && response.choices.length === 1);
        const choice = response.choices[0];
        requireShape(record(choice) && record(choice.message) && choice.error === undefined);
        requireShape(
          choice.message.tool_calls === undefined ||
            (Array.isArray(choice.message.tool_calls) && choice.message.tool_calls.length === 0),
        );
        requireShape(choice.message.content === null || typeof choice.message.content === "string");
        requireShape(choice.finish_reason === null || typeof choice.finish_reason === "string");
        const metadata = await request(`generation?id=${encodeURIComponent(response.id)}`);
        requireShape(record(metadata) && record(metadata.data));
        const actual = metadata.data;
        requireShape(
          typeof actual.total_cost === "number" &&
            Number.isFinite(actual.total_cost) &&
            actual.total_cost >= 0,
        );
        const metadataCost = usdToNanos(actual.total_cost);
        knownCharge = metadataCost > cost ? metadataCost : cost;
        input.budget.reconcile(knownCharge);
        await persist();
        requireShape(actual.id === response.id && actual.provider_name === route.providerName);
        requireShape(actual.model === route.model || actual.model === route.canonicalSlug);
        requireShape(response.model === actual.model);
        requireShape(metadataCost === cost);
        requireShape(actual.num_fetches === 0);
        const searchResults = tokenCount(actual.num_search_results);
        requireShape(searchResults === null || searchResults === 0);
        const usage = response.usage;
        const outputTokens = tokenCount(usage.completion_tokens);
        const reasoningTokens = record(usage.completion_tokens_details)
          ? tokenCount(usage.completion_tokens_details.reasoning_tokens)
          : null;
        requireShape(
          outputTokens !== null && (reasoningTokens === null || reasoningTokens <= outputTokens),
        );
        const inputTokens = tokenCount(usage.prompt_tokens);
        requireShape(inputTokens !== null);
        return {
          id: response.id,
          requestedModel: route.model,
          actualModel: actual.model,
          providerName: actual.provider_name,
          reportedSearchResults: searchResults,
          requestedEffort: route.requestedEffort,
          effectiveEffort: null,
          content: choice.message.content,
          finishReason: choice.finish_reason,
          usage: {
            inputTokens,
            outputTokens,
            reasoningTokens,
            cachedInputTokens: record(usage.prompt_tokens_details)
              ? tokenCount(usage.prompt_tokens_details.cached_tokens)
              : null,
          },
          costNanos: String(cost),
        };
      } catch (error) {
        if (knownCharge !== null && input.budget.snapshot().reservedNanos !== "0") {
          try {
            input.budget.reconcile(knownCharge);
          } catch {
            /* Reconciliation records the charge before stopping. */
          }
        }
        input.budget.halt();
        try {
          await persist();
        } catch {
          /* Preserve the first failure; no further call is permitted. */
        }
        if (error instanceof OpenRouterError) throw error;
        throw new OpenRouterError("budget");
      }
    },
  };
}
