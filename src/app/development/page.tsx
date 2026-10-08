import Link from "next/link";
import { notFound } from "next/navigation";
import { DailyResults } from "@/components/daily-results";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readDevelopmentResults } from "@/evaluation/load-development-runs";
import { fontWeights } from "@/lib/font-weight";
import { typeClass } from "@/lib/type-scale";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "GPT development results | Krillion Bench",
  robots: { index: false, follow: false },
};
const headingWeight = { fontVariationSettings: fontWeights.semibold };

export default async function DevelopmentPage() {
  if (process.env.KRILLION_DEV_RESULTS !== "1") notFound();
  const runs = await readDevelopmentResults();
  const questions = runs?.questions ?? [];
  const evaluations = runs?.evaluations ?? [];
  const rows = runs?.rows ?? [];
  return (
    <SiteShell>
      <div className="introduction">
        <h1 className={typeClass("display")} style={{ fontVariationSettings: fontWeights.bold }}>
          GPT development results
        </h1>
        <p className={typeClass("subtitle")}>
          Astra, Sol, Terra, and Luna. Saved subscription tests through VibeProxy.
        </p>
      </div>
      {!runs ? (
        <section className="methodology">
          <h2 className={typeClass("title")} style={headingWeight}>
            Saved results unavailable
          </h2>
          <p>
            The two local development journals are missing or invalid. No results were substituted.
          </p>
          <p>
            <Link href="/#results">Back to example results</Link>
          </p>
        </section>
      ) : (
        <>
          <section className="development-section" aria-labelledby="development-summary-title">
            <div className="section-heading">
              <h2
                id="development-summary-title"
                className={typeClass("title")}
                style={headingWeight}
              >
                Shared-question summary
              </h2>
              <Badge>Development only</Badge>
            </div>
            <p className={`section-note ${typeClass("body")}`}>
              {evaluations.length} evaluations on {questions.length} shared questions dated{" "}
              {questions[0].date}. Thinking settings and output ceilings are requested, not
              verified. {rows.reduce((total, row) => total + row.pending, 0)} corrections remain
              pending. This small sample does not establish model rankings or a thinking advantage.
            </p>
            <ul className="development-summary">
              {rows.map((row) => (
                <li key={`${row.model}-${row.requestedEffort}-${row.mode}`}>
                  <h3 className={typeClass("subtitle")} style={headingWeight}>
                    {row.model}{" "}
                    <span className="model-setting">{row.requestedEffort} requested</span>
                  </h3>
                  <dl className={typeClass("body")}>
                    <div>
                      <dt>Scored coverage</dt>
                      <dd>
                        {row.scored} / {row.expected}
                      </dd>
                    </div>
                    <div>
                      <dt>Accepted</dt>
                      <dd>
                        {row.accepted} / {row.expected}
                      </dd>
                    </div>
                    <div>
                      <dt>Correction review</dt>
                      <dd>{row.pending}</dd>
                    </div>
                    <div>
                      <dt>Mean native points</dt>
                      <dd>
                        {row.meanPoints === null ? "Pending coverage" : row.meanPoints.toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            <p className={`section-note ${typeClass("body")}`}>
              Means appear only when every shared question has a score. Pending answers are not
              dropped or counted as zero. No ranks are assigned. Official results will use
              OpenRouter. Subscription USD cost is unknown.
            </p>
          </section>
          <nav
            className={`date-navigation ${typeClass("body")}`}
            aria-label="Development questions"
          >
            <p className={typeClass("caption")}>Inspect each question</p>
            <ul>
              {questions.map((question, index) => (
                <li key={question.promptId}>
                  <Button asChild variant="tertiary" className="min-h-11">
                    <Link href={`#question-${question.promptId}`}>Question {index + 1}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
          {questions.map((question, index) => (
            <section
              className="development-section"
              id={`question-${question.promptId}`}
              key={question.promptId}
              aria-labelledby={`question-title-${question.promptId}`}
            >
              <h2
                id={`question-title-${question.promptId}`}
                className={typeClass("title")}
                style={headingWeight}
              >
                Question {index + 1}
              </h2>
              <DailyResults
                question={question}
                evaluations={evaluations.filter(
                  (evaluation) =>
                    evaluation.question.date === question.date &&
                    evaluation.question.promptId === question.promptId,
                )}
                source="development"
              />
            </section>
          ))}
          <p className={`page-link ${typeClass("body")}`}>
            <Link href="/methodology">Read the methodology</Link>
          </p>
        </>
      )}
    </SiteShell>
  );
}
