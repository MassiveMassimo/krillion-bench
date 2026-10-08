# Local GPT development results

Verified on 2026-10-08. The owner requested that the website show the saved subscription tests. The earlier pages loaded only invented fixtures. `/development` now displays the two existing local journals without running inference.

## Visible evidence

The view shows 24 evaluations on three shared questions for `gpt-6.1-sol`, `gpt-6-astra`, `gpt-5.6-terra`, and `gpt-6-luna`. Each has requested low and high configurations. Question sections show submitted answers, native tiers, points, ordered verdict history, and reviewed correction evidence. The landing page now leads with the same comparison and links to these question sections. See [landing-page verification](../design/landing-page-verification.md).

All 24 records now have accepted scores after [correction continuation](correction-continuation.md). Effective reasoning effort and enforced output ceilings are unverified. These subscription tests do not establish official rankings or a causal thinking advantage. USD cost remains unknown. The US$10 OpenRouter pilot is unspent.

## Coverage and continuation

The page renders all 24 planned records: eight configurations for each of the three selected questions. This was a small development sample, not the full seven-question daily game.

The original journals had 19 accepted records and five pending corrections. An append-only continuation now resolves all five. The original answers and verdicts remain intact. Equivalent wording receives a canonical submission within the same substantive attempt. A different suggestion receives no free credit; the model continues with generic rejection feedback.

Terra low used two remaining answers. Its fifth answer, industrial dust collector, was accepted as Dust collector for 85 points. No sixth answer was generated. The continuation used two new subscription calls and seven game submissions, including five canonical submissions. These calls were headless and did not use web search. Human terminology research informed correction reviews only.

Every configuration shows 3/3 scored coverage, 3/3 accepted, and zero pending corrections. Means are Sol low 85.00, Astra low 85.00, Terra low 76.67, Luna low 51.67; Sol high 76.67, Astra high 85.00, Terra high 68.33, Luna high 85.00. No ranks are displayed. The other four daily questions were outside this sample.

## Local access and release boundary

The development route returns 404 unless `KRILLION_DEV_RESULTS=1` is set on the server. Local commands are:

```sh
KRILLION_DEV_RESULTS=1 npm run dev -- --port 4310
# For the production preview, set the flag for both commands:
KRILLION_DEV_RESULTS=1 npm run build
KRILLION_DEV_RESULTS=1 npm run start -- --port 4310
```

The runtime flag enables the development route and its landing-page comparison. Both pages share a validated server loader. The home page waits for a request before reading the flag or local evidence; no development results enter prerendered HTML. The flag is an opt-in, not authentication. Keep it unset for public builds and servers. The development page marks itself `noindex, nofollow`; that is not an access control.

The server reads two explicit run IDs and one optional correction journal. It validates provenance, schema, native points, question identity, configuration coverage, and preserved original evidence. Later reviews can apply only to a new substantive check. It projects display fields and discards request messages, system prompts, and arbitrary journal metadata. Files remain ignored under `.local/runs/`; no journal was copied into tracked source or browser assets.

Next.js initially included the local journal paths in its deployment trace. `next.config.ts` now excludes `.local/**/*` from all route traces. A default build had no development link, no private journal trace entries, and a 404 development route. Public question/answer reuse remains unresolved; this local view does not authorize publication.

## Aggregation and verification

`aggregateEvaluations` uses an explicit shared question selection. It includes completed misses at zero, rejects duplicate configuration/question records and changed question text, and separates requested effort and generation mode. Missing, incomplete, and pending records cannot become zeros. It withholds all final ranks when any supplied configuration lacks scored coverage and preserves competition-rank ties when coverage is complete. The public protocol remains pending pilot evidence.

- All 115 offline tests passed. Continuation tests cover immutable evidence, equivalent and different suggestions, fifth-attempt limits, ordered candidate reuse, transport failures, and later correction reviews.
- TypeScript, Oxlint, formatting, and the production build passed. React Doctor's error gate fails on 14 layout-animation findings in the separately added Fluid Accordion. Its 29 warnings remain. The existing Stack Sans Text fallback-metrics build warning remains.
- The saved journals replayed as eight configurations and 24 accepted evaluations. The paid OpenRouter pilot remains unspent.
- Built-in browser checks verified all five completed correction histories and the eight means. Terra's history preserves its different third-answer suggestion and equivalent fifth-answer acceptance. Keyboard Enter toggled the mobile history disclosure.
- The page had no document overflow at 320, 768, 1024, or 1440 px, including expanded long review evidence on mobile. Console checks returned no warnings or errors. The viewport override was reset.

Native Safari, VoiceOver, physical touch, actual 200% zoom, and the browser-rendered missing-journal state remain untested. No deployment, recurring budget, or public release was added.

The active local preview retains the shared `.next` build/cache (about 310 MB), existing dependencies, and private journals (104 KB on disk). The new correction journal is 17,143 bytes. Both original journals retain their original byte lengths. The current build has no `.local` deployment-trace entries. No copied result file or review screenshot was added to the repository.
