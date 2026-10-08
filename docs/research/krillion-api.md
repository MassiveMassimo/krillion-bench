# Krillion daily API

Verified on 8 October 2026. This report describes a small calibration check, not a model benchmark. No model calls or paid requests were made.

## Headless operation

`GET https://krillion.io/api/today` returns the day's date, number, reset time, and seven `{ id, text }` prompts. A browser is not needed for retrieval or the tested submissions. Use `createKrillionClient` from `src/krillion/client.ts`, or run:

```sh
npm run krillion -- today
npm run krillion -- submit 2026-10-08 p1 "Porsche" YOUR_PLAYER_ID
```

The example is a calibration answer for that date, not a reusable answer to future questions. Supply one guest player ID for a run. Do not use a real player's ID.

`POST /api/submit` accepts this JSON body:

```json
{
  "date": "2026-10-08",
  "promptId": "p1",
  "answer": "Porsche",
  "previewCorrection": true,
  "playerId": "YOUR_PLAYER_ID"
}
```

Observed server responses were:

```json
{"accepted":true,"answer":"Porsche","tier":"plankton","score":10}
{"accepted":false,"correction":"Porsche"}
{"accepted":false}
```

The correction followed `Porshe`. The rejection followed a deliberately invalid calibration string. These requests used one temporary guest ID and today's first question. Five submissions were made, including a later distinct accepted answer. No completion, reveal, or archive endpoint was called.

The client returns `accepted`, `correction`, or `rejected` variants. A correction is not acceptance. The caller must verify equivalence before submitting a canonical spelling. `--no-preview` disables the suggestion preview for an explicit submission; it does not verify equivalence.

## Timer evidence

The current [browser constants](https://krillion.io/_next/static/chunks/0wdoc6vx14ro-.js) define a 3-second preview and a 25-second answer window. The [daily client](https://krillion.io/_next/static/chunks/3sal4x18nzbdb.js) sends no deadline in the submission body.

| Calibration event             | UTC timestamp | Result                        |
| ----------------------------- | ------------- | ----------------------------- |
| Initial `Porsche` submission  | 08:16:46.160  | HTTP 200, accepted, 10 points |
| Repeated `Porsche` submission | 08:23:14.062  | Accepted, 10 points           |

The repeated request occurred 387,902 milliseconds after the first request, or 6 minutes 27.902 seconds. A different candidate, `Ferrari`, was accepted at 08:30:40.229 UTC, 834,069 milliseconds after the first request, or 13 minutes 54.069 seconds. Both requests used the same date, question, and guest ID through the implemented HTTP client. No browser timer was created or modified.

The tested daily endpoint therefore accepted both a repeated answer and a new candidate beyond the browser window. This supports an untimed adapter for this question on this date. It does not establish all-question repeatability, historical access, permission for public reuse, or a permanent API guarantee. A daily reset may impose a separate limit. Keep the submitted date explicit.

## Contract and error handling

The adapter validates seven distinct question IDs, verdict shapes, known native tiers, and matching point values. It mirrors the browser's fallback to tier points and the raw answer when those optional response fields are absent. Unknown tiers or changed points produce a contract error so scoring changes need review.

HTTP errors, malformed JSON, timeouts, and network failures throw `KrillionApiError`. They are incomplete operations, not game rejections. The adapter does not retry POST requests automatically. Idempotency and rate-limit guarantees remain undocumented. The [privacy policy](https://krillion.io/privacy) describes IP rate limits against scripted abuse.

## Checks and next step

```sh
npm test
npm run typecheck
npm run lint
npm run format:check
```

Automated tests use synthetic fixtures and a local HTTP server. They do not contact Krillion. The live calibration is separate evidence.

All 18 offline tests, TypeScript checks, Oxlint, and Oxfmt checks passed. Temporarily inverting the acceptance condition caused five tests to fail; the condition was restored. An independent review approved the slice with no required findings. The review's repeated-answer limitation prompted the distinct-answer timing check above.

Installed development tools occupy about 62 MB in ignored `node_modules/`. They remain for subsequent work. No build targets or raw network logs were created.

The [development probe](protocol-cost-probe.md) now compares one-at-a-time and ordered-list generation, plus requested low and high thinking levels, on one matched question. These results stay outside the public leaderboard. Next, measure representative public configurations and actual OpenRouter costs before selecting one public protocol. The US$10 public pilot budget remains unspent.
