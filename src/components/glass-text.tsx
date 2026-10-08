"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";

type GlyphPosition = { text: string; x: number; y: number };

export function GlassText({ children }: { children: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const clipId = useId();
  const [glyphs, setGlyphs] = useState<GlyphPosition[]>([]);
  const words = children.split(" ");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const bounds = root.getBoundingClientRect();
      // Use native text wrapping and baselines to align the SVG letter clip.
      setGlyphs(
        Array.from(root.querySelectorAll<HTMLElement>("[data-glass-word]"), (word) => {
          const baseline = word.querySelector<HTMLElement>("[data-glass-baseline]")!;
          return {
            text: word.textContent ?? "",
            x: word.getBoundingClientRect().left - bounds.left,
            y: baseline.getBoundingClientRect().top - bounds.top,
          };
        }),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [children]);

  return (
    <span ref={rootRef} className="hero-muted relative block w-fit max-w-full text-on-gradient/45">
      <svg aria-hidden="true" className="pointer-events-none absolute size-0">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {glyphs.map(({ text, x, y }, index) => (
              <text key={index} x={x} y={y}>
                {text}
              </text>
            ))}
          </clipPath>
        </defs>
      </svg>
      {glyphs.length > 0 && (
        // Clip only the backdrop layer. The HTML label stays sharp and selectable.
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 backdrop-blur-md"
          style={{ clipPath: `url(#${clipId})` }}
        />
      )}
      <span className="relative">
        {words.map((word, index) => (
          <Fragment key={index}>
            {index > 0 && " "}
            <span data-glass-word>
              {word}
              <span aria-hidden="true" data-glass-baseline className="inline-block h-0 w-0" />
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
