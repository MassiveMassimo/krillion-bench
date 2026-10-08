import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { displayEvaluation, type DailyResult } from "@/evaluation/display";
import type { Evaluation, Question } from "@/evaluation/records";
import { fontWeights } from "@/lib/font-weight";
import { typeClass } from "@/lib/type-scale";

const headingWeight = { fontVariationSettings: fontWeights.semibold };

function AttemptHistory({ row }: { row: DailyResult }) {
  return (
    <Accordion
      type="single"
      collapsible
      size="compact"
      className={`attempt-history w-full ${typeClass("caption")}`}
    >
      <AccordionItem value="history" highlight="trigger">
        <AccordionTrigger className="min-h-11">
          {row.attempts} of 5 answers checked
        </AccordionTrigger>
        <AccordionContent>
          {row.history.length > 0 && (
            <ol>
              {row.history.map((entry) => (
                <li key={entry.attempt}>
                  <span className="history-answer">{entry.answer}</span>
                  <span>{entry.result}</span>
                  {entry.correction && (
                    <span>Suggested: {entry.correction}. Equivalence is not verified.</span>
                  )}
                  {entry.correctionReview && (
                    <span>
                      {entry.correctionReview.decision === "equivalent"
                        ? "Equivalent wording verified within this answer attempt."
                        : "Suggestion changes the answer. No correction credit was awarded."}{" "}
                      {entry.correctionReview.evidence}
                    </span>
                  )}
                  {entry.canonicalAnswer && entry.canonicalAnswer !== entry.answer && (
                    <span>Accepted as: {entry.canonicalAnswer}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
          {row.outcome === "incomplete" && (
            <p>
              {row.failureStage === "submission"
                ? "Submission failed. No game verdict was recorded for the generated answer."
                : "Generation did not complete. No final score is available."}
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Answer({ row }: { row: DailyResult }) {
  return (
    <>
      <span className={typeClass("subtitle")}>{row.answer ?? "No answer recorded"}</span>
      {row.uncheckedAnswers.length > 0 && (
        <span className={`answer-note ${typeClass("caption")}`}>
          Generated; no recorded verdict
        </span>
      )}
      <AttemptHistory row={row} />
    </>
  );
}

export function DailyResults({
  question,
  evaluations,
  source = "synthetic",
}: {
  question: Question;
  evaluations: Evaluation[];
  source?: "synthetic" | "development";
}) {
  const rows = evaluations.map(displayEvaluation);
  return (
    <div className="results-surface">
      <div className="question">
        <h3 className={typeClass("title")} style={headingWeight}>
          {question.text}
        </h3>
        <p className={typeClass("body")}>
          {source === "synthetic" ? "Example date" : "Evaluation date"}:{" "}
          <time dateTime={question.date}>{question.date}</time>. Each model and thinking setting is
          a separate entry.
        </p>
      </div>
      <div className="desktop-results">
        <Table
          aria-label={`${source === "synthetic" ? "Synthetic" : "Development"} answers to ${question.text}`}
          size="default"
        >
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Model / thinking</TableHead>
              <TableHead scope="col">Model answer / attempts</TableHead>
              <TableHead scope="col">Native tier</TableHead>
              <TableHead scope="col" className="points-column">
                Points
              </TableHead>
              <TableHead scope="col">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow index={index} key={`${row.model}-${row.requestedThinking}`}>
                <TableHead scope="row" className="model-cell">
                  <span style={headingWeight}>{row.model}</span>
                  <span className="model-setting">{row.requestedThinking} requested</span>
                </TableHead>
                <TableCell className="answer-cell">
                  <Answer row={row} />
                </TableCell>
                <TableCell>{row.tier ?? "Unassigned"}</TableCell>
                <TableCell className="points-column">
                  <span className={row.points === null ? "pending" : undefined}>
                    {row.pointsLabel}
                  </span>
                </TableCell>
                <TableCell>{row.resultLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul
        className="mobile-results"
        aria-label={`${source === "synthetic" ? "Synthetic" : "Development"} answers to ${question.text}`}
      >
        {rows.map((row) => (
          <li key={`${row.model}-${row.requestedThinking}`}>
            <div className="mobile-row-heading">
              <h4 className={typeClass("subtitle")} style={headingWeight}>
                {row.model}
              </h4>
              <span className={typeClass("body")}>{row.requestedThinking} requested</span>
            </div>
            <dl className={typeClass("body")}>
              <div>
                <dt>Model answer</dt>
                <dd>{row.answer ?? "No answer recorded"}</dd>
              </div>
              <div>
                <dt>Native points</dt>
                <dd className="numeric">{row.pointsLabel}</dd>
              </div>
              <div>
                <dt>Native tier</dt>
                <dd>{row.tier ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt>Result</dt>
                <dd>{row.resultLabel}</dd>
              </div>
            </dl>
            {row.uncheckedAnswers.length > 0 && (
              <p className={`answer-note ${typeClass("caption")}`}>
                Generated; no recorded verdict
              </p>
            )}
            <AttemptHistory row={row} />
          </li>
        ))}
      </ul>
      <div className={`result-footnote ${typeClass("caption")}`}>
        <p>
          Thinking labels show requested settings. Effective settings are unverified. These records
          use sequential generation.
        </p>
        <p>
          Pending corrections and incomplete records have no score. Completed misses score zero.{" "}
          {source === "synthetic"
            ? "Cost and latency are not measured in synthetic data."
            : "These are subscription development tests. USD cost is unknown."}
        </p>
      </div>
    </div>
  );
}
