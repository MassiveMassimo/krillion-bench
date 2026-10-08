import Link from "next/link";
import { connection } from "next/server";
import { HeroActions } from "@/components/hero-actions";
import { DailyResults } from "@/components/daily-results";
import { DateNavigation } from "@/components/date-navigation";
import { ModelComparison } from "@/components/model-comparison";
import { GlassText } from "@/components/glass-text";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { syntheticDay } from "@/evaluation/fixtures";
import { readDevelopmentResults } from "@/evaluation/load-development-runs";
import { fontWeights } from "@/lib/font-weight";
import { typeClass } from "@/lib/type-scale";

const headingWeight = { fontVariationSettings: fontWeights.semibold };

export default async function Home() {
  // Check the local opt-in at request time. Private results never enter prerendered HTML.
  await connection();
  const developmentEnabled = process.env.KRILLION_DEV_RESULTS === "1";
  const results = await readDevelopmentResults();
  return (
    <SiteShell ocean>
      <div className="introduction ocean-introduction">
        <h1
          className="hero-title max-w-[24ch] text-[length:var(--hero-title-size)] leading-[var(--hero-title-leading)] tracking-[var(--hero-title-tracking)] text-balance"
          style={headingWeight}
        >
          <GlassText>General knowledge</GlassText> <GlassText>benchmark for LLMs</GlassText>{" "}
          <span className="block">on Krillion.io</span>
        </h1>
        <HeroActions githubHref="https://github.com/MassiveMassimo/krillion-bench" />
      </div>
      <section id="results" className="comparison-section" aria-labelledby="results-title">
        <div className="comparison-heading">
          <div className="section-heading">
            <h2 id="results-title" className={typeClass("title")} style={headingWeight}>
              {developmentEnabled ? "Model comparison" : "Benchmark results"}
            </h2>
            <Badge>{developmentEnabled ? "Development sample" : "Public runs pending"}</Badge>
          </div>
          {results && (
            <p className={"section-note " + typeClass("body")}>
              <time dateTime={results.questions[0].date}>{results.questions[0].date}</time>.{" "}
              {results.rows.length} model configurations, {results.questions.length} shared
              questions, {results.evaluations.length} saved evaluations.
            </p>
          )}
        </div>
        {results ? (
          <>
            <ModelComparison rows={results.rows} />
            <div className={"result-footnote " + typeClass("caption")} id="comparison-note">
              <p>
                Mean Krillion points out of 100 on the same questions. Higher is better. Completed
                misses count as zero. Pending results have no final mean.
              </p>
              <p>
                Subscription tests through VibeProxy. Thinking settings are requested and
                unverified. No official ranks are assigned. Cost is unknown.
              </p>
            </div>
            <div className="answer-evidence">
              <div className="section-heading">
                <h2 className={typeClass("title")} style={headingWeight}>
                  Inspect the answers
                </h2>
                <Link className={typeClass("body")} href="/development">
                  All development results
                </Link>
              </div>
              <p className={"section-note " + typeClass("body")}>
                See each model's exact answer, attempts, corrections, and native score.
              </p>
              <nav aria-label="Saved development questions">
                <ul className="evidence-questions">
                  {results.questions.map((question, index) => (
                    <li key={question.promptId}>
                      <Button asChild variant="tertiary" className="evidence-question min-h-11">
                        <Link
                          href={"/development#question-" + question.promptId}
                          aria-label={
                            "Question " + (index + 1) + ": " + question.text + ". View answers"
                          }
                        >
                          <span className={"evidence-number " + typeClass("caption")}>
                            0{index + 1}
                          </span>
                          <span className={typeClass("body")}>{question.text}</span>
                          <span className={"evidence-action " + typeClass("caption")}>
                            View answers
                          </span>
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </>
        ) : (
          <div className="benchmark-empty">
            <h3 className={typeClass("subtitle")} style={headingWeight}>
              {developmentEnabled
                ? "Saved development results unavailable"
                : "The first public comparison is in preparation"}
            </h3>
            <p className={typeClass("body")}>
              {developmentEnabled
                ? "The local records are missing or invalid. No model scores were substituted."
                : "Official evaluations will use OpenRouter. Models will answer the same questions without web search, with separate entries for each thinking setting."}
            </p>
            <Button asChild variant="secondary" className="min-h-11">
              <Link href="#example-results">Explore the example</Link>
            </Button>
          </div>
        )}
      </section>
      {!results && (
        <section
          id="example-results"
          className="comparison-section example-section"
          aria-labelledby="example-title"
        >
          <div className="comparison-heading">
            <div className="section-heading">
              <h2 id="example-title" className={typeClass("title")} style={headingWeight}>
                Answer example
              </h2>
              <Badge>Synthetic example</Badge>
            </div>
            <p className={"section-note " + typeClass("body")}>
              Invented records demonstrate the answer history. They do not measure model
              performance.
            </p>
            <DateNavigation />
          </div>
          <DailyResults question={syntheticDay.question} evaluations={syntheticDay.evaluations} />
        </section>
      )}
      <section id="method" className="method" aria-labelledby="method-title">
        <div className="method-intro">
          <h2 id="method-title" className={typeClass("title")} style={headingWeight}>
            What this benchmark tests
          </h2>
          <p className={typeClass("body")}>
            Recall a valid answer, then find one few people know. Krillion rewards accepted answers
            by rarity. Models get no web search and up to five substantive answers.
          </p>
          <Link className={"method-link " + typeClass("body")} href="/methodology">
            Read the full methodology
          </Link>
        </div>
        <dl className={"method-rules " + typeClass("body")}>
          <div>
            <dt style={headingWeight}>The same questions</dt>
            <dd>
              Compare models on a shared set. Each thinking configuration is a separate entry.
              Evaluation stops at the first accepted answer.
            </dd>
          </div>
          <div>
            <dt style={headingWeight}>Equivalent wording stays in one attempt</dt>
            <dd>
              Verified spelling or wording corrections cost no extra attempt. A suggestion that
              changes the answer receives no free credit.
            </dd>
          </div>
          <div>
            <dt style={headingWeight}>Native points, with ties</dt>
            <dd>
              Mean points include completed misses at zero. Incomplete results remain unscored. Game
              acceptance is not an independent fact check. Equal scores remain tied.
            </dd>
          </div>
        </dl>
      </section>
    </SiteShell>
  );
}
