# Krillion Bench version one

## Goal

Publish a repository and website that compare LLM recall through valid, obscure Krillion answers. Visitors can inspect overall results and the answers for a chosen day after playing. The benchmark measures knowledge without model web search or external tools. Native rarity tiers are curated game judgments, not measured training-data frequency.

Native acceptance is not an independent factual correctness check. Preserve rejected answers and correction suggestions so readers can inspect game judgment limits. Describe the score as performance under Krillion's acceptance and rarity rules.

## Confirmed decisions

- Use Next.js with Fluid Functionalism. Use Oxlint, Oxfmt, React Doctor, and the selected shadcn lint setup.
- Use OpenRouter for official runs. Subscription-backed Astra, Sol, Terra, and Luna through VibeProxy are private development tests.
- Start with a few shared questions. Expand toward daily question sets after measuring cost. The initial paid pilot has one US$10 total cap; no recurring budget is approved.
- Treat each model and thinking configuration as a separate entry. Verify supported controls. Keep requested effort distinct from effective settings when known.
- Allow up to five substantive candidates per question. Stop at first acceptance. Verified equivalent spelling or wording corrections stay in the same attempt. Ambiguous corrections need review.
- Select the cheapest feasible generation policy from measurements. Sequential generation requires untimed validation; ordered generation remains a candidate. Freeze one policy for comparable public results.
- Rank by mean native points, including completed misses at zero. Keep ties. Show acceptance, usage, cost, latency, and coverage as supporting measures.
- Owner-run inference produces saved results. Visitors do not start runs.

## Evaluation contract

Freeze the date, question IDs, prompt text, and selection before calling models. Every compared configuration receives the same questions and prompt version. Start a fresh conversation for each question. Keep other answers, tier feedback, and revealed solutions out of model context. Sequential rejection feedback is generic. Ordered candidates retain their original order.

Record run identity, development or official source, model request and response IDs, provider route, reasoning controls, output ceiling, prompt and protocol versions, question identity, candidate order, game verdicts, native scores, finish reasons, token usage, latency, and actual charge when available. Store counters and final answers; hidden reasoning text is not needed.

An accepted question is complete. Five rejected substantive candidates produce a completed miss. Infrastructure errors, invalid generation format, truncation, and unresolved corrections produce incomplete or provisional results. They must not become factual misses or silently disappear from a published mean. Report coverage. Compare aggregate results on a shared completed question set and label partial coverage; the exact public comparison window remains to be selected.

## Paid pilot

Before dispatch, select a small model-setting matrix, verify current routes and controls, estimate maximum call costs, and reserve them against the remaining cap. Reconcile actual charges afterward. Unknown-cost calls require reconciliation before more spending. Reasoning is part of output cost, not an extra total to add twice. A timeout does not prove that a request was free.

Compare sequential and ordered generation on a matched subset. Compare two supported thinking settings where feasible. Expand questions only when the remaining budget supports the complete comparison. Publish pilot measurements with their limits; do not claim stable superiority from one sample.

## Website

Provide an overall comparison, a daily answer view, and a methodology view. Show model-setting labels, native score, coverage, provenance, attempts, correction status, and cost where known. Identify development fixtures and provisional results clearly. Keep API credentials outside browser code.

Start the UI with synthetic results. Live result publication depends on supported question access and content reuse. Hosting, official execution location, scheduling, historical catch-up, and answer reveal behavior remain open. GitHub Actions and static hosting are proposals, not selected infrastructure.

## Acceptance

Offline tests prove attempt limits, first acceptance, corrections, failures, thinking labels, and accounting. A small development run proves saved records can reproduce the displayed scores. The paid pilot establishes measured costs within the cap. The website presents daily answers and aggregate results consistently, works by keyboard and on mobile, and passes the selected checks. Public release requires a content reuse decision, hosting selection, and a manual end-to-end check.
