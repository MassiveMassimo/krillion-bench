import type { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { fontWeights } from "@/lib/font-weight";
import { typeClass } from "@/lib/type-scale";
import { OceanParticles } from "@/components/ocean-particles";
import { SkipLink } from "@/components/skip-link";
import parallax from "@/components/ocean-parallax.module.css";

export function SiteShell({ children, ocean = false }: { children: ReactNode; ocean?: boolean }) {
  return (
    <div className={ocean ? "site-frame site-frame--ocean" : "site-frame"}>
      {ocean && (
        <div
          aria-hidden="true"
          className={`ocean-backdrop ${parallax.gradient} bg-radial-[ellipse_160%_100%_at_50%_0%_in_oklab] from-gradient-start from-10% via-gradient-crest via-78% to-background`}
        >
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b/oklab from-gradient-start to-transparent" />
        </div>
      )}
      <SkipLink />
      {ocean && <OceanParticles />}
      <div className="page-shell">
        <header className="masthead">
          <Link
            className={`wordmark ${typeClass("title")}`}
            href="/"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Krillion Bench
          </Link>
          <nav aria-label="Main navigation" className={typeClass("body")}>
            <Link href="/#results">Results</Link>
            <Link href="/methodology">Method</Link>
          </nav>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className={typeClass("caption")}>
          <p>Official results will use OpenRouter. No official results have been published yet.</p>
          <a className="external-link" href="https://krillion.io/">
            Play Krillion
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={14}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </a>
        </footer>
      </div>
    </div>
  );
}
