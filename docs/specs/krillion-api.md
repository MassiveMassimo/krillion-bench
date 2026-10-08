# Krillion daily API extraction

## Objective and scope

Build a small headless client for today's questions and answer submission. Use ordinary daily-game requests. Determine whether a browser timer is required by the server before selecting sequential or ordered generation. This work adds no frontend, model calls, paid archive access, deployment, or scheduled runs.

## Contract

- `GET /api/today` returns `date`, `dayNumber`, `resetsAt`, and seven `{ id, text }` prompts.
- `POST /api/submit` sends `date`, `promptId`, `answer`, `previewCorrection`, and `playerId`.
- Represent correction, acceptance, and rejection as distinct results. Never accept a suggested correction automatically.
- Validate external JSON. Preserve the server's canonical answer, tier, and score. Report HTTP failures, malformed responses, and timeouts as errors rather than knowledge misses.
- Do not retry submissions automatically. Server idempotency is not documented.

## Implementation and commands

Use TypeScript with Node.js 24 native type stripping, built-in `fetch`, and `node:test`. No runtime dependencies are needed. Native execution does not replace TypeScript type checking.

Files are `src/krillion/client.ts`, `tests/krillion-client.test.ts`, `tests/krillion-cli.test.ts`, and `scripts/krillion.ts`. Tests use synthetic fixtures and a local HTTP server. The command-line script offers question retrieval and explicit answer submission.

Commands:

```sh
npm test
npm run typecheck
npm run lint
npm run format:check
npm run krillion -- today
npm run krillion -- submit DATE PROMPT_ID "ANSWER" PLAYER_ID
```

Use descriptive camelCase names and erasable TypeScript types. For example, `type Verdict = { kind: 'rejected' } | { kind: 'correction'; correction: string } | { kind: 'accepted'; answer: string; tier: string; score: number }`.

## Verification and boundaries

1. Run a failing contract test before implementing the client.
2. Test valid questions and each observed verdict. Test malformed JSON, HTTP 403/429, and timeout behavior without external network calls.
3. Retrieve today's questions through the real client.
4. Make a few calibration submissions with one temporary guest player ID. Do not complete the dive or submit leaderboard records.
5. Repeat a calibration answer after the browser answer window expires. Record elapsed time and actual server responses. Describe this as observed daily behavior, not a permanent service guarantee.

Always preserve first-acceptance and correction semantics. Respect access and rate-limit responses. Ask before paid access, creator contact, or a public content release. Never call protected archive, reveal, or completion routes in this slice. Do not evade authentication or rate limits.

## Acceptance

The client runs without a browser and passes its offline tests. The research report records real request shapes, observed verdicts, and timer evidence. If ordinary submission is denied, report that limit and keep the adapter's error behavior correct. Do not claim untimed support without a delayed accepted response.
