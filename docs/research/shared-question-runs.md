# Shared-question development runs

8 October 2026. Task 2 implements reproducible question records and local run journals. This is private subscription-backed evidence. No OpenRouter call or paid spending occurred.

## Frozen sample

Both runs used the same date and copied questions, selected before inference:

- `p1`: Name a sports car brand.
- `p2`: Name something that uses a filter (physical filters, not photo filters).
- `p3`: Name a part of a shirt.

Four models ran sequential generation at requested low, then requested high effort. Each question began with a fresh conversation. All requests used the same instruction and requested 4,096-token output ceiling. Effective effort and enforced ceiling remain unknown on this proxy. This is a deterministic smoke sample, not representative coverage.

## Saved results

Cells show native points / model calls. “Review” is an unresolved correction, not a completed zero. Both runs finished all 12 planned evaluation records.

| Model           | Question | Requested low | Requested high |
| --------------- | -------- | ------------: | -------------: |
| `gpt-6.1-sol`   | p1       |        85 / 1 |         85 / 1 |
| `gpt-6.1-sol`   | p2       |    Review / 3 |         60 / 3 |
| `gpt-6.1-sol`   | p3       |        85 / 1 |         85 / 1 |
| `gpt-6-astra`   | p1       |        85 / 1 |         85 / 1 |
| `gpt-6-astra`   | p2       |        85 / 4 |         85 / 2 |
| `gpt-6-astra`   | p3       |        85 / 1 |     Review / 1 |
| `gpt-5.6-terra` | p1       |        85 / 1 |         85 / 1 |
| `gpt-5.6-terra` | p2       |    Review / 3 |         60 / 4 |
| `gpt-5.6-terra` | p3       |        60 / 1 |     Review / 1 |
| `gpt-6-luna`    | p1       |        60 / 1 |         85 / 1 |
| `gpt-6-luna`    | p2       |        10 / 1 |         85 / 1 |
| `gpt-6-luna`    | p3       |        85 / 1 |     Review / 1 |

| Reported measure                    |     Low |    High |
| ----------------------------------- | ------: | ------: |
| Model calls                         |      19 |      18 |
| Input tokens                        |   7,329 |   6,880 |
| Output tokens, including reasoning  |     874 |   1,432 |
| Reasoning tokens, already in output |     594 |   1,156 |
| Sum of generation milliseconds      | 112,112 | 130,196 |
| Accepted records                    |      10 |       9 |
| Provisional correction records      |       2 |       3 |

All 24 record scores reproduce from saved verdicts, including unknown scores. Do not compare means by dropping the five provisional records. One sample per setting, fixed order, unverified proxy controls, and native acceptance limits prevent a causal thinking conclusion or official ranking. USD cost is unknown for these subscription calls; the separate US$10 OpenRouter pilot remains unspent.

## Correction review queue

This table records the original pending state. A later [append-only continuation](correction-continuation.md) resolved all five records without rewriting these journals. The local development view now shows 24 final scores.

The runner preserves these pairs without treating suggestions as free hints:

| Model and requested effort | Question | Submitted answer       | Game suggestion  |
| -------------------------- | -------- | ---------------------- | ---------------- |
| Sol · low                  | p2       | A sandblasting cabinet | Sandblaster      |
| Terra · low                | p2       | vacuum belt filter     | Dewatering plant |
| Astra · high               | p3       | Gauntlet placket       | Sleeve placket   |
| Terra · high               | p3       | armscye                | Armhole          |
| Luna · high                | p3       | gauntlet               | Sleeve placket   |

Some pairs may be equivalent; others may broaden or change the entity. They remain provisional pending verified equivalence and a canonical submission within the same substantive attempt. Preserve the original evidence when applying a later review. Game rejection alone does not establish factual falsehood. These outcomes measure Krillion's acceptance and rarity rules.

## Record contract and verification

`src/evaluation/records.ts` owns copied question selection, first-acceptance rules, five-attempt limits, incomplete outcomes, and score derivation. The CLI handles HTTP and filesystem effects. `--prompt-ids` rejects duplicate, empty, or unknown IDs before model calls.

Each `.local/runs/` journal uses a unique filename, schema version 1, and protocol `development-v2`. Setup freezes questions, models, prompts, settings, and expected coverage. Request events precede dispatch. Normalized generation, verdict, and result events preserve answers, counters, and finish reasons. Raw responses and hidden reasoning are omitted. A missing end event indicates an unfinished run; there is no automatic resume or retry.

The low journal is `e0dfe205-51ad-44c6-8ded-c9db904b4148.jsonl` (41,028 bytes). The high journal is `04cf25c4-3eb2-42ee-a856-59b9db07598c.jsonl` (38,786 bytes). Both are ignored local evidence. Temporary offline test journals are removed by test cleanup. Existing development tools remain for active work.

All 47 offline tests, TypeScript, Oxlint, and Oxfmt checks passed. Red tests preceded implementation. Temporarily reducing the attempt limit to four caused the five-rejection test to fail; the limit was restored. Independent review approved the slice. The next checkpoint builds the approved Next.js shell with synthetic data.

## Deliberate live commands

These commands consume subscription usage and make live game submissions:

```sh
npm run probe:protocol -- --effort low --mode sequential --prompt-ids p1,p2,p3
npm run probe:protocol -- --effort high --mode sequential --prompt-ids p1,p2,p3
```

Use offline checks for code validation. Do not repeat these live runs solely to check formatting.
