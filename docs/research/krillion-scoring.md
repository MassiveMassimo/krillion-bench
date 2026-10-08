# Krillion Benchmark: Scoring Research

Research draft, 8 October 2026. Three agents independently examined scoring, measurement validity, and evaluation fairness. This document records intent, findings, and remaining proposals. It is not an implementation specification. The later [daily API calibration](krillion-api.md) added a headless client and five guest submissions. A [subscription-backed development probe](protocol-cost-probe.md) compared generation policies and requested thinking levels. No official OpenRouter evaluations have run.

## Agreed Intent and Constraints

- Publish a public GitHub repository and benchmark website.
- Test LLM knowledge through valid, obscure Krillion answers.
- Give tested models no web search or external knowledge tools.
- Allow up to five substantive answers per question and stop at first acceptance. Knowledge, rather than response speed, remains the target.
- One-at-a-time generation is conditional on verified untimed API access. If the timer remains enforced, investigate generating five ordered answers in one response and verify when the timer starts.
- Prefer the cheapest feasible generation policy. Measure sequential and ordered-list costs before selecting one public protocol. Fewer calls do not alone establish lower cost.
- Stop at the first accepted answer. Use mean native Krillion points as the main score.
- Treat a verified spelling or phrasing correction of the same intended answer as the same attempt.
- Allow genuine ties and show shared ranks.
- The owner controls official evaluations. Visitors inspect results rather than starting runs.
- Start with a small shared test set, then add each day's seven questions. Show overall rankings and daily model answers so players can compare their own answers.
- Use the existing OpenAI subscription through VibeProxy only for development tests with Astra, Sol, Terra, and Luna. Keep those runs outside the public leaderboard.
- Use OpenRouter for official public evaluations. Apply a shared question set, prompt, and attempt protocol. Record exact model IDs, provider routes, and supported inference settings; a common API alone does not establish fairness.
- The initial paid API budget is US$10 total for a pilot. Measure actual cost per model, question, and seven-question day to estimate affordable coverage before proposing an ongoing budget. Existing subscription allowances are separate; no recurring paid budget has been agreed.
- The frontend will use Next.js and Fluid Functionalism, with Oxlint, Oxfmt, React Doctor, and `@shadcn/lint`. This replaces the earlier TanStack Start choice.
- Local development tests will use the owner's Mac, which is mostly on. The official harness runtime and execution location, public hosting, scheduling, and publication setup remain undecided.

## Selected Development Tools

Use Oxlint for lint checks and Oxfmt for formatting. Use React Doctor for React diagnostics. Register `@shadcn/lint` through Oxlint's `jsPlugins`; a separate ESLint configuration is not required for this plugin. Its current [React setup](https://github.com/shadcn-ui/lint/blob/main/README.md#get-started) requires Node.js 20.19 or later and Oxlint 1.80 or later. Check requirements again when installing.

Follow the linked [setup instructions](https://github.com/shadcn-ui/lint/blob/main/SETUP.md): preserve existing rule policies and register the plugin without adding rule presets or enabling new rules. Registration alone does not enforce design rules. Choose those rules separately when the UI and theme exist.

The daily API adapter now uses TypeScript and Node.js 24, with verified test, type-check, lint, formatting, and CLI scripts. See `AGENTS.md` and [API evidence](krillion-api.md). The frontend is not implemented yet. For Next.js 16, lint checks need a separate command because `next lint` was removed and builds do not run lint automatically. See the [Next.js upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16#eslint).

## What Krillion Actually Measures

The live client defines these fixed points:

| Outcome           | Points |
| ----------------- | -----: |
| Miss              |      0 |
| Plankton          |     10 |
| Too Clever        |     15 |
| Schooler          |     30 |
| Rare              |     60 |
| Deep Cut          |     85 |
| One in a Krillion |    100 |

A daily dive has seven questions. Scores add to a maximum of 700. Depth is ten metres per point. Seven Rare answers always total 420 points. Different answers in the same tiers can therefore tie.

Sources: [live scoring constants](https://krillion.io/_next/static/chunks/37llm8wvcl-uo.js), [game instructions](https://krillion.io/). These deployment-specific JavaScript paths can change.

The [official FAQ](https://krillion.io/faq) adds three limits. Some rarity assignments use familiarity data; others use LLM assistance and manual review. The highest-tier answer also reflects appeal and can be less obscure than a Deep Cut. Valid answers can be absent from the accepted set. Native points therefore measure performance under curated game rules. They are not a calibrated estimate of factual accuracy or training-data frequency.

Unofficial guides disagree on point values and describe rarity as live player frequency. The official FAQ and live client take precedence. The client separately requests answer-popularity data; its existence does not establish a continuous rarity score for ranking models.

## Recommended Main Score

**Mean Krillion points per question**, on a 0–100 scale:

`mean score = total awarded points / total evaluated questions`

Include completed misses in the denominator. Compare models on the same questions and scoring version. Use shared ranks for exact ties. Do not use cost or speed as hidden tie-breakers.

Show companion measures:

- First-answer points and first-answer acceptance.
- Acceptance within five attempts.
- Tier distribution and miss rate.
- Attempts used, completed question count, time, and cost.

For complete results, mean points equal acceptance rate multiplied by mean points among accepted answers. For example, Rare answers on every question average 60. Deep Cuts on 70% of questions and misses on 30% average 59.5. Similar scores can reflect different strengths.

## Attempt Policies Considered

| Attempt policy                                | Claim it supports                                                           | Tradeoff                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Sequential attempts; stop at first acceptance | The model chooses an obscure valid answer, with recovery after rejection    | An invalid gamble permits another attempt; an accepted common answer ends the question |
| Five attempts; keep the highest score         | The model can produce at least one high-scoring answer within five attempts | The evaluator selects the winner; feedback can support score hunting                   |
| One ordered list of five; use first accepted  | The model chooses an answer and plans fallbacks                             | Fewer inference round trips, but no adaptive correction                                |
| One list of five; keep the highest score      | The model generates a useful set of candidates                              | Candidate breadth and evaluator selection replace choosing one answer                  |

All three agents recommended **sequential attempts, stopping at first acceptance**, for the main leaderboard. The user's latest clarification makes sequential generation conditional on verified untimed access and gives cost priority. It is not an unconditional protocol decision. An ordered list of five remains a candidate if the timer applies or measured costs favor it. Both policies stop at first acceptance; neither selects the highest-scoring accepted candidate.

Sequential generation can avoid generating unused fallbacks when the first answer succeeds. Ordered generation can avoid repeated prompts, conversation history, and reasoning on retry calls. Compare actual billed input, reasoning, and answer tokens on matched pilot questions. Select the cheapest feasible policy, record it, and apply it to every public model. Keep exploratory comparisons separate from leaderboard results. The [development probe](protocol-cost-probe.md) favored sequential tokens on one question, but exercised no retries and measured no billed USD.

Example: a model supplies an invalid answer, then an accepted Schooler answer, then could supply a Deep Cut. Stop-first awards 30 and ends the question. Best-of-five could award 85. Neither rule is universally superior; they answer different questions.

A five-candidate response is not five independent generations. Results from these policies should not share an unlabeled ranking. Use “acceptance within five attempts” for the interactive protocol; do not imply the standard independent-sampling meaning of pass@5. [HumanEval's sampling and selection discussion](https://arxiv.org/html/2107.03374v2) explains the distinction.

## Corrections and Fair Feedback

The [submission client](https://krillion.io/_next/static/chunks/3sal4x18nzbdb.js) handles a correction before acceptance or rejection. A suggested correction alone does not prove equivalent meaning.

- A verified name spelling variant preserves the answer and consumes no extra attempt.
- Austria to Australia changes the entity and cannot receive free correction credit.
- Log ambiguous corrections with the original answer and question for human review. Keep affected results provisional and apply reviewed equivalence rules consistently.

Do not give a suggested alternative to the tested model as a hidden answer hint. In sequential mode, give generic rejection feedback and prior submitted answers after a rejection. In ordered-list mode, advance to the next precommitted candidate. A confirmed equivalent form can be resubmitted by the evaluator without another model generation. Record raw and normalized answers. Log ambiguous corrections for review under either policy.

Use a fresh conversation for each question. Freeze the instruction to request one valid, obscure answer. Keep answer lists, other models' answers, and revealed tiers out of the answer-generation context. Declare inference settings, including reasoning level. Record model and provider identifiers, prompt version, scoring version, and evaluation date.

Treat model and thinking configurations as separate leaderboard entries. Compare matched questions and one generation policy. Record requested effort separately from confirmed effective settings. Supported levels differ by model; equal labels do not establish equal compute. The user confirmed this measurement dimension. See [thinking-level controls and pilot recommendation](thinking-levels.md).

Treat infrastructure failures as incomplete evaluations, rather than knowledge misses. Do not publish a favorable mean by dropping failed questions. A fixed operational timeout remains necessary even when the game timer does not affect scoring.

## Research Basis and Public Wording

[Kandpal et al., ICML 2023](https://proceedings.mlr.press/v202/kandpal23a.html) found that factual performance relates to relevant training-document frequency. This supports testing uncommon knowledge, but the study used older models and does not validate Krillion's tiers as training-frequency estimates.

[WikiProfile, ICML 2026](https://proceedings.mlr.press/v306/calderon26a.html) distinguishes encoded facts from accessible recall. It found that recall failures disproportionately affected long-tail facts, and thinking could help. Its results apply to its evaluated facts and models. A failure here cannot establish that a model lacks the knowledge.

Proposed public description:

> Can an LLM give an obscure but correct answer without looking it up? Krillion Bench compares models on shared Krillion questions, with a fixed attempt budget and no web search.

Explain that the main score uses Krillion's curated acceptance and rarity rules. Present “familiar answers may dominate ordinary generation” as motivation to test, rather than claiming that obscurity conflicts with an established LLM training philosophy.

## Useful Precedents and Pilot Checks

- [WordleBench](https://github.com/abronte/wordlebench#methodology) uses a shared test set. Its puzzle feedback cannot transfer unchanged because Krillion suggestions can disclose an answer.
- [SkateBench cases](https://github.com/T3-Content/skatebench/blob/main/bench/tests/skate-trick-test.json) distinguish synonyms from near-matches. Its [substring grader](https://github.com/T3-Content/skatebench/blob/main/bench/index.ts) is not sufficient for general semantic equivalence.
- [ChessBench](https://chessbenchllm.onrender.com/) reports legal-move rate, cost, sample count, and uncertainty beside its main ranking. Separate supporting metrics are useful here; opponent-rating machinery is unnecessary.

Before choosing the full evaluation size, use a small matched pilot across days and topics. Compare a neutral valid-answer prompt with the obscure-answer instruction. Check a few equivalent phrasings for sensitivity. These are proposed experiments, not completed validation.

Seven questions can demonstrate the site, but do not justify a broad claim of model superiority. Report sample size. If adding uncertainty intervals, preserve the paired question or day structure; repeated answers to the same question are not independent new knowledge tests. Keep production results separate from exploratory prompt trials.

## US$10 pilot cost probe

Start with one shared question across six model families. Compare sequential and ordered-list generation on a small matched subset within the same US$10 total allocation. Expand only after measuring billed usage and checking timer behavior. These probes are exploratory, not completed evaluations or final leaderboard settings.

The read-only [OpenRouter catalog](https://openrouter.ai/api/v1/models) returned these prices on 8 October 2026. Prices are US dollars per million tokens.

| Candidate model                                                           | Input | Output |
| ------------------------------------------------------------------------- | ----: | -----: |
| [Qwen3.8 Flash](https://openrouter.ai/qwen/qwen3.8-flash)                 |  0.15 |   0.47 |
| [DeepSeek V4.1 Flash](https://openrouter.ai/deepseek/deepseek-v4.1-flash) |  0.30 |   1.20 |
| [Mistral Large 4](https://openrouter.ai/mistralai/mistral-large-4-0)      |  0.68 |   2.09 |
| [Gemini 3.8 Flash](https://openrouter.ai/google/gemini-3.8-flash)         |  0.75 |   3.75 |
| [GPT-6.1 Sol](https://openrouter.ai/openai/gpt-6.1-sol)                   |  2.00 |  10.00 |
| [Claude Opus 5.5](https://openrouter.ai/anthropic/claude-opus-5.5)        |  4.00 |  20.00 |

For seven shared questions, an illustrative scenario costs about US$0.30 when all models succeed on the first answer, or US$2.13 when every question uses five attempts. These figures assume 600 initial input tokens, 1,024 billed output tokens per generation, 100 feedback tokens per retry, and replay of previous outputs. If every generation instead reaches 4,096 output tokens, the five-attempt scenario costs about US$7.86. These estimates exclude purchase fees and technical retries. They are not measured forecasts.

Reasoning tokens count toward billed output. A cap can exhaust itself before the model supplies an answer. Record finish reasons and treat such results as protocol truncations, not factual misses. A one-question initial probe with an 8,192-token output ceiling across all six models would cost about US$0.31 if all six first calls reached that ceiling. Neither ceiling guarantees a complete answer. See [reasoning and output caps](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens#reasoning-tokens-and-max_tokens).

The models expose different reasoning controls. Do not assume a shared effort label represents equal compute or is supported everywhere. Verify and publish each model's actual settings. Mistral also recommends replaying reasoning in conversation history. See [OpenRouter reasoning](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens) and [Mistral reasoning](https://docs.mistral.ai/studio/conversations/reasoning).

Keep total initial spending within US$10, including purchase fees and charged retries. Use a task-specific key limit without recurring resets or automatic top-ups. Reserve the estimated maximum cost before each call. Expand in complete shared question blocks and stop before the remaining budget cannot fund a block. Restrict provider prices and require supported parameters. See [credit limits](https://openrouter.ai/docs/api_reference/limits), [pricing](https://openrouter.ai/pricing), and [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection).

## Public release and open questions

Public wording and copyright are separate matters. No explicit permission to redistribute Krillion's source, assets, or question bank was found on the checked official home, FAQ, and privacy pages. This is a limited search, not a legal conclusion. Publicly readable code or API routes do not establish reuse permission. Own benchmark code, game materials, and any publication rights need separate treatment before release.

The daily adapter now retrieves seven question IDs and texts and submits ordinary daily answers without a browser. The submission body includes `date`, `promptId`, `answer`, `previewCorrection`, and `playerId`. A repeated answer was accepted after 6 minutes 28 seconds; a new candidate was accepted after 13 minutes 54 seconds. The browser answer window is 25 seconds. This supports untimed validation for the tested question and date. See [the calibration report](krillion-api.md) for exact evidence and limits. Historical and all-question behavior remain unverified.

The [archive client](https://krillion.io/_next/static/chunks/2yu3js9mdwqh4.js) constructs `/api/archive/{day}` and `/api/archive/{day}/submit`. It attaches a purchase unlock token and handles HTTP 402 as locked. Historical routes therefore exist, but free historical access is not established. Do not assume a new model can replay all past questions without an approved access path. No archive question endpoint was called.

The [privacy policy](https://krillion.io/privacy) describes IP rate limits against scripted abuse. It also distinguishes guest daily checks from completion records and stored practice answers. A supported benchmark integration could define request limits and keep model runs outside player statistics. No documented evaluation API or explicit content reuse grant was found in the inspected pages. The [FAQ](https://krillion.io/faq) lists `support@krillion.io` for contact. Creator contact is a recommendation, not an authorized action. Five daily calibration answers were submitted; no archive, reveal, or completion endpoint was called.

Remaining decisions and feasibility checks: timer behavior and the cheapest feasible generation policy; initial test-set size and public model selection; historical coverage when new models join; correction and failure rules; inference-setting parity; daily publication; data reuse permission; harness runtime and hosting. The US$10 pilot will inform a later decision about ongoing spending. The frontend choice is Next.js with Fluid Functionalism and the tools listed above. Overall and daily views are confirmed, while an explicit spoiler-reveal control remains a proposal.

Research used agent-reach discovery and native web verification. One agent reached Exa's free search limit and continued with GitHub discovery and primary web sources. No empirical leaderboard results were produced.
