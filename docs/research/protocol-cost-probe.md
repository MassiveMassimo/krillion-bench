# Development protocol and thinking probe

8 October 2026. These are subscription-backed VibeProxy development results. They are excluded from official rankings. The US$10 OpenRouter pilot remains unspent.

## Method

Four models answered the same daily question: `2026-10-08`, `p1`, “Name a sports car brand”. Models received the same instruction to choose valid, obscure answers from internal knowledge. No search or tools were supplied. Sequential mode requested one candidate per generation. Ordered mode requested five candidates and stopped at first acceptance.

Both requested low effort first. A later matched sequential run requested high effort. All requests used `max_tokens: 4096`, no streaming, and a 90-second operational timeout. Requested model IDs matched returned IDs. The proxy's effective effort and token limits remain unverified. A later [source/configuration check](vibeproxy-controls.md) found effort forwarding and disabled token-limit translation. Token counts alone cannot confirm an effective effort level.

## Sequential versus ordered generation

Each cell shows reported output tokens / generation milliseconds. All eight results used one inference call and one game check. Each first candidate earned DeepCut, 85 points.

| Model           | Sequential · requested low | Ordered · requested low |
| --------------- | -------------------------: | ----------------------: |
| `gpt-6.1-sol`   |                 27 / 4,095 |              56 / 6,659 |
| `gpt-6-astra`   |                 30 / 5,327 |              53 / 6,598 |
| `gpt-5.6-terra` |                 35 / 3,148 |              65 / 4,268 |
| `gpt-6-luna`    |                 12 / 2,357 |              28 / 3,030 |

Sequential totals: 1,424 input and 104 output tokens; 14,927 milliseconds. Ordered totals: 1,468 input and 202 output tokens; 20,555 milliseconds. These are proxy counters and inference times, not billed USD or full game duration.

Sequential generation used fewer tokens for every model here. All first answers succeeded, so this did not measure repeated prompt, feedback, or retry costs. Do not select a universal cheapest policy from this sample.

## Requested thinking levels

Both runs below use sequential generation. Output totals already include reasoning tokens; do not add the reasoning column again. Every result earned 85 points on its first answer.

| Model           | Low output / reasoning / ms | High output / reasoning / ms |
| --------------- | --------------------------: | ---------------------------: |
| `gpt-6.1-sol`   |             27 / 13 / 4,095 |              66 / 53 / 7,779 |
| `gpt-6-astra`   |             30 / 16 / 5,327 |              37 / 22 / 4,902 |
| `gpt-5.6-terra` |             35 / 21 / 3,148 |              34 / 20 / 2,783 |
| `gpt-6-luna`    |              12 / 0 / 2,357 |              37 / 23 / 4,114 |

High totals: 1,424 input, 174 output, and 118 reasoning tokens; 19,578 milliseconds. Low totals: 1,424 input, 104 output, and 50 reasoning tokens; 14,927 milliseconds. Individual token use and latency did not always increase. There was one sample per setting, fixed run order, and no verified effective effort. These results do not establish a causal thinking benefit.

## Evidence and checks

Compact local records are `.local/protocol-cost-probe-2026-10-08.json` and `.local/thinking-cost-probe-2026-10-08.json`. They preserve prompts, answers, usage, latency, and verdicts. No hidden reasoning text or credentials are stored. One Sol endpoint preflight used 357 input and 27 output tokens; it is excluded from the comparisons. There were 13 model calls including preflight and 12 game checks in this slice.

The script preserves model IDs and finish reasons even for incomplete output. All 33 offline tests, TypeScript, Oxlint, and Oxfmt checks passed. Temporarily inverting the finish-reason condition caused three tests to fail; it was restored. A targeted independent review approved the metadata fix and thinking controls. See [thinking-level policy](thinking-levels.md) for the public pilot recommendation.

## Reproduce deliberately

These commands consume subscription usage and submit answers to the live daily game:

```sh
npm run probe:protocol -- --effort low --mode both
npm run probe:protocol -- --effort high --mode sequential
```

Do not rerun them merely to check formatting or tests. The next cost measurement needs representative questions and actual OpenRouter billing, within the same US$10 cap.
