# Landing-page verification

8 October 2026. The landing page now shows a compact comparison of the saved GPT development sample. The approved ocean hero, Stack Sans Text, pill shapes, Hugeicons, and Fluid primitives remain in use. Six Luna research agents examined related benchmark interfaces. The selected patterns and sources are in [benchmark comparison design](benchmark-comparison.md).

## Implemented behavior

The comparison includes all eight model and requested-thinking configurations. It shows mean native points, accepted questions, and scored coverage for the same three-question sample. Mean points sort descending by default. The Model control groups configurations alphabetically. Equal point values stay equal; no official rank numbers appear.

Thinking effort appears in each model label, such as `gpt-6.1-sol (low)`, in both views. The separate thinking column is removed. This is the current row layout; official OpenRouter results and the public protocol remain pending.

Fluid Subtle Tabs now control the order. Fluid Input Group provides model search to their right, with a Hugeicons search icon. Search ignores case and surrounding spaces. Both result views use the same filtered records. A live match count and empty state explain the result. Clearing search restores all rows. Filtering does not recompute scores or coverage. Search occupies a second full-width row on phones. The official registry components were added without overwriting shared primitives. Their Radix Tabs and Base UI Field dependencies are installed.

Three question links open the existing development answer histories. The scoring explanation covers rarity, no web search, first acceptance, equivalent corrections, completed misses, and ties. The saved date and development provenance remain visible beside the table. Effective thinking settings and subscription cost remain unknown.

The home and development pages use `readDevelopmentResults`. The loader requires `KRILLION_DEV_RESULTS=1` before any journal read. It applies the existing schema and continuation validation. Missing or invalid local evidence produces an unavailable state. It does not substitute synthetic scores for model results.

Without the flag, the landing page shows official runs as pending, followed by a separate synthetic example. The development route returns 404. `connection()` checks the home-page opt-in at request time and prevents prerendering of local result data. This opt-in remains a release boundary, not authentication.

## Checks

- All 116 offline tests passed. The new loader test uses temporary synthetic journals. It verifies disabled flags, the two thinking configurations, missing records, and invalid continuation evidence. It removes its temporary directory.
- The final production build, TypeScript check, Oxlint, and full Oxfmt check passed. The existing Stack Sans Text fallback-metrics build warning remains.
- React Doctor reports 35 layout-animation errors and 36 warnings. The requested registry Subtle Tabs adds 21 layout-animation findings. Its source animates measured pill rectangles; its optional collapsing-label branch is unused here. These are high-confidence detections of supplied component code. Motion remains as supplied by Fluid. Other new warnings concern the component's context, Motion import, optional exit branch, complexity, and Input Group pointer wrapper. The search input remains keyboard accessible. No rule was suppressed. The error gate remains failing.
- Built-in browser checks verified all eight rows, score order, model order, selected tab state, ArrowRight focus movement, and Enter activation. The table declares its active column order through `aria-sort`. Both tabs reference the displayed result panel. Search for `SOL` and `luna` each returned the matching two configurations. An unmatched name showed the empty state. Clearing search restored eight rows.
- The question-two link opened `/development#question-p2` and its exact question heading. The link labels include the question number and full text.
- At 320, 768, 1024, and 1440 px, document width equaled viewport width. Phones used labeled stacked rows. Larger widths used the table. There were no nested interactive elements. The long filter-question button grew to fit its text after phone checks found its initial fixed-height overflow.
- Fresh landing-page navigation produced no console warnings or errors. Desktop and phone screenshots were inspected. These screenshots were not added to the repository.
- After the toolbar change, checks at 320, 768, and 1440 px found no horizontal overflow or nested controls. Tabs and the search field were 44 px high. At 1440 px, search aligned to the right of the order controls. At 320 px, it filled the next row and the mobile result list filtered correctly.
- The search field was later narrowed from 224px to 160px on desktop. At the owner's 841px viewport, its right edge matched the 24px content inset plus the panel border. The placeholder remained visible and `astra` returned two configurations. At 320px, search retained its full-width second row. Both widths had no horizontal overflow. The build and changed-file format checks passed.
- A temporary default-mode server returned HTTP 200 for home and 404 for development. Its home response contained no private GPT model ID. The browser showed the pending state and synthetic label. The deployment traces contained no `.local` entries, and home had no prerendered HTML file.

The temporary default-mode browser tab and server were closed. The viewport override was reset. The local preview on port 4310 remains available with development results enabled. The shared build/cache is about 345 MB; ignored journals occupy 104 KB. They remain for this preview. No inference, game submission, paid call, publication, or deployment occurred during this landing-page task.
