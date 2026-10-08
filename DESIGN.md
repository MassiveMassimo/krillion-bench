---
version: alpha
name: Krillion Bench
description: Ocean-blue editorial framing around clear, saved model comparisons.
colors:
  background: "#ffffff"
  foreground: "#171717"
  muted-foreground: "#595959"
  muted: "#f5f5f5"
  destructive: "#b91c1c"
  destructive-light: "#fef2f2"
  border: "#dedede"
  card: "#ffffff"
  hover: "rgb(0 0 0 / 0.04)"
  active: "rgb(0 0 0 / 0.07)"
  selected: "#d4d4d4"
  focus-ring: "#171717"
  gradient-start: "#020e1c"
  gradient-crest: "#087dda"
  on-gradient: "#ffffff"
  on-gradient-muted: "#c3d7ea"
  on-gradient-action: "#ffffff"
  gradient-action-foreground: "#031b35"
  gradient-action-secondary: "rgb(255 255 255 / 0.12)"
  gradient-action-border: "rgb(255 255 255 / 0.24)"
typography:
  sans:
    fontFamily: Stack Sans Text
  hero:
    fontSize: 56px
    lineHeight: 1.04
    fontWeight: 400
    letterSpacing: -0.045em
  display:
    fontSize: 28px
    lineHeight: 34px
    fontWeight: 550
  title:
    fontSize: 16px
    lineHeight: 22px
    fontWeight: 400
  subtitle:
    fontSize: 14px
    lineHeight: 20px
    fontWeight: 300
  body:
    fontSize: 13px
    lineHeight: 20px
    fontWeight: 300
  caption:
    fontSize: 12px
    lineHeight: 16px
    fontWeight: 300
rounded:
  input: 20px
  container: 24px
  full: 9999px
---

## Overview

Krillion Bench compares saved model answers and thinking settings. The home page uses a deep ocean-blue hero above a white comparison panel. With the local development flag enabled, it shows saved GPT comparisons and question evidence links. The public view shows pending official runs and a separate synthetic example.

## Colors

Start with near-black navy at the top. Use a wide elliptical gradient centered at the top, with horizontal radius 160% and vertical radius 100% of the backdrop. This bends the color bands into a shallow arc. Hold the navy through the 10% stop. Concentrate the bright blue at 78%, then fade to white at the default end stop. Apply the gradient to the home-page backdrop, not to data surfaces.

Set the root HTML background to the top gradient color so overscroll exposes navy. Keep the body and data surfaces white.

Overlay a short navy-to-transparent vertical gradient across the first 10rem of the ocean backdrop. This makes the entire top edge navy while retaining the elliptical fade below it.

Use translucent white for the first two heading lines and solid white for its last line and navigation. The muted heading color mixes 45% white with transparency. Clip 12px backdrop blur to the letter shapes with an SVG text clip path. Keep real HTML text selectable. Measure its word positions after font loading and resizing so the clip follows narrow-screen wrapping. Keep heading styles in its components with Tailwind; keep shared tokens in the global stylesheet. Keep essential text above the bright-to-white transition. Measure contrast against the rendered gradient at every supported width.

Use a white primary action with dark text, labeled "GitHub", with a Hugeicons GitHub mark in Fluid Button's `leadingIcon` slot. Label the secondary action "Play Krillion" and link it to Krillion.io. Give it Fluid's translucent white surface and backdrop blur. Keep result states neutral and explicit in text.

## Typography

Keep Stack Sans Text across navigation, headings, controls, and data. Preserve the approved light body weight and restrained heading weights. Use only its weight axis; it has no optical-size axis.

Use the larger hero role only for the home-page heading, at weight 400. Its declared size is the desktop maximum; use the responsive hero size token to reduce it on smaller viewports. Use one factual heading across three lines: "General knowledge", "benchmark for LLMs", and "on Krillion.io". Keep the first two lines translucent and the last line solid white. Do not add a subheading or slogan. Allow each line to wrap on narrow screens. Keep the Fluid type roles for comparison tables and supporting pages.

Use tabular figures for points and dates. Keep long answers readable and expandable. Do not truncate a value that visitors need to compare.

Append requested thinking effort to each model name in parentheses, such as `gpt-6.1-sol (low)`. Use this label in both comparison views. Keep the explanation that effective thinking settings are unverified beside the results.

## Layout

Keep navigation, the hero, the comparison panel, and the footer on shared horizontal edges. Let the gradient extend to the viewport edges while content remains inside the page margins.

Give the heading open vertical space. Place its actions directly below it. Keep the first comparison panel visible beneath the heading so the page's purpose is clear.

Keep provenance, saved date, shared coverage, model configurations, and mean native points in one comparison surface. Default to descending points; allow model order for thinking comparisons. Keep all current entries visible and preserve equal scores. Link the shared questions to complete answer evidence. Place scoring rules below the comparison. Use the desktop table when it fits and labeled response rows on narrow screens. Both views must use the same records and order. Read `docs/design/benchmark-comparison.md` for the reference research.

Use neutral white layouts on saved-day and methodology pages. Keep their shared navigation and type roles consistent with the home page.

## Elevation & Depth

Use the contrast between the ocean backdrop and the white panel to establish depth. Separate data groups with spacing and thin neutral rules. Preserve the Fluid row highlight without adding decorative shadows.

The home hero may show small company logos sinking through the ocean with gentle sway and bubble trails. Normalize each mark to about 16px visible extent. Each logo may bounce once against any edge or rounded corner of the comparison panel, then pass behind it. Let white marks descend to the gradient's white endpoint so they disappear naturally. Keep the effect behind content, at low opacity, and outside the accessibility tree. Use at most 12 logos and 40 pooled bubbles. Do not show an animation control, as requested. Stop when offscreen or the tab is hidden, and remove the effect when reduced motion is requested. Do not animate data surfaces or supporting pages.

Apply Tailwind's `backdrop-blur-sm` directly to each decorative company logo.

Use CSS scroll timelines for hero parallax during the first viewport of scrolling. The gradient moves at 25% of the content's scroll speed; the particle layer moves at 50%. Keep the heading, navigation, and results at normal speed. Hold the final layer offsets after that range. Disable parallax for reduced motion and browsers without scroll-timeline or animation-range support. Keep rules in the ocean component CSS module. Adjust the existing falling simulation's cached card bounds by the CSS particle-layer translation so the bounce remains aligned. Do not add a JavaScript scroll listener.

## Shapes

Use Fluid's pill treatment for controls, focus outlines, and row highlights. Use its container radius for large panels. Use full rounding for small badges. Keep table rules and internal sections aligned inside the panel.

## Components

Use Hugeicons' free Stroke Rounded set. Keep icons small beside visible text labels. Hide decorative icons from accessibility APIs.

Keep the results action as a page anchor and the method action as a navigation link. Visitors must not start model runs through the interface.

Use the installed Fluid Button, Badge, Accordion, Table, Subtle Tabs, and Input Group primitives. Compose page layouts around them. Keep navigation actions as anchors through Button's `asChild` prop.

Use Subtle Tabs for comparison order. Place model search to their right. On phones, place search on a full-width second row. Search matches model names without case sensitivity and changes visible rows only. Show a match count and a clear empty state. Keep the same filtering and order in both result views.

Keep desktop search at 160px, aligned to the panel's 24px content inset. Each evaluated model and thinking configuration occupies one comparison row. The current eight rows are subscription development evidence. Official OpenRouter results are pending; their final presentation depends on the frozen public protocol and saved coverage.

Use Fluid Accordion for attempt history. Keep each row independently expandable. Preserve keyboard activation, Hugeicons chevrons, reduced motion, and complete answer text. Scope the highlight to the trigger so the history remains on the data surface.

## Do's and Don'ts

- Keep result provenance next to the comparison title. Separate synthetic examples from measured development results.
- Keep requested thinking settings distinct from verified effective settings.
- Keep pending and incomplete scores as text.
- Preserve reduced motion, visible focus, and the skip link.
- Do not use color alone to communicate a result.
- Keep decorative motion within the approved home-hero effect.
- Do not add fictional ranks, unused filters, or fabricated dates.
- Do not present synthetic records as official measurements.
