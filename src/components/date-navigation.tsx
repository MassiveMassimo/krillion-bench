import { savedDates } from "@/evaluation/saved-days";
import Link from "next/link";
import { typeClass } from "@/lib/type-scale";
import { Button } from "@/components/ui/button";

export function DateNavigation({ currentDate }: { currentDate?: string }) {
  return (
    <nav aria-label="Saved example dates" className={`date-navigation ${typeClass("body")}`}>
      <p className={typeClass("caption")}>Saved example dates</p>
      <ul>
        {savedDates.map((date) => (
          <li key={date}>
            <Button asChild variant="tertiary" active={date === currentDate} className="min-h-11">
              <Link href={`/day/${date}`} aria-current={date === currentDate ? "date" : undefined}>
                <time dateTime={date}>{date}</time>
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
