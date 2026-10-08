# OpenRouter versus Vercel AI Gateway

Research date: 8 October 2026.

Status: Research recommendation. This note supports the existing OpenRouter selection. It does not approve a service change, purchase, deployment, or recurring budget.

## Scope and evidence

KrillionBench compares broad world knowledge without web search. Official evaluations use shared questions and one declared answer protocol. Subscription-backed models through VibeProxy remain development tests. The initial paid pilot has a US$10 total cap.

This comparison used official documentation through Context7, native web search, repository discovery through agent-reach, public model and endpoint APIs, and Vercel's active free-tier model filter. No paid inference or checkout occurred. Prices, eligibility, and capabilities below are a dated snapshot. Refresh them before funding a run.

## Recommendation

Keep OpenRouter for the first public pilot. Its endpoint selection and explicit quantization filters help document which serving configuration produced a score. Both gateways support the proposed models and controlled provider routing.

Vercel AI Gateway is a credible alternative. It has no token markup and may reduce funding fees. Consider switching if the selected endpoints provide the required settings and evidence at a materially lower verified cost. The current free-credit allowance does not fund the proposed six-model comparison.

## Fees and model coverage

OpenRouter charges 5.5% on credit purchases, with a US$0.80 minimum. It passes through provider inference prices without markup. The minimum fee consumes 8% of a US$10 cash budget before tax. Confirm the total charge at checkout. Sources: [pricing](https://openrouter.ai/pricing), [official fee explanation](https://openrouter.ai/blog/insights/openrouter-vs-portkey/).

Vercel has no token markup, but payment processing fees may apply. Its US$5 monthly allowance covers a restricted model set. Purchasing credits ends that monthly allowance. Do not budget for US$10 paid credits plus US$5 free credits. Source: [Vercel pricing](https://vercel.com/docs/ai-gateway/pricing).

Both live catalogs contained the six proposed models. Their model-level input and output rates matched. This shortlist is research context, not a final approved model set.

| Model               | OpenRouter ID                  | Vercel ID                      | Input per million tokens | Output per million tokens |
| ------------------- | ------------------------------ | ------------------------------ | -----------------------: | ------------------------: |
| GPT-6.1 Sol         | `openai/gpt-6.1-sol`           | `openai/gpt-6.1-sol`           |                    $2.00 |                    $10.00 |
| Claude Opus 5.5     | `anthropic/claude-opus-5.5`    | `anthropic/claude-opus-5.5`    |                    $4.00 |                    $20.00 |
| Gemini 3.8 Flash    | `google/gemini-3.8-flash`      | `google/gemini-3.8-flash`      |                    $0.75 |                     $3.75 |
| DeepSeek V4.1 Flash | `deepseek/deepseek-v4.1-flash` | `deepseek/deepseek-v4.1-flash` |                    $0.30 |                     $1.20 |
| Qwen3.8 Flash       | `qwen/qwen3.8-flash`           | `alibaba/qwen3.8-flash`        |                    $0.15 |                     $0.47 |
| Mistral Large 4     | `mistralai/mistral-large-4-0`  | `mistral/mistral-large-4`      |                    $0.68 |                     $2.09 |

Sources: [OpenRouter catalog](https://openrouter.ai/api/v1/models), [Vercel catalog](https://ai-gateway.vercel.sh/v1/models).

These rates do not describe every provider endpoint. Both gateways listed DeepInfra's DeepSeek route at $0.14 input and $0.42 output per million tokens. Other routes had different prices, precision, or time-based pricing. Compare the selected endpoints and record actual charges. Sources: [OpenRouter DeepSeek endpoints](https://openrouter.ai/api/v1/models/deepseek/deepseek-v4.1-flash/endpoints), [Vercel DeepSeek endpoints](https://ai-gateway.vercel.sh/v1/models/deepseek/deepseek-v4.1-flash/endpoints).

Vercel's active free-tier filter listed none of these six models. Static page output did not reliably reflect the filter; the hydrated browser page supplied this evidence. Source: [eligible free-credit models](https://vercel.com/ai-gateway/models?freeTier=true).

## Provider routes and reproducibility

The same model ID can reach different providers. A provider can change precision, supported settings, or serving configuration.

| Control                     | OpenRouter                                                | Vercel AI Gateway                                  |
| --------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| Restrict providers          | `provider.only`                                           | `providerOptions.gateway.only`                     |
| Set provider preference     | `provider.order`                                          | `providerOptions.gateway.order`                    |
| Prevent switching providers | Restrict eligible routes and set `allow_fallbacks: false` | Restrict `only` to one provider                    |
| Filter precision            | Explicit `quantizations` filter                           | Endpoint metadata exposes some quantization values |

An ordering preference alone does not pin a route. Do not configure model fallbacks for a public evaluation. Treat route failures as incomplete evaluations. Do not count them as knowledge misses.

Prefer the model developer's endpoint where practical. Document third-party endpoints and their precision. A fixed provider alone does not guarantee an immutable model version. Save the model and endpoint identifiers returned by the service.

Sources: [OpenRouter routing](https://openrouter.ai/docs/guides/routing/provider-selection), [Vercel routing](https://vercel.com/docs/ai-gateway/models-and-providers/provider-filtering-and-ordering).

## Inference settings

Catalog capability lists differ. Vercel advertised `temperature` for GPT-6.1 Sol; OpenRouter did not. A catalog entry does not prove that the upstream model applies a setting. Verify the selected endpoint with a small request before a public run.

OpenRouter documents a limitation in `require_parameters`. If none of a model's providers supports a parameter, the request can still reach that model and ignore the parameter. The flag filters providers; it does not guarantee that every requested setting takes effect. Source: [parameter filtering](https://openrouter.ai/docs/guides/routing/provider-selection).

Check endpoint capabilities before each evaluation batch. Record requested and verified effective settings separately. Declare reasoning settings for each model family. The label `medium` does not establish equal reasoning compute across families. Keep question selection, prompts, answer limits, correction rules, and stopping rules consistent. Disable web-search tools explicitly.

## Result evidence

Both gateways offer generation lookup with model, provider, token usage, cost, and finish information. Vercel also exposes routing attempts. Its usage records arrive asynchronously, so lookup can require a short retry. Sources: [OpenRouter generation records](https://openrouter.ai/docs/api/api-reference/generations/get-generation), [Vercel generation records](https://vercel.com/docs/ai-gateway/observability-and-spend/usage).

The runner must save question IDs, exact prompts, ordered answers, correction handling, game responses, scores, generation IDs, provider routes, settings, token usage, and methodology versions. Gateway dashboards do not replace this benchmark record. Vercel's paid Custom Reporting is unnecessary for the initial pilot.

## Budget and protocol costs

Both gateways provide spend controls. The runner also needs its own cost reservations, bounded retries, and a stop threshold below the remaining balance. Include funding fees and applicable tax in the US$10 total cap. Do not enable recurring replenishment.

Vercel documents a possible one- to two-minute delay before a new API key budget becomes active. OpenRouter estimates cost for requests in progress, then settles actual usage. Neither behavior substitutes for a local spending limit. Sources: [Vercel budgets](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets), [OpenRouter limits](https://openrouter.ai/docs/api/reference/limits).

The following calculations use the six catalog rates above and seven shared questions. They are scenarios, not measured benchmark costs.

| Assumed workload                                                 | Inference cost |
| ---------------------------------------------------------------- | -------------: |
| One call per question; 600 input and 1,024 output tokens         |          $0.30 |
| Five sequential calls per question; 1,024 output tokens per call |          $2.13 |
| Five sequential calls per question; 4,096 output tokens per call |          $7.86 |

For each sequential scenario, assume 600 initial input tokens, 100 new feedback tokens per retry, and replay of all previous output. With output length `O`, total input per question is `5 * 600 + 10 * (O + 100)`. Total output is `5 * O`. Count billable reasoning tokens in output. Actual replay requirements vary by model.

The estimates exclude funding fees, taxes, cache discounts, endpoint discounts, and paid failures. They assume every call reaches the stated output length. Reasoning use and the answer protocol can change cost more than the gateway fee.

An ordered list can save round trips but generate unused answers. Sequential generation can stop after the first acceptance but adds repeated input. Measure both before selecting one public protocol.

## Hosting and remaining checks

Vercel AI Gateway accepts API-key requests from local development, CI, and other clouds. It does not require Vercel hosting. Next.js does not determine the gateway choice. Source: [Vercel FAQ](https://vercel.com/docs/ai-gateway/faq).

Neither gateway removes Krillion's timer. That depends on the game adapter. This research did not measure gateway latency or establish that either service is faster.

Before funding the public pilot:

1. Confirm the final model set and refresh endpoint prices and capabilities.
2. Verify purchase minimums, processing fees, tax, and the total cash charge.
3. Use a small part of the shared US$10 cap to check settings, generation metadata, reasoning usage, and route behavior.
4. Measure sequential and ordered-answer costs. Select one declared protocol for all public runs.
5. Verify the spending stop condition before expanding question coverage.

Do not fund both gateways merely to compare their dashboards. The pilot should measure the benchmark protocol first.
