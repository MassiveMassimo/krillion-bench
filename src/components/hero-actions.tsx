"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { IconComponentProps } from "@/lib/icon-context";

function GitHubMark(props: IconComponentProps) {
  return <HugeiconsIcon icon={GithubIcon} {...props} aria-hidden="true" />;
}

export function HeroActions({ githubHref }: { githubHref: string }) {
  return (
    <div className="hero-actions">
      <Button asChild leadingIcon={GitHubMark} className="min-h-11">
        <a href={githubHref}>GitHub</a>
      </Button>
      <Button asChild variant="secondary" className="min-h-11 backdrop-blur-md">
        <a href="https://krillion.io/">Play Krillion</a>
      </Button>
    </div>
  );
}
