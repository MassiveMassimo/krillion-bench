# OpenRouter preparation evidence

Verified on 2026-10-08. Task 5 is complete offline. Task 6 has a local runner but no paid result.

## Owner decisions and boundaries

The owner selected `openai/gpt-6-luna` and `openai/gpt-5-nano` at requested low and high. The pilot uses three shared questions, ordered answers on all three, and sequential answers on the first frozen question. The public roster and generation policy remain undecided. The [pilot specification](../specs/openrouter-pilot.md) records the exact slice, route, and cost assumptions.

The existing OpenAI subscription through VibeProxy remains available for development. Earlier shared-question tests produced 24 evaluation records. Preparing OpenRouter does not disable that route. The owner previously chose OpenRouter for standardized public results.

A fresh `GET http://127.0.0.1:8317/v1/models` returned HTTP 200 and listed all four development models: Astra, Sol, Terra, and Luna. This verifies the local route and model listing. It did not make another inference request.

Eight common Keychain service names and the current environment had no OpenRouter credential. The owner confirmed that a key still needs setup. No secret was read or printed. No credits were purchased, billing setting changed, inference request sent, or public result published in this slice. The initial US$10 cap remains unspent.

## Current provider evidence

Public GET requests returned supported low/high effort and standard OpenAI endpoint support for `reasoning`, `max_tokens`, and `response_format`. The implemented selector accepted both configurations for both models. The returned canonical slugs were `openai/gpt-6-luna-20260922` and `openai/gpt-5-nano-2025-08-07`. The saved live-run manifest will need fresh catalog data.

Luna's advertised full-capacity reservation is US$0.169 per call. Nano's is US$0.0712. Sixteen maximum calls per model give US$3.8432. This is not measured spending. Provider-only restrictions matter: other endpoints can advertise larger output capacities at the same prices.

The protocol reviewer found one no-search validation gap. Generation metadata can report search results separately from fetches. The adapter now rejects positive or invalid search counts, retains the known charge, and stops. Missing search counts remain `null`. The reviewer approved the correction after two targeted checks. No live inference was used for review.

## Offline checks

- All 76 tests passed, including 18 provider/budget tests and seven pilot-runner tests.
- TypeScript, Oxlint, and Oxfmt passed. Oxlint reported zero warnings and errors.
- React Doctor's error gate passed with 15 warnings: four performance findings, nine mixed-export findings, and two static-table mouse-handler findings. They remain visible.
- The exclusive journal test verified that a durable reservation survives closure and a second open fails. The runner tests verified fresh conversations, first acceptance, provisional corrections, malformed paid output, and no retries.
- The production UI build and desktop/mobile/keyboard checks passed before these server-only additions. UI behavior did not change in the provider slice. See [daily-view evidence](daily-view.md).

Actual provider acceptance, effective thinking settings, measured charges, final account reconciliation, and public results remain unverified. Native Safari, VoiceOver, physical touch, and 200% zoom also remain outside the recorded UI checks.

The active local preview retains one production build, about 42 MiB. Private development journals are about 100 KiB. Test directories were removed by their test cleanup. Temporary scanner directories were not retained. Installed dependencies are needed for the preview and quality tools.
