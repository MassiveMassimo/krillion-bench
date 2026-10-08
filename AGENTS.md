# Repository Guidelines

## Project structure and module organization

`src/app/` contains the frontend. `src/components/` and `src/lib/` contain Fluid Functionalism components and tokens. `src/krillion/` and `src/providers/` contain API clients. `src/evaluation/` defines attempt rules. `scripts/` contains probes; `tests/` contains offline tests. `docs/` records scope and evidence. `tasks/` tracks implementation.

Visitors view saved results. They cannot start model runs. Public examples are synthetic. Local GPT results require `KRILLION_DEV_RESULTS=1`; keep it unset for release. Exclude `.local/` from deployment traces.

## Build, test, and development commands

Use Node.js 24.2+. `npm ci` installs dependencies.

- `npm test` runs offline tests with Node's test runner.
- `npm run dev` starts the local Next.js server.
- `npm run build` builds production assets; `npm run start` serves them.
- `npm run typecheck` generates route types and checks TypeScript.
- `npm run lint` runs Oxlint and the shadcn theme-color rule.
- `npm run check:react` runs React Doctor without telemetry or supply-chain requests.
- `npm run format:check` checks Oxfmt formatting. `npm run format` applies it.
- `npm run krillion -- today` retrieves today's seven questions.
- `npm run probe:protocol -- --effort high --mode sequential` runs a live subscription-backed development probe.
- `npm run pilot -- prepare` freezes the paid-pilot plan; `run` dispatches it.

`--prompt-ids` selects shared questions. Journals stay in ignored `.local/runs/`.

## Coding style and naming conventions

Use Oxfmt, camelCase names, and erasable TypeScript. Preserve upstream IDs. Validate external JSON. Keep submission logic outside UI components.

Use Fluid type roles and weights with Stack Sans Text, the pill shape preset, and Hugeicons. Preserve reduced motion and timings. Check desktop, mobile, and keyboard use.

Use Fluid Functionalism atomic components for controls and metadata. Reuse the installed components in `src/components/ui/`. Install the matching official Fluid registry component before making a custom atomic control. Do not recreate buttons, badges, disclosures, fields, or other available Fluid primitives with one-off HTML and CSS. Compose domain layouts around the primitives. Use `asChild` or `render` for links so they retain anchor semantics. In Server Components, pass Next.js `Link` as the Button child, including hash anchors. Construct native Button anchors inside a Client Component when browser focus behavior is required, as in `SkipLink`. Check the hydrated DOM for nested interactive elements. Keep native text links and structural HTML where no Fluid primitive is needed. Configure shapes and icons through the shared providers. Map every icon role used by a new Fluid component to Hugeicons in the app provider. Preserve the approved tokens and installed motion behavior.

Read `DESIGN.md` before UI changes. It defines the approved ocean-blue home-page aesthetic and the shared visual rules. `docs/design/home-preview.md` records implementation guidance and sources.

## Benchmark protocol

Use OpenRouter for official evaluations. Subscription-backed Astra, Sol, Terra, and Luna through VibeProxy are development tests only.

Compare shared questions without web search. Allow five substantive answers and stop at first acceptance. Verified equivalent corrections stay within the same attempt. Compare sequential and ordered-list costs before selecting the public protocol.

Rank model and thinking configurations separately by mean native points, including completed misses. Keep ties. Record requested and verified effective settings, prompts, routes, usage, and scoring versions.

## Testing guidelines

Name tests `*.test.ts`. Use synthetic fixtures and local HTTP servers. Keep live calibration separate. Transport failures are incomplete. Do not retry submissions automatically.

## Commit and pull request guidelines

Use imperative commit subjects. Describe changes and checks in pull requests. Include UI screenshots and methodology changes.

## Configuration and release

The paid pilot has one US$10 cap. No recurring budget is approved. Keep credentials out of source and browser bundles. Resolve historical access and public content reuse before release.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
