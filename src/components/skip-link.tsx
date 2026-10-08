"use client";

import { Button } from "@/components/ui/button";

export function SkipLink() {
  return (
    <Button asChild className="skip-link min-h-11">
      <a href="#main-content">Skip to content</a>
    </Button>
  );
}
