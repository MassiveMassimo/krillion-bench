# Krillion Bench tasks

The [plan](plan.md) defines order and boundaries. Checkboxes mean verified completion, not intent. File paths below are candidate locations, not files that already exist.

## Task 1: Verify development thinking controls

**Status:** Complete. See [control evidence](../docs/research/vibeproxy-controls.md). Effective upstream settings remain unknown.

**Description:** Determine what the subscription route forwards or changes before using it for matched thinking tests.

**Acceptance criteria:**

- [x] Record installed build provenance and source mapping for effort and output limits.
- [x] Check relevant live overrides without exposing credentials or changing proxy configuration.
- [x] State the supported mapping and remaining end-to-end uncertainty explicitly.

**Verification:** Inspect pinned source and reasoning-only configuration evidence. No inference is required for source verification.

**Dependencies:** Existing development probe.

**Files likely touched:** `docs/research/vibeproxy-controls.md`, `docs/research/protocol-cost-probe.md`.

**Estimated scope:** Small, 2 files.

## Task 2: Save shared-question development runs

**Status:** Complete. See [paired run evidence](../docs/research/shared-question-runs.md) and [correction continuation](../docs/research/correction-continuation.md). All 24 selected evaluations have final scores. Original journals are preserved.

**Description:** Extend the existing probe to use a frozen small question selection and produce reproducible records for each model-setting pair.

**Acceptance criteria:**

- [x] Validate a shared selection before calls and start a fresh conversation per question.
- [x] Preserve candidate order, first acceptance, usage, settings, and incomplete status in saved records.
- [x] Run a small subscription-backed sample and reproduce its scores from the records.

**Verification:** Offline runner tests; existing typecheck, lint, and formatting checks; one bounded live development sample after offline checks pass.

**Dependencies:** Task 1.

**Files likely touched:** `scripts/protocol-cost-probe.ts`, `src/evaluation/records.ts`, `tests/evaluation-records.test.ts`, `tests/protocol-cost-probe.test.ts`, `docs/specs/protocol-cost-probe.md`.

**Estimated scope:** Medium, 5 files.

## Checkpoint: Reproducible development evaluation

- [x] Saved records reproduce native scores and retain unknown settings.
- [x] Required checks pass and the live sample is clearly marked development-only.
- [x] The selected attempt policy remains exploratory until paid costs are measured.

## Task 3a: Define the Next.js shell

**Status:** Complete. The synthetic preview builds and runs locally. See [interface review](../docs/research/interface-review.md).

**Description:** Add the approved frontend framework with a minimal synthetic page. Confirm current library setup from primary documentation.

**Acceptance criteria:**

- [x] Next.js runs locally with a minimal synthetic page.
- [x] Existing adapter tests remain executable and runtime credentials stay outside browser code.
- [x] Development and production build commands are explicit and runnable.

**Verification:** `npm run build`, 47 offline tests, TypeScript, Oxlint, Oxfmt, and built-in browser checks. The design team also reviewed the preview.

**Dependencies:** Stable Task 2 record shape. Hosting is not required for local development.

**Files likely touched:** `package.json`, `package-lock.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`.

**Estimated scope:** Medium, 5 files.

## Task 3b: Configure frontend quality checks

**Status:** Complete. See [quality and daily-view evidence](../docs/research/daily-view.md). React Doctor's error gate passes with documented warnings.

**Description:** Extend the existing Oxc tooling to the approved frontend. Register the selected shadcn plugin with explicit rules and add React Doctor. Keep this separate from framework setup.

**Acceptance criteria:**

- [x] Formatting and Oxlint cover the new frontend files.
- [x] React Doctor and selected shadcn rule commands are explicit and runnable.
- [x] AGENTS.md lists actual commands while remaining concise.

**Verification:** Run configured checks against the minimal page and inspect effective rule configuration.

**Dependencies:** Task 3a.

**Files likely touched:** `package.json`, `package-lock.json`, frontend lint configuration, `AGENTS.md`.

**Estimated scope:** Medium, 4 files.

## Task 4: Show one daily result

**Status:** Complete for one synthetic question. The view uses saved evaluation fixtures and the shared scoring function. See [daily-view evidence](../docs/research/daily-view.md).

**Description:** Build the first complete visitor path from a saved synthetic evaluation to a daily answer view.

**Acceptance criteria:**

- [x] Show question, model-setting label, submitted answer, tier, points, and attempts.
- [x] Identify fixture data, corrections, incomplete results, and unknown cost accurately.
- [x] Use Fluid Functionalism and support keyboard use and narrow screens.

**Verification:** Offline score/record checks, frontend build, and headless Playwright or built-in browser checks of the daily page.

**Dependencies:** Tasks 2, 3a, and 3b.

**Files likely touched:** `src/app/page.tsx`, `src/components/daily-results.tsx`, `src/app/globals.css`, `src/evaluation/fixtures.ts`, `tests/daily-results.test.ts`.

**Estimated scope:** Medium, 5 files.

## Task 5: Add bounded OpenRouter requests

**Status:** Complete offline. Catalog validation, route restrictions, shared budget accounting, and failure handling pass. See [pilot specification](../docs/specs/openrouter-pilot.md). Effective provider controls require live evidence.

**Description:** Build the official request path without spending until the selected matrix and maximum costs are concrete.

**Acceptance criteria:**

- [x] Validate model-specific reasoning controls and provider parameter support; record routing and actual model IDs.
- [x] Reserve maximum call cost against the shared US$10 cap and reconcile charges without double-counting reasoning.
- [x] Stop on unknown cost, transport failure, or exhausted budget; do not retry unknown outcomes automatically.

**Verification:** Local HTTP fixtures for supported settings, charge accounting, timeout, and budget exhaustion; typecheck and lint. Check Keychain before asking for credentials.

**Dependencies:** Task 2 and a concrete pilot matrix recommendation. This task can precede UI completion.

**Files likely touched:** `src/providers/openrouter.ts`, `src/evaluation/budget.ts`, `tests/openrouter.test.ts`, `tests/budget.test.ts`, `docs/specs/openrouter-pilot.md`.

**Estimated scope:** Medium, 5 files.

## Task 6: Run the paid pilot

**Status:** Runner prepared and tested offline. The owner selected Luna and Nano at low/high. Paid execution awaits an OpenRouter key. The subscription route remains available for development tests. No paid call or account reconciliation has run.

**Description:** Measure official token cost and completion behavior on a small matched set, including two supported thinking settings where feasible.

**Acceptance criteria:**

- [ ] Freeze model-setting matrix, questions, prompts, routes, and ceilings before dispatch.
- [ ] Compare attempt policies on a matched subset within the US$10 total cap.
- [ ] Save measured charges, score, attempts, latency, coverage, and remaining funds.

**Verification:** Reconcile saved charges with returned account usage. Confirm the pilot stays within the cap and results reproduce from records.

**Dependencies:** Task 5; credential access and selected matrix. No funding purchase or recurring spending is implied.

**Files likely touched:** `scripts/openrouter-pilot.ts`, `docs/research/openrouter-pilot.md`, compact local evidence.

**Estimated scope:** Medium, 3 files.

## Checkpoint: Measured public protocol

- [ ] Actual costs support the chosen question and setting coverage.
- [ ] Generation policy and declared ceilings are selected from evidence.
- [ ] Unsupported settings and incomplete runs remain visible; no recurring budget is assumed.

## Task 7: Freeze scoring and comparison rules

**Status:** The aggregation function and synthetic tests cover the settled scoring and coverage rules. See [development-view evidence](../docs/research/development-view.md). Final public policy and protocol version still depend on the paid pilot.

**Description:** Turn pilot findings into one versioned public protocol and aggregation function.

**Acceptance criteria:**

- [ ] Define candidate policy, correction review, thinking labels, and shared coverage.
- [x] Preserve mean native points, completed misses, and equal-rank ties.
- [x] Prevent incomplete or unequal question coverage from producing a misleading final ranking.

**Verification:** Synthetic aggregation cases for ties, misses, partial coverage, and separate thinking configurations.

**Dependencies:** Final public protocol depends on Task 6. The settled aggregation rules can be tested offline.

**Files likely touched:** `docs/specs/public-protocol.md`, `src/evaluation/aggregate.ts`, `tests/aggregate.test.ts`.

**Estimated scope:** Medium, 3 files.

## Task 8: Show overall comparisons

**Status:** The landing page now shows the opt-in development comparison with Fluid Subtle Tabs for score/model ordering, model search, and shared-question evidence links. The development view shows all 24 completed GPT results, eight requested low/high configurations, complete shared coverage, means, and original/canonical answer history. The public view keeps official runs pending and separates synthetic examples. See [benchmark UI research](../docs/design/benchmark-comparison.md). Official aggregate presentation remains pending Task 7.

**Description:** Add the aggregate visitor view using the same saved records as the daily page.

**Acceptance criteria:**

- [ ] Display model-setting entries, mean points, acceptance, coverage, cost, and latency when known.
- [ ] Preserve ties and label provisional or insufficient coverage.
- [ ] Link each entry to its daily evidence.

**Verification:** Compare UI values with aggregation fixtures; frontend build and keyboard/mobile browser checks.

**Dependencies:** Tasks 4 and 7.

**Files likely touched:** `src/components/leaderboard.tsx`, `src/app/page.tsx`, `tests/leaderboard.test.ts`.

**Estimated scope:** Medium, 3 files.

## Task 9: Explain daily evidence and methodology

**Status:** Date navigation, missing-date recovery, and methodology are complete for saved synthetic data. See [navigation evidence](../docs/research/date-navigation.md). Public answer reveal and final protocol copy remain pending.

**Description:** Add date navigation and a concise methodology page so users can inspect today's answers and understand the score.

**Acceptance criteria:**

- [x] Date navigation handles missing days and links to available model answers.
- [x] Explain native tiers, attempts, corrections, thinking controls, and cost limits.
- [ ] Choose answer reveal behavior before exposing today's live answers in a public page.

**Verification:** Saved-day fixtures, missing-date checks, frontend build, and browser navigation checks.

**Dependencies:** The synthetic pages depend on Task 4. Final public methodology depends on Task 7. Live content publication also depends on Task 10.

**Files likely touched:** `src/app/day/[date]/page.tsx`, `src/app/methodology/page.tsx`, `src/components/date-navigation.tsx`, browser tests.

**Estimated scope:** Medium, 4 files.

## Checkpoint: Reviewable website

- [ ] Overall and daily views agree with saved records.
- [ ] Mobile, keyboard, and selected quality checks pass.
- [ ] Synthetic, exploratory, and official results have clear provenance.

## Task 10: Resolve release access

**Description:** Establish supported daily operation, content reuse, attribution, and historical catch-up limits before public live content release.

**Acceptance criteria:**

- [ ] Record the evidence and owner decision for public question/answer reuse.
- [ ] Define attribution and supported access; do not bypass locked archive routes.
- [ ] Document catch-up limitations without promising unverified historical coverage.

**Verification:** Review primary source evidence and the concrete release decision. Ask before creator contact or paid archive access.

**Dependencies:** Can proceed alongside local tasks; required before Task 12.

**Files likely touched:** `docs/research/content-access.md`, `docs/specs/public-protocol.md`.

**Estimated scope:** Small, 2 files.

## Task 11: Prepare repository and release configuration

**Description:** Prepare the public GitHub repository and selected hosting path with saved results and protected server-side credentials.

**Acceptance criteria:**

- [ ] Choose public hosting and official execution; present GitHub Actions/static hosting as a proposal until selected.
- [ ] Define repository license and release contents, excluding credentials, local development evidence, and review-only media.
- [ ] Prepare a repeatable build and manual publication path for the chosen host.

**Verification:** Inspect release files, run chosen build checks, and confirm no secret or development result enters public artifacts. Deployment remains a separate live action.

**Dependencies:** Tasks 8–10 and hosting/repository owner decisions.

**Files likely touched:** `README.md`, `LICENSE`, hosting configuration, chosen build workflow.

**Estimated scope:** Medium, 4 files.

## Task 12: Verify public release

**Description:** Publish the approved repository/site and verify the visitor path. Add unattended daily operation only after a recurring spending decision.

**Acceptance criteria:**

- [ ] Release on the selected host with correct attribution and methodology.
- [ ] Check overall score, daily answers, mobile access, and provenance on the actual public site.
- [ ] Record manual update steps and known access/coverage limits; do not create an unapproved daily spend schedule.

**Verification:** Public URL checks, browser visitor flow, and comparison with saved official records.

**Dependencies:** Task 11 and authorized publication/deployment.

**Files likely touched:** `docs/release.md`, `README.md`, chosen release configuration.

**Estimated scope:** Medium, 3 files.
