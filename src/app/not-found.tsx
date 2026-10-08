import { DateNavigation } from "@/components/date-navigation";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { fontWeights } from "@/lib/font-weight";
import { typeClass } from "@/lib/type-scale";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="introduction">
        <h1 className={typeClass("display")} style={{ fontVariationSettings: fontWeights.bold }}>
          No saved results here
        </h1>
        <p className={typeClass("subtitle")}>
          This preview contains saved synthetic examples only. Choose an available example date.
        </p>
      </div>
      <DateNavigation />
      <p className={`page-link ${typeClass("body")}`}>
        <Link href="/#results">Back to results</Link>
      </p>
    </SiteShell>
  );
}
