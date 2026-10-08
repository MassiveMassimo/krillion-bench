# Development protocol cost probe

## Objective

Compare generation policies and requested thinking levels through the existing local VibeProxy. The original one-question comparison is complete. Task 2 extends the runner to a frozen small shared selection. Use subscription-backed Astra, Sol, Terra, and Luna. These are exploratory development results, not official leaderboard runs. OpenRouter spending remains zero in this slice.

## Scope and assumptions

Use the local OpenAI-compatible chat endpoint at `http://127.0.0.1:8317/v1/chat/completions`. First verify one successful generation. Request no tools or web search. Record requested settings, actual response model IDs, token usage, latency, and finish reasons. Do not assume the proxy honors every requested setting or that subscription usage directly predicts OpenRouter billing.

Use the same Krillion date, prompt ID, and question text in both modes. Sequential mode requests one answer per generation with at most five substantive answers. Ordered mode requests five candidates in one response and tests them in order. Both stop at first acceptance. Generic rejection feedback contains no suggested answers or tiers. Ambiguous corrections produce a provisional result for review, rather than a factual miss or automatic acceptance.

## Implementation and verification

Add one development probe script with strict response parsing and bounded requests. Use existing Node.js tools and the daily API client. No runtime dependency, public model runner, frontend, scheduling, or deployment is needed.

Test malformed model output and usage parsing offline before running the comparison. Run the existing test, type-check, lint, and formatting commands. The live comparison permits up to eight initial model calls, plus sequential retries within the five-answer limit. Stop on access or rate-limit errors. Never retry an unknown model-call outcome automatically.

## Success criteria

Save a compact local report with each model's two outcomes, inference calls, input and output tokens, reasoning tokens when available, and generation latency. Preserve prompt text and settings. Missing usage stays unknown. Treat truncation and infrastructure failure as incomplete. Do not choose a universal cheapest policy from one question or from proxy estimates alone.

## Next step

Thinking level is a benchmark dimension. Hold prompts, attempt rules, and requested output ceiling constant in matched comparisons. Record requested effort separately from verified effective effort; the latter stays unknown when the proxy does not confirm it. The subscription translator does not establish an enforced output ceiling. Do not infer effort from a token count alone.

The CLI accepts `--effort low|medium|high` and `--mode sequential|ordered|both`. Defaults preserve the original low-effort comparison. A single-mode four-model run allows four initial calls and sequential retries within the same five-answer limit. No OpenRouter spending is included.

## Shared selection and saved records

`--prompt-ids p1,p2,p3` selects explicit daily IDs in that order. Reject unknown, duplicate, or empty IDs before model calls. Save copied date, IDs, and question text before inference. Defaults still select the first daily question.

Write one unique JSONL journal under ignored `.local/runs/`. Schema version 1 and protocol `development-v2` distinguish it from earlier output. Setup records include the selected questions, model matrix, prompts, requested settings, and unknown effective controls. Record generation and submission requests before dispatch, then normalized generations, verdicts, question results, and final run status. Omit raw model responses and hidden reasoning. A log without a final end event is unfinished; never resume it automatically.

The evaluation module starts a fresh conversation for each question, preserves first acceptance, permits at most five substantive candidates, and stops ambiguous corrections for review. Derive question scores from saved verdicts: accepted native points, five rejections at zero, or unknown for incomplete/provisional results. Infrastructure failures stop the batch after saving the affected result. The setup matrix retains the expected coverage even when later evaluations do not run.

Verify this extension offline first. Then run a bounded sample on today's first three IDs, chosen before inference, across four models at requested low and high using sequential generation. This permits 24 initial calls, with at most five candidates per model-setting/question. It is a deterministic smoke sample, not representative coverage or a final policy decision.

Use these exploratory measurements to design the paid OpenRouter pilot within the existing US$10 total cap. Each public model and reasoning configuration needs a separate entry. Supported settings, provider mapping, and budget must be verified before official runs. Choose one public generation policy after measuring representative public models and questions.
