import { notFound } from "next/navigation";
import Link from "next/link";
import { DailyResults } from "@/components/daily-results";
import { DateNavigation } from "@/components/date-navigation";
import { Badge } from "@/components/ui/badge";
import { SiteShell } from "@/components/site-shell";
import { getSavedDay, savedDates } from "@/evaluation/saved-days";
import { fontWeights } from "@/lib/font-weight";
import { typeClass } from "@/lib/type-scale";

export const dynamicParams = false;

export function generateStaticParams() {
  return savedDates.map((date) => ({ date }));
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return { title: `Example day ${date} | Krillion Bench` };
}

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const day = getSavedDay(date);
  if (!day) notFound();
  return (
    <SiteShell>
      <div className="introduction">
        <h1 className={typeClass("display")} style={{ fontVariationSettings: fontWeights.bold }}>
          Example day
        </h1>
        <p className={typeClass("subtitle")}>
          <time dateTime={date}>{date}</time>. Invented answers show how saved results will appear.
        </p>
      </div>
      <DateNavigation currentDate={date} />
      <section aria-labelledby="daily-title" className="daily-page-results">
        <div className="section-heading">
          <h2
            id="daily-title"
            className={typeClass("title")}
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Model answers
          </h2>
          <Badge>Synthetic example</Badge>
        </div>
        <p className={`section-note ${typeClass("body")}`}>
          These records do not measure real model performance. No live daily answers are published.
        </p>
        <DailyResults question={day.question} evaluations={day.evaluations} />
        <p className={`page-link ${typeClass("body")}`}>
          <Link href="/methodology">Read the methodology</Link>
        </p>
      </section>
    </SiteShell>
  );
}
