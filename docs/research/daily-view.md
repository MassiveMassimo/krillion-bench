# Quality checks and synthetic daily view

Verified on 2026-10-08. Tasks 3b and 4 are complete. The local page reads typed, saved synthetic `Evaluation` fixtures. No private journals or live results enter the UI.

## Quality configuration

`@shadcn/lint` 0.2.0 is registered in `.oxlintrc.json` through Oxlint's JS plugin API. `shadcn/no-raw-colors` enforces the existing theme-color convention. A temporary `text-pink-500` fixture failed with this rule and identified the actual theme file. The fixture was removed. Registration alone does not enforce a design rule.

The upstream [SETUP.md](https://github.com/shadcn-ui/lint/blob/main/SETUP.md) covers registration only. The selected color rule is a separate implementation of the approved Task 3b and the existing neutral-token convention. No rule preset was enabled. Other policies remain configurable in `.oxlintrc.json`.

React Doctor 0.9.17 runs through `npm run check:react`. Telemetry, the score API, and the dependency supply-chain scan are disabled. The error gate is enabled. No CI workflow, hook, or remote scan was installed.

One rule is suppressed only for `src/hooks/use-fluid-hover.ts`: `react-doctor/effect-needs-cleanup`. The scanner reports a subscription leak from registration, but the parent hook's unmount cleanup cancels both animation frames and disconnects the item observer. Installed component behavior was not changed. All other rules remain active.

The final scan reports 14 warnings: the full Motion import, nine mixed component exports, two static-table mouse-handler findings, and two intentional JSON serialization round-trips in tests. These remain visible. The table's mouse handler supplies hover feedback; there is no pointer-only task behind it. Native attempt disclosures were tested with keyboard input. Passing the error gate does not mean a warning-free scan.

## Daily data and scoring

`src/evaluation/fixtures.ts` stores one example question dated 2026-10-01. Five entries demonstrate first-attempt acceptance, third-attempt acceptance, pending correction, five-answer completed miss, and failed submission. Every entry is invented; no fixture was submitted to Krillion or a model.

`displayEvaluation` derives points through the existing `questionScore`. It uses the first accepted verdict and retains ordered checked history. A later accepted answer cannot replace the first score. Corrections and incomplete results are unscored; only a completed miss receives zero.

Disclosures say “answers checked.” A generated answer without a game verdict is shown with an explicit caveat. After earlier rejections, a submission failure shows the current unchecked candidate under both sequential and ordered generation. Unused ordered candidates do not appear as submitted attempts. Thinking labels are requested settings; effective settings are unverified. Synthetic cost and latency are not measured.

## Verification

- All 51 offline tests passed, including four daily projection tests.
- Next.js production build, TypeScript, Oxlint with the selected shadcn rule, and Oxfmt passed.
- The independent protocol reviewer and design-foundation reviewer approved the source slice with no required findings. Both independently ran the four daily tests.
- Built-in browser checks at 320, 768, and 1280 px found no document overflow.
- Enter opened the three-answer history and showed both earlier rejections before the accepted answer. Its focus outline was visible.
- The correction disclosure showed the suggested canonical spelling and the unverified-equivalence caveat.
- The 320 px accessibility tree showed the mobile list, not the hidden desktop table. Mobile history and failed-submission explanation expanded correctly.
- Disclosure targets measured 44 px high. Console checks returned no warnings or errors. Viewport overrides were reset.

Native Safari, VoiceOver, physical touch devices, and actual 200% browser zoom remain untested. Official result loading, date navigation, overall aggregation, and public release are later tasks.

The US$10 paid pilot remains unspent. No inference, deployment, scheduling, or public publication occurred in this slice. The active local preview retains one production build. Installed dependencies remain necessary for its quality checks.
