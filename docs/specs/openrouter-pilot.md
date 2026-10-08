# Bounded OpenRouter pilot

Status: offline provider and owner-run CLI implemented. The owner selected GPT-6 Luna and GPT-5 Nano on 2026-10-08. No paid request has run. This slice measures protocol cost within the initial US$10 cap. It is not the public leaderboard roster.

## Selected first slice

Use `openai/gpt-6-luna` and `openai/gpt-5-nano`, each at requested low and high effort. Freeze three shared question IDs before dispatch. Run ordered answers on all three questions. Compare sequential answers on the first frozen question. Each sequential evaluation can make five model calls; an ordered evaluation makes one. This gives at most 16 calls per model, 32 total.

Request 8,192 combined output tokens, including reasoning. Keep the same system prompt, question text, answer JSON format, route, and ceiling for paired conditions. This measures protocol cost and completion behavior. Three questions do not support a general model ranking. Requested effort labels do not establish equal reasoning budgets across models. Effective effort remains unverified unless the provider gives explicit evidence.

The current [model catalog](https://openrouter.ai/api/v1/models) lists low and high for both proposed models. The [Luna endpoints](https://openrouter.ai/api/v1/models/openai/gpt-6-luna/endpoints) and [Nano endpoints](https://openrouter.ai/api/v1/models/openai/gpt-5-nano/endpoints) list the standard OpenAI route with `reasoning`, `max_tokens`, and `response_format`. Re-fetch and save catalog responses before freezing a run. These observations were made on 2026-10-08.

## Cost bound

Prices below are USD per million tokens. The reserve uses the full advertised input context and output capacity. It does not use a rough prompt estimate or assume that the requested ceiling is a strict billing bound.

| Model      | Input price | Output price | Input capacity | Output capacity | Reserve per call | Maximum slice reserve |
| ---------- | ----------: | -----------: | -------------: | --------------: | ---------------: | --------------------: |
| GPT-6 Luna |       $0.10 |        $0.50 |      1,050,000 |         128,000 |          $0.1690 |               $2.7040 |
| GPT-5 Nano |       $0.05 |        $0.40 |        400,000 |         128,000 |          $0.0712 |               $1.1392 |
| Total      |             |              |                |                 |                  |           **$3.8432** |

This is a conservative reservation at current listed prices, not measured spending. GPT-5 Mini plus Nano is an alternative with the same 32-call plan and a $6.8352 reservation. Adding GPT-6.1 Sol increases capacity-based reservations substantially. A broader vendor roster also needs model-specific control checks. Start with the cheaper protocol slice, then use measured charges to recommend broader coverage.

## Routing and accounting

`selectPilotRoute` validates external catalog data and freezes the standard OpenAI endpoint. Requests use `only` and `order` set to `openai`, `allow_fallbacks: false`, and `require_parameters: true`. `max_price` limits prompt and completion rates and sets the allowed request fee to zero. Tools, web plugins, model fallbacks, and streaming are not enabled. [Routing documentation](https://openrouter.ai/docs/guides/routing/provider-selection) defines these fields. A price limit alone does not restrict endpoint capacity. Azure's current Mini and Nano endpoints have larger output capacities and are excluded.

One shared budget object covers every model, effort, policy, and question. Amounts use integer nanodollars, rounded up. Reserve before dispatch. The client requires a persistence callback before sending the request. Reconcile a charge once against `usage.cost`. Reasoning tokens are a subset of completion tokens and are not charged a second time. [Reasoning documentation](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens) explains combined output limits.

Read generation metadata once to verify actual model, provider, charge, and zero reported web fetches. Reject positive reported search results separately. Preserve missing search metadata as unknown; it does not prove zero searches. Save requested and actual model identities. A missing cost, HTTP error, timeout, malformed response, metadata mismatch, or persistence failure stops the pilot. Unknown charges keep their reservations. Known charges stay counted even if output or provenance is invalid. If reported charges conflict, count the larger charge and stop. No failed paid request is retried. [Generation metadata](https://openrouter.ai/docs/api/api-reference/generations/get-request-&-usage-metadata-for-a-generation) defines the evidence fields.

## Before a paid run

The CLI uses an exclusively created, fixed journal at `.local/runs/openrouter-pilot.jsonl`. Each budget change is flushed to disk before dispatch. A second invocation cannot create a fresh allowance while this journal exists. The budget API also restores unresolved reservations as halted. Preserve request settings, returned output, usage, charges, route evidence, and final evaluations. A length-limited or malformed answer is incomplete, not a knowledge miss. The CLI stops at the first incomplete evaluation. It leaves correction cases provisional.

`npm run pilot -- prepare` fetches public catalogs and today's questions. It freezes the first three question IDs by default. Add `--prompt-ids ID,ID,ID` to choose a different shared set before preparation. This command makes no inference request. It saves an exclusive private manifest at `.local/runs/openrouter-pilot-plan.json`. `npm run pilot -- run` revalidates that manifest against fresh questions and routes before dispatch.

The paid command checks Keychain first, then the process environment. `OPENROUTER_KEYCHAIN_SERVICE` names a nonstandard Keychain service; it is not the key value. An existing account must have enough credits for the full slice reserve. The runner does not buy credits or change billing controls. Final reconciliation with account usage remains part of live pilot verification. Context7 did not return the requested credits schema; the [official credits API](https://openrouter.ai/docs/api/api-reference/credits/get-credits) supplied `total_credits` and `total_usage`.

Eight common Keychain services and the current environment had no credential. The owner confirmed that an OpenRouter key still needs setup. This blocks paid execution only. The existing subscription route remains available for development tests. No recurring budget, public release, or funding purchase follows from this pilot.

## Offline verification

Local HTTP fixtures verify route restrictions, request fields, catalog validation, one-time charge accounting, reasoning token handling, unknown charges, timeout, metadata failures, budget exhaustion, and persistence failure. Budget tests cover rounding, shared limits, duplicate settlement, saved reservations, and charges above reservations. These checks do not prove live provider acceptance or effective thinking settings.
