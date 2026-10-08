# Implementation Plan: Krillion Bench

## Outcome

Build an owner-run benchmark and Next.js website for valid, obscure Krillion recall. Measure model and thinking configurations on shared questions. The approved scope is in [version-one spec](../docs/specs/benchmark-v1.md). Detailed tasks and acceptance checks live in [todo.md](todo.md).

## Current evidence

- The daily HTTP adapter and CLI work without browser control.
- On one date and question, the API accepted a new answer 13 minutes 54 seconds after the first submission. This supports untimed daily validation in that case, not a permanent guarantee.
- Four subscription models were tested on one shared question. Sequential generation used fewer reported tokens than an ordered list. All first candidates succeeded, so retry costs remain unmeasured.
- Requested low and high thinking settings both scored 85. The proxy's effective controls remain unverified. These are development results, not public rankings.
- A later [shared-question run](../docs/research/shared-question-runs.md) saved 24 evaluation records across three questions and requested low/high. [Correction continuation](../docs/research/correction-continuation.md) resolved the five pending records. All 24 now have scores; the original journals remain unchanged.
- The synthetic Next.js preview builds and uses Fluid Functionalism. The design team reviewed six domains. Browser checks cover widths from 320 to 1440 px, keyboard focus, and reduced motion. See [interface review](../docs/research/interface-review.md).
- Tasks 3b–4 add explicit quality checks and a daily view from saved synthetic evaluations. Native histories show acceptance, correction, miss, and incomplete states. See [daily-view evidence](../docs/research/daily-view.md).
- Task 5 adds validated OpenRouter requests and one shared, persisted US$10 budget. The Task 6 CLI freezes its plan and prevents a fresh allowance on restart. The owner selected GPT-6 Luna and GPT-5 Nano at low/high. Its initial slice has a conservative US$3.8432 reservation at current prices. See [pilot specification](../docs/specs/openrouter-pilot.md).
- Task 9 now includes a saved synthetic date page, a methodology page, and missing-date recovery. Only the existing example date is listed. Live answer reveal and final protocol copy remain pending. See [navigation evidence](../docs/research/date-navigation.md).
- Task 7's settled aggregation rules pass synthetic coverage and tie tests. An opt-in `/development` page displays all 24 completed GPT records and eight means. No official ranks are displayed. Default builds and servers hide the route and exclude private journals from deployment traces. See [development-view evidence](../docs/research/development-view.md).
- The landing page now leads with the local GPT comparison, Fluid Subtle Tabs for score/model ordering, model search, and shared-question evidence links. Six Luna agents researched benchmark browsing patterns. See [reference research](../docs/design/benchmark-comparison.md) and [landing-page verification](../docs/design/landing-page-verification.md).
- The last validation passed 116 offline tests, TypeScript, Oxlint with the shadcn color rule, Oxfmt, and the production build. React Doctor's error gate fails on 35 Fluid Accordion and Subtle Tabs animation findings; 36 warnings remain. The build reports a missing fallback-font metrics warning for Stack Sans Text. No Git history, deployment, or automation exists. The US$10 public pilot remains unspent. The owner must still set up an OpenRouter key.

## Implementation order

1. **Verify controls.** Inspect the installed proxy and source mapping. Record supported effort behavior and any limits that the subscription route ignores.
2. **Save reproducible evaluations.** Extend the small development runner to a frozen shared question set. Save final records and prove first-acceptance, correction, and incomplete behavior offline.
3. **Display one saved run.** Build a minimal Next.js daily view with synthetic records and the selected UI tools. Confirm that the displayed score and attempts match the record.
4. **Measure official costs.** Add OpenRouter request validation and budget accounting. Run a small matrix within the US$10 cap after selecting supported configurations. Measure attempt policy and thinking costs.
5. **Freeze the public protocol.** Record the chosen generation policy, thinking matrix, ceilings, and comparison coverage. Keep earlier exploratory runs separate.
6. **Complete public views.** Add overall comparisons, daily navigation, and methodology. Verify ties, missing coverage, mobile layout, and keyboard use.
7. **Prepare release.** Resolve content reuse and historical access, choose hosting and execution, prepare the GitHub repository, and verify the chosen release path. Scheduling follows a separate recurring-budget decision.

## Dependencies and checkpoints

Control verification → development records → one daily view.

Budget accounting + selected public matrix → paid pilot → frozen protocol → public aggregate views.

Content reuse + hosting decision + verified views → public release.

UI development with synthetic data can proceed while access questions remain open. It does not depend on paying for inference. Each task has its own verification. Checkpoints follow development records, the paid pilot, and website completion. Routine work within this scope proceeds without repeated permission requests. New spending beyond the cap, infrastructure choices, creator contact, or deployment need the relevant owner decision.

## Risks and response

| Risk                                          | Response                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Effort or token limits are ignored by a proxy | Separate requested settings from supported mapping and observed usage. Do not treat proxy runs as official evidence.      |
| All first answers succeed on an easy question | Use a frozen multi-question set. Include retries in the cost comparison without selecting questions after seeing winners. |
| Thinking exhausts the output ceiling          | Preserve incomplete status and usage. Calibrate declared ceilings before public scoring.                                  |
| Scores depend on changing curated rules       | Preserve raw verdicts, evaluation date, and protocol version. Keep ties.                                                  |
| Missing days bias model comparisons           | Show coverage and use a shared comparison set. Decide historical catch-up before promising it.                            |
| Paid calls exceed available funds             | Reserve maximum cost before dispatch and reconcile actual charges. Stop on unresolved costs.                              |
| Access or reuse is unsupported                | Keep local code and synthetic UI work moving. Resolve the release boundary before publishing live content.                |

## Open owner decisions

The public model-setting matrix and comparison window need concrete pilot recommendations. Hosting and official execution are not selected. Content reuse and historical access are not verified. Recurring daily spending is not approved. None of these prevents the next local development task.

## Immediate next task

Tasks 1–5 and the reproducible development checkpoint are complete. Task 9's synthetic navigation and methodology are verified. The settled aggregation rules and local GPT development view are tested. All five pending development corrections are resolved. Task 6 is prepared offline. Paid execution needs an OpenRouter key and existing credits. Final account reconciliation still needs live verification. After the paid pilot, select the public attempt policy and comparison coverage for Task 7, then complete Task 8's official aggregate view. Content-access research can proceed independently. The subscription route remains available for development tests; its effective effort remains unknown. The separate Fluid Accordion React Doctor findings remain unresolved.
