# Home preview interface review

Reviewed on 2026-10-08. Scope: the synthetic home page, its layout, and its stylesheet. This is a local preview. No official results or private evaluation journals enter the page.

## Team and coverage

The design team applied `better-interface`, its six owning skills, `improve-ui`, `ui-skills-root`, and `impeccable`. The selected UI skill was Fluid Functionalism. Source authority included `AGENTS.md`, the benchmark spec, and the existing neutral implementation. No earlier formal design guide existed.

| Domain        | Evidence                                                                                                  | Result                           |
| ------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Accessibility | Native table headers, mobile definition lists, links, focus CSS; browser keyboard and accessibility trees | No required finding remains      |
| Layout        | Page hierarchy, responsive stylesheet; rendered 320–1440 px layouts                                       | No required finding remains      |
| Writing       | Synthetic notice, acceptance caveat, correction and scoring text                                          | Accepted wording issues resolved |
| Typography    | Fluid roles, shared weights, Inter variable font, aligned numeric points                                  | No required finding remains      |
| Color         | Foreground and muted tokens, focus ring, written result states                                            | No required finding remains      |
| UI details    | Installed Fluid table and highlight, root motion provider, native links                                   | No required finding remains      |

The strict `improve-ui` audit found no supported design-contract defect in the earlier shell. Layout and prominence changes were authorized design recommendations. They were not described as existing contract violations.

## Changes and verification

The earlier 320 px layout had a 577 px table inside a 288 px region. Most answer details needed horizontal scrolling, without a visible cue. The new narrow layout shows all fields in labeled rows. The wider layout retains a comparison table. The introduction is smaller, the question is prominent, and the points column uses tabular figures and end alignment.

The page says “accepted by Krillion” and explains the limit of game judgments. Pending corrections remain unscored. Verified equivalent corrections remain within the same attempt. Model-setting entries and fixture provenance remain explicit.

- `npm run build`, `npm run typecheck`, `npm run lint`, and `npm run format:check` passed.
- `npm test` passed all 47 offline tests.
- Built-in browser checks at 320, 640, 768, 1024, 1280, and 1440 px found no document overflow. Both representations use the same three synthetic rows.
- At 320 px, the accessibility tree exposed the mobile list and its definition lists. The hidden desktop table was absent. Desktop exposed the native table.
- Keyboard Tab revealed the skip link with a 2 px foreground outline. Enter moved to the results anchor. The masthead link returned to the top.
- Computed body font was Inter with its fallback. The generated font faces declare variable weights 100–900. Source requests the optical-size axis.
- Emulated reduced motion matched the media query. The table highlight appeared on a selected row. Its source removes positional travel under reduced motion; the root also applies `MotionConfig reducedMotion="user"`. The override was reset.
- Console checks returned no warnings or errors. All temporary viewport overrides were reset.

Declared text contrast is 17.18:1 for foreground on the page, 6.71:1 for muted text on the page, and 7.00:1 for muted text on white. Result meaning is also written in text.

## Limits and next work

Approve for the reviewed surface and domains. Native Safari, VoiceOver, physical touch devices, and actual 200% browser zoom were not tested. Width checks are not a substitute for those checks. Tasks 3b–4 subsequently added quality rules and saved synthetic daily records with histories. Their verification is in [daily-view.md](daily-view.md).

The active local preview retains the 37 MB production build. Installed dependencies use 421 MB. Private run evidence remains in ignored `.local/` at about 100 KB. No disposable test files or raw logs were created. No paid inference, publication, or deployment occurred during the design work.

Primary setup sources: [Fluid component craft](https://github.com/mickadesign/fluid-functionalism/blob/main/skills/fluid-functionalism/references/craft.md), [Fluid table registry](https://www.fluidfunctionalism.com/r/table.json), and [Next.js font reference](https://nextjs.org/docs/app/api-reference/components/font).
