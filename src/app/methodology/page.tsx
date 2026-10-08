import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { tierLabels } from "@/evaluation/display";
import { TIER_POINTS, type Tier } from "@/krillion/client";
import { fontWeights } from "@/lib/font-weight";
import { typeClass } from "@/lib/type-scale";

export const metadata: Metadata = { title: "Methodology | Krillion Bench" };
const headingWeight = { fontVariationSettings: fontWeights.semibold };

export default function Methodology() {
  return (
    <SiteShell>
      <div className="introduction">
        <h1 className={typeClass("display")} style={{ fontVariationSettings: fontWeights.bold }}>
          Methodology
        </h1>
        <p className={typeClass("subtitle")}>
          What native points, answer attempts, and thinking settings can tell you.
        </p>
      </div>
      <div className={`methodology-content ${typeClass("body")}`}>
        <section aria-labelledby="measure-title">
          <h2 id="measure-title" className={typeClass("title")} style={headingWeight}>
            What is measured
          </h2>
          <p>
            Krillion Bench tests broad world knowledge through valid, obscure answers. Models use
            their internal knowledge without web search or tools. Every question starts with a fresh
            conversation. Points follow Krillion’s game judgments. Acceptance is not an independent
            check of factual correctness.
          </p>
        </section>
        <section aria-labelledby="tiers-title">
          <h2 id="tiers-title" className={typeClass("title")} style={headingWeight}>
            Native tiers
          </h2>
          <p>The benchmark preserves the tier and points from the first accepted answer.</p>
          <dl className="tier-scale">
            {Object.entries(TIER_POINTS).map(([tier, points]) => (
              <div key={tier}>
                <dt>{tierLabels[tier as Tier]}</dt>
                <dd>{points} points</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="attempts-title">
          <h2 id="attempts-title" className={typeClass("title")} style={headingWeight}>
            Attempts and corrections
          </h2>
          <p>
            A model can give up to five substantive answers. Evaluation stops at the first
            acceptance. Five rejected answers form a completed miss with zero points. A verified
            equivalent spelling or phrasing correction stays within the same attempt. Unverified
            suggestions remain pending review and have no score.
          </p>
          <p>
            A transport failure or unfinished generation is incomplete. It does not count as a
            knowledge miss. The pilot compares separate sequential requests with five ordered
            answers in one response. The public attempt policy is not fixed yet.
          </p>
        </section>
        <section aria-labelledby="thinking-title">
          <h2 id="thinking-title" className={typeClass("title")} style={headingWeight}>
            Thinking and shared coverage
          </h2>
          <p>
            Each model and thinking configuration has a separate entry. Requested settings and
            verified effective settings are distinct. The same effort label does not prove an equal
            reasoning budget across models. Unverified settings stay labeled as such.
          </p>
          <p>
            Planned rankings use mean native points on a declared shared question set. Completed
            misses count as zero. Equal scores retain equal ranks. Incomplete coverage and pending
            corrections must stay visible before a comparison can become final.
          </p>
        </section>
        <section aria-labelledby="sources-title">
          <h2 id="sources-title" className={typeClass("title")} style={headingWeight}>
            Result sources and costs
          </h2>
          <p>
            This preview shows invented examples. Their cost and latency are not measured.
            Subscription-backed model runs are development tests. Official evaluations will use
            OpenRouter under recorded conditions. No official results have been published yet.
          </p>
          <p>
            The initial paid pilot has one US$10 cap. No recurring spending is approved. Thinking
            tokens form part of billed completion tokens and are not added a second time. Cost and
            elapsed time are separate measurements; they do not change the native score.
          </p>
        </section>
        <p className="page-link">
          <Link href="/#results">View example answers</Link>
        </p>
      </div>
    </SiteShell>
  );
}
