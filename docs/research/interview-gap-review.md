# Interview Gap Review

8 October 2026. An independent subagent audited the confirmed project intent. This review records missing decisions, not new requirements. Later work added the [daily API adapter](krillion-api.md) and a [subscription-backed protocol probe](protocol-cost-probe.md). Thinking levels are now a confirmed measurement dimension. No official evaluations, deployment, or scheduled automation have started.

## Settled Decisions

The project will publish an owner-run leaderboard and daily model answers. It targets valid, obscure recall without external knowledge tools. The main score is mean native Krillion points. Each question permits up to five substantive answers and ends at first acceptance. Untimed daily validation is verified for one question and date. Sequential versus ordered generation still depends on measured cost. The user prefers the cheapest feasible policy. Verified equivalent wording corrections stay within the same attempt. Ties are valid. Initial paid API spending is capped at US$10. The existing OpenAI subscription through VibeProxy is for development tests only. Official public evaluations will use OpenRouter with shared questions, prompts, and attempt rules.

## Remaining Gaps

The development probe compared requested low and high settings on one question. Effective proxy settings remain unverified. The public model-setting matrix, supported provider controls, and adequate output ceilings need calibration within the US$10 total cap. Keep each model-setting pair separate. See [thinking-level policy](thinking-levels.md).

| Priority | Gap                                        | Concrete consequence                                                                                                                                                                                                                                                                                 | Next action                                                                                                                                                                     |
| -------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Public hosting and execution               | The user selected Next.js and Fluid Functionalism, with Oxlint, Oxfmt, React Doctor, and `@shadcn/lint`. The daily adapter now uses Node.js 24 and TypeScript. Verified scripts and tests exist; no Git history or frontend exists yet.                                                              | Choose public execution and hosting. The Actions and Pages proposal below remains unapproved.                                                                                   |
| 2        | Question access and reuse permission       | Today's question endpoint and ordinary daily submission work headlessly. Untimed validation is observed on one question and date. Public archive code attaches a purchase token and handles locked access. Public reuse remains unverified.                                                          | Resolve supported operation and public reuse. Ask before creator contact, paid archive access, a different source, or a release decision that needs permission.                 |
| 3        | Comparable coverage across dates           | Public models will use OpenRouter and shared questions. Missing runs and newly added models can still create uneven coverage. A lifetime mean could compare question difficulty rather than model ability.                                                                                           | Verify historical access. Propose an overall ranking on a common completed question set, with extra daily results shown separately. Establish how new models catch up.          |
| 4        | Generation cost, corrections, and failures | Daily validation accepted a new answer beyond the browser timer. One-question proxy measurements favor sequential tokens but exercise no retries and do not measure billed USD. Corrections can change the entity. Provider failures remain incomplete.                                              | Measure actual OpenRouter costs on matched questions and thinking configurations. Select one public protocol and keep conservative correction rules.                            |
| 5        | Daily execution and publication            | Development tests can use the owner's Mac. The US$10 total public pilot will measure affordable coverage. Public daily OpenRouter runs still need an execution location, a trigger, missed-run recovery, and a way to publish results. Manual versus unattended execution and hosting are undecided. | Measure actual pilot costs before proposing recurring spending. Agree on scheduling and publication before selecting new services, deploying, or creating scheduled automation. |

## Public execution and hosting proposal

Official runs can use standard GitHub Actions runners after verifying the Krillion adapter. Those runners are free for public repositories. Store the OpenRouter key in Actions secrets. Save results without credentials, then build the Next.js website from those saved results. Model calls remain paid and bounded by the pilot budget. This proposal does not create a workflow or authorize deployment. See [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

Use Next.js static export and GitHub Pages for the initial website. The confirmed site displays owner-generated results and does not require a server for visitor inference. Next.js exports static files into `out/`, and GitHub Pages supports public repositories on GitHub Free. See [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports) and [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Start official execution manually during the pilot. Daily scheduling comes after measured costs and verified submission behavior. GitHub schedules can be delayed or missed, so a later daily workflow needs a manual retry path and an explicit date. The recommended service choice awaits the user's decision. The Mac remains the local development test environment.

## Routine implementation details

Directory names, result file formats, and a spoiler-reveal control do not need separate product interviews. Record exact model IDs, provider routes, prompts, reasoning settings, scoring versions, and run dates for reproducibility. Verify supported settings rather than assuming API compatibility guarantees identical behavior.

These details must support the approved protocol. If a technical finding changes scoring, data custody, spending, or a service choice, present the concrete consequence before proceeding.

## Suggested Next Interview Question

The frontend and development execution location were answered after the audit: Next.js with Fluid Functionalism and the selected quality tools; subscription-backed development tests on the existing Mac. Public evaluations will use OpenRouter. GitHub Actions remains an option for official runs, not an approved setup.

The user confirmed US$10 total for the initial pilot, to measure what that budget can afford. No recurring spending is authorized. Shared questions are part of the public protocol; missing-run handling, historical access, and backfilling remain feasibility checks.

The fixed rules are five substantive answers at most, stopping at first acceptance, and equivalent spelling corrections within the same attempt. The user's latest clarification makes sequential generation conditional on untimed access and gives cost priority. Determine timer behavior and compare sequential versus ordered-list costs before selecting one public protocol. Do not ask the user to repeat this preference.

Continue read-only research on headless access, historical access, public reuse, and pilot costs. Present a concrete model shortlist and execution/publication recommendation before asking for the remaining owner choices. Directory names and test frameworks can follow the selected stack during implementation.

The headless daily client is implemented in TypeScript on Node.js 24. A model evaluation runner and frontend are not implemented. Deployment remains an open owner choice. The site can display owner-generated results without hosting visitor-triggered inference.

The confirmed intent is sufficient for `AGENTS.md`, which now records scope and evaluation rules. Tool-specific commands must follow actual repository configuration, rather than invented scripts or conventions.
