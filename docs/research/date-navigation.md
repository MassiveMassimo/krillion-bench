# Saved dates and methodology

Verified on 2026-10-08. Task 9's synthetic visitor path is complete. Public answer reveal and final methodology still depend on the paid pilot, public protocol, and content-access decision.

## Implemented behavior

The home page links to `/day/2026-10-01`. The saved-day registry contains only the existing invented example. The active date uses `aria-current="date"`. No private evaluation journals are imported into the frontend.

The dated page uses the same question and five evaluations as the home page. Native points remain 10, 85, pending, zero, and unscored. A missing or invalid date returns HTTP 404. Its recovery page links to the available example and home results. It never substitutes another day's answers.

`/methodology` explains native tiers, first acceptance, five substantive answers, verified equivalent corrections, pending review, completed misses, incomplete records, separate thinking configurations, requested versus effective controls, and the US$10 initial cap. It labels ranking rules as planned and generation policy as undecided. Native tier values come from the shared scoring constants.

The shared shell preserves the current font, shape tokens, icons, and motion. Internal page links use Next.js Link. The native skip link moves focus to the main region. No new dependency or service was added.

## Verification

- All 78 offline tests passed. Two saved-day tests check provenance, question identity, expected scores, unique dates, and unavailable-date behavior.
- TypeScript, Oxlint, Oxfmt, and the production build passed. React Doctor's error gate passes with its 15 existing warnings.
- The build reports missing fallback-font metrics for Stack Sans Text. The selected font rendered in the browser; fallback metrics remain unresolved.
- The design reviewer found no required changes. Browser QA found and fixed a skip-link focus issue.
- Keyboard Enter followed date and methodology links, opened the three-answer history, and recovered from the missing-date page. The history showed two rejections before acceptance.
- The dated page had no document overflow at 320, 768, 1024, or 1440 px. The 320 px view used the mobile response list. Methodology also fit at 320 px. Date targets measured 44 px high.
- Home, example day, and methodology returned 200. Missing and invalid dates returned 404. Normal-route console checks returned no warnings or errors. The viewport override was reset.

Native Safari, VoiceOver, physical touch devices, and actual 200% zoom remain untested. No live results, overall ranking, inference, deployment, scheduling, or publication occurred.

The local preview remains available on port 4310. Retained artifacts are the shared `.next` build/cache (about 171 MB), installed dependencies (about 768 MB), existing private journals (84 KB), and the preserved design cache (8 KB). The generated `.impeccable/hook.cache.json` is ignored so it does not enter commits or formatting checks.
